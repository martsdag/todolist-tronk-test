import { getDb } from '@/database';
import { Login, Register, User } from '@/types/auth';
import { v4 as uuidv4 } from 'uuid';
import { comparePasswords, hashPassword } from './security';
import jwt from 'jsonwebtoken';

const JWT_SECRET = String(process.env.JWT_SECRET);

class AuthService {
  async register(data: Register): Promise<User | null> {
    const db = await getDb();
    
    const existingUser = db.data.users.find(user => user.email === data.email);
    if (existingUser){
      return null;
    }
    
    const newUser: User = {
      id: uuidv4(),
      email: data.email,
      password: hashPassword(data.password),
    };

    await db.update(({ users }) => users.push(newUser));
    return newUser;
  }

  async login(data: Login) {
    const db = await getDb();
    const user = db.data.users.find(user => user.email === data.email);
    
    if (user && comparePasswords(data.password, user.password)) {
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '1d' }
      );

      return { user, token };
    }
    return null;
  }
}

export const authService = new AuthService();