export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  dueDate: string;
  isCompleted: boolean;
  createdBy: string;
  priority: TaskPriority;
}