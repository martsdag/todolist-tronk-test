import { JSONFilePreset } from 'lowdb/node';
import { User } from '@/types/auth';
import { Task } from '@/types/tasks';

export interface Data {
  users: User[];
  tasks: Task[];
}

const defaultData: Data = { users: [], tasks: [] };

export const getDb = async () => {
  return await JSONFilePreset<Data>('db.json', defaultData);
};