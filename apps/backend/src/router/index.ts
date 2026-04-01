import { auth } from "@/modules/auth/auth.controllers";
import { tasks } from "@/modules/tasks/tasks.controllers";
import { Router } from "express";

const router = Router();

router.use('/auth', auth);
router.use('/tasks', tasks);

export default router;