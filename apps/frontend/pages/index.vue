<template>
  <div class="container mx-auto p-4 max-w-5xl">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
      <h1 class="text-2xl font-bold">Мой список задач</h1>

      <UModal
        v-model:open="isModalOpen"
        :title="isEditingMode ? 'Редактировать задачу' : 'Новая задача'"
      >
        <UButton icon="i-lucide-plus" @click="openCreateModal" class="w-full sm:w-auto">
          Добавить задачу
        </UButton>

        <template #body>
          <UForm
            id="task-form"
            :schema="taskSchema"
            :state="state"
            @submit="handleSubmit"
          >
            <div class="flex flex-col gap-3">
              <UFormField name="title" class="w-full">
                <UInput
                  color="neutral"
                  variant="subtle"
                  class="w-full"
                  placeholder="Название задачи"
                  v-model="state.title"
                />
              </UFormField>

              <UFormField name="description" class="w-full">
                <UTextarea
                  color="neutral"
                  variant="subtle"
                  class="w-full"
                  placeholder="Описание задачи"
                  v-model="state.description"
                />
              </UFormField>

              <div class="flex flex-col sm:flex-row gap-3">
                <UFormField name="dueDate" class="w-full">
                  <UInput
                    type="date"
                    class="w-full"
                    color="neutral"
                    variant="subtle"
                    v-model="state.dueDate"
                    :min="today"
                  />
                </UFormField>

                <UFormField name="priority" class="w-full">
                  <USelect
                    color="neutral"
                    variant="subtle"
                    class="w-full"
                    placeholder="Приоритет"
                    :items="['low', 'medium', 'high']"
                    v-model="state.priority"
                  />
                </UFormField>
              </div>
            </div>
          </UForm>
        </template>

        <template #footer>
          <UButton
            label="Отмена"
            color="neutral"
            variant="subtle"
            @click="isModalOpen = false"
          />
          <UButton
            form="task-form"
            type="submit"
            :label="isEditingMode ? 'Сохранить' : 'Создать задачу'"
            loading-auto
          />
        </template>
      </UModal>

      <UModal v-model:open="isDeleteModalOpen" title="Удалить задачу">
        <template #body>
          <p class="text-sm text-gray-400">
            Вы действительно хотите удалить задачу
            <span class="font-semibold text-gray-800 dark:text-gray-100">
              "{{ taskToDelete?.title }}"
            </span>?
            Это действие нельзя отменить.
          </p>
        </template>
        <template #footer>
          <UButton
            label="Отмена"
            color="neutral"
            variant="subtle"
            @click="isDeleteModalOpen = false"
          />
          <UButton
            label="Удалить"
            color="error"
            loading-auto
            @click="deleteTask"
          />
        </template>
      </UModal>
    </div>

    <USeparator type="dashed" class="mb-3" />

    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2 mb-3">
      <div>
        <UTabs
          color="neutral"
          variant="link"
          :content="false"
          :items="tabsItems"
          v-model="selectedTab"
          class="min-w-max"
        />
      </div>

      <USelect
        color="neutral"
        variant="subtle"
        :items="['По приоритету', 'По дедлайну']"
        class="w-full sm:w-40"
        placeholder="Сортировка"
        v-model="sortBy"
      />
    </div>

    <div v-if="pending" class="space-y-2">
      <USkeleton v-for="i in 6" :key="i" class="w-full h-10 rounded-md" />
    </div>

    <div v-else class="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
      <UTable
        ref="table"
        :columns="columns"
        :data="filteredTasks"
        rowKey="id"
        class="min-w-105"
      >
        <template #action-cell="{ row }">
          <UDropdownMenu :items="getDropdownActions(row.original)">
            <UButton
              icon="i-lucide-ellipsis-vertical"
              color="neutral"
              variant="ghost"
            />
          </UDropdownMenu>
        </template>
      </UTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod'
import type { DropdownMenuItem, TableColumn, TabsItem } from '@nuxt/ui'
import type { Task } from '~/types'

const taskSchema = z.object({
  title: z.string().trim().min(1, 'Заголовок обязателен'),
  description: z.string().trim().min(1, 'Описание обязательно'),
  dueDate: z.string().min(1, 'Дата обязательна'),
  isCompleted: z.boolean().optional(),
  priority: z.enum(['low', 'medium', 'high'], { message: 'Приоритет обязателен' }),
})

type TaskForm = z.infer<typeof taskSchema>

const editingId = ref<string | null>(null);
const isModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const taskToDelete = ref<Task | null>(null);
const selectedTab = ref('all');
const sortBy = ref<string | undefined>(undefined);
const table = useTemplateRef('table');
const toast = useToast();

const state = reactive<Partial<TaskForm>>({
  title: '',
  description: '',
  dueDate: '',
  isCompleted: false,
  priority: undefined,
})

const today = new Date().toISOString().split('T')[0]

const isEditingMode = computed(() => !!editingId.value)

const resetState = () => {
  Object.assign(state, { title: '', description: '', dueDate: '', priority: undefined })
  editingId.value = null
}

const openCreateModal = () => {
  resetState()
  isModalOpen.value = true
}

const openEditModal = (task: Task) => {
  editingId.value = task.id
  Object.assign(state, {
    title: task.title,
    description: task.description,
    dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
    priority: task.priority,
  })
  isModalOpen.value = true
}

const { data: tasks, pending } = useAPI<Array<Task>>('/tasks', { key: 'tasks-list' })
const { $api } = useNuxtApp()

const toggleComplete = async (task: Task) => {
  try {
    await $api(`/tasks/${task.id}`, {
      method: 'PUT',
      body: { ...task, isCompleted: !task.isCompleted },
    })
    await refreshNuxtData('tasks-list')
  } catch (err) {
    console.error('Ошибка при обновлении статуса:', err)
    toast.add({
      title: 'Ошибка',
      description: 'Не удалось обновить статус задачи',
      color: 'error',
    })
  }
}

const confirmDelete = (task: Task) => {
  taskToDelete.value = task
  isDeleteModalOpen.value = true
}

const deleteTask = async () => {
  if (!taskToDelete.value){
    return
  }
  try {
    await $api(`/tasks/${taskToDelete.value.id}`, { method: 'DELETE' })
    toast.add({ title: 'Задача удалена!', color: 'success' })
    await refreshNuxtData('tasks-list')
  } catch (err) {
    console.error(err)
    toast.add({
      title: 'Ошибка',
      description: 'Не удалось удалить задачу',
      color: 'error',
    })
  } finally {
    isDeleteModalOpen.value = false
    taskToDelete.value = null
  }
}

const handleSubmit = async () => {
  try {
    if (isEditingMode.value && editingId.value) {
      await $api(`/tasks/${editingId.value}`, {
        method: 'PUT',
        body: state,
      })
      toast.add({ title: 'Задача обновлена', color: 'success' })
    } else {
      await $api('/tasks', {
        method: 'POST',
        body: state,
      })
      toast.add({ title: 'Задача создана', color: 'success' })
    }
    await refreshNuxtData('tasks-list')
    isModalOpen.value = false
  } catch (err) {
    console.error('Ошибка при сохранении:', err)
    toast.add({
      title: 'Ошибка',
      description: 'Не удалось сохранить задачу',
      color: 'error',
    })
  }
}

const UBadge = resolveComponent('UBadge')
const UCheckbox = resolveComponent('UCheckbox')

const columns: TableColumn<Task>[] = [
  {
    id: 'isCompleted',
    header: 'Готово',
    cell: ({ row }) =>
      h(UCheckbox, {
        modelValue: row.original.isCompleted,
        'onUpdate:modelValue': () => toggleComplete(row.original),
        'aria-label': 'Отметить выполненной',
      }),
  },
  {
    accessorKey: 'title',
    header: 'Название',
    cell: ({ row }) =>
      h(
        'span',
        { class: `block max-w-xs truncate ${row.original.isCompleted ? 'line-through text-gray-400' : ''}` },
        row.getValue('title'),
      ),
  },
  {
    accessorKey: 'priority',
    header: 'Приоритет',
    cell: ({ row }) => {
      const color = { high: 'error', medium: 'warning', low: 'success' }[
        row.getValue('priority') as string
      ]
      return h(UBadge, { class: 'capitalize', variant: 'subtle', color }, () =>
        row.getValue('priority'),
      )
    },
  },
  { id: 'action' },
]

const getDropdownActions = (task: Task): DropdownMenuItem[][] => [
  [
    { label: 'Edit', icon: 'i-lucide-edit', onSelect: () => openEditModal(task) },
    { label: 'Delete', icon: 'i-lucide-trash', color: 'error', onSelect: () => confirmDelete(task) },
  ],
]

const tabsItems = ref<TabsItem[]>([
  { label: 'Все задачи', value: 'all' },
  { label: 'Активные', value: 'active' },
  { label: 'Выполненные', value: 'completed' },
])

const filteredTasks = computed(() => {
  if (!tasks.value) {
    return []
  }

  let result = tasks.value

  if (selectedTab.value === 'completed') {
    result = result.filter(task => task.isCompleted)
  } else if (selectedTab.value === 'active') {
    result = result.filter(task => !task.isCompleted)
  }

  if (sortBy.value === 'По дедлайну') {
    result = [...result].sort((a, b) => {
      if (!a.dueDate) {
        return 1
      }
      if (!b.dueDate) {
        return -1
      }
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    })
  } else if (sortBy.value === 'По приоритету') {
    const order: Record<string, number> = { high: 0, medium: 1, low: 2 }
    result = [...result].sort(
      (a, b) => (order[a.priority ?? 'low'] ?? 2) - (order[b.priority ?? 'low'] ?? 2),
    )
  }

  return result
})
</script>