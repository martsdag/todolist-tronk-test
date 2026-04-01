<template>
  <div class="flex items-center justify-center min-h-screen relative">
    <div class="relative shadow-md rounded-lg p-8 w-60 bg-slate-300 dark:bg-slate-800">
      <h2 class="text-xl font-medium text-slate-800 dark:text-slate-300 text-center mb-4">
        {{'To-Do List'}}
      </h2>
      <p class="text-xs font-medium text-slate-800 dark:text-slate-300 text-center mb-4">
        {{ 'Управляйте задачами эффективно' }}
      </p>
      <UForm :schema="schema" class="flex flex-col" :state="model" @submit="onSubmit">
        <UFormField name="email" class="mb-4">
          <UInput v-model="model.email" placeholder="Email" />
        </UFormField>

        <UFormField name="password" class="mb-4">
          <UInput v-model="model.password" type="password" placeholder="Пароль" />
        </UFormField>

        <UButton class="max-w-20 self-center" type="submit" loading-auto>
          {{'Войти'}}
        </UButton>
      </UForm>
    </div>
  </div>
</template>

<script setup lang="ts">
import z from 'zod';

const model = ref({
  email: '',
  password: ''
});

const schema = z.object({
  email: z.string().min(1),
  password: z.string().min(1)
})

const { $auth } = useNuxtApp();

const onSubmit = async () => {
  try {
    await $auth.login(model.value)
    navigateTo('/');
  } catch (e) {
   console.error('Login failed', e);
   model.value.password = '';
  }
}
</script>