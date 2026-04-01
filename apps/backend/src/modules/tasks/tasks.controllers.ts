import { Request, Response, Router } from "express";
import { tasksService } from "./tasks.service";
import { authenticateToken } from "@/middleware/auth.middleware";
import { validationCheck } from "@/middleware/validationCheck";
import { body } from "express-validator";

const taskSchema = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('dueDate').isISO8601().toDate().withMessage('Due date must be a valid date'),
  body('priority').isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
  body('isCompleted').isBoolean().withMessage('isCompleted must be a boolean'),
];

const router = Router();

router.use(authenticateToken);

router.get('/', async (req, res) => {
  const { userId } = (req as any).user;
  try {
    const tasks = await tasksService.getAll(userId);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error reading database' });
  }
});

router.post('/', taskSchema, validationCheck, async (req: Request, res: Response) => {
    const user = (req as any).user;

    try {
      const newTask = await tasksService.create(
        { ...req.body, createdBy: user.email }, 
        user.userId
      );
      res.status(201).json(newTask);
    } catch (error) {
      res.status(500).json({ message: 'Error saving task' });
    }
  }
);

router.put('/:id', taskSchema, validationCheck, async (req: Request, res: Response) => {
  const { userId } = (req as any).user;
  
  try {
    const updatedTask = await tasksService.update(req.params.id as string, req.body, userId);
    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found or access denied' });
    } 
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Error updating task' });
  }
});

router.delete('/:id', async (req, res) => {
  const { userId } = (req as any).user;
  const isDeleted = await tasksService.delete(req.params.id, userId);
  
  if (!isDeleted) {
    return res.status(404).json({ message: 'Task not found or access denied' });
  }
  res.status(204).send();
});

export { router as tasks };