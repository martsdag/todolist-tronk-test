import { getDb } from "@/database";
import { Task } from "@/types/tasks";
import { v4 as uuidv4 } from 'uuid';

class TasksService {
  async getAll(ownerId: string): Promise<Task[]> {
    const db = await getDb();
    return db.data.tasks.filter(task => task.ownerId === ownerId);
  }

  async create(taskData: Omit<Task, 'id' | 'ownerId' | 'isCompleted'>, ownerId: string): Promise<Task> {
    const db = await getDb();
    
    const newTask: Task = { 
      ...taskData, 
      id: uuidv4(), 
      ownerId,
      isCompleted: false
    };

    await db.update(({ tasks }) => tasks.push(newTask));
    return newTask;
  }

  async update(id: string, taskData: Partial<Task>, ownerId: string): Promise<Task | null> {
    const db = await getDb();
    let updatedTask: Task | null = null;

    await db.update(({ tasks }) => {
      const index = tasks.findIndex(task => task.id === id && task.ownerId === ownerId);
      if (index !== -1) {
        tasks[index] = { ...tasks[index], ...taskData };
        updatedTask = tasks[index];
      }
    });

    return updatedTask;
  }

  async delete(id: string, ownerId: string): Promise<boolean> {
    const db = await getDb();
    const initialLength = db.data.tasks.length;
    
    await db.update(({ tasks }) => {
      const index = tasks.findIndex(task => task.id === id && task.ownerId === ownerId);
      if (index !== -1) tasks.splice(index, 1);
    });

    return db.data.tasks.length !== initialLength;
  }
}

export const tasksService = new TasksService();