import { Request, Response, Router } from "express";
import { authService } from "./auth.service";
import { body } from "express-validator";
import { validationCheck } from "@/middleware/validationCheck";

const loginSchema = [
  body('email').isEmail().withMessage('Введите корректный email'),
  body('password').notEmpty().withMessage('Пароль обязателен'),
];

const registerSchema = [
  body('email').isEmail().withMessage('Введите корректный email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Пароль должен быть не менее 6 символов'),
];

const router = Router();

router.post('/login', loginSchema, validationCheck, async (req: Request, res: Response) => {
    const user = await authService.login(req.body);

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({ message: 'Login successful', user });
  }
);

router.post('/register', registerSchema, validationCheck, async (req: Request, res: Response) => {
    const newUser = await authService.register(req.body);

    if (!newUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    res.status(201).json({ message: 'User registered successfully', user: newUser });
  }
);

export { router as auth };