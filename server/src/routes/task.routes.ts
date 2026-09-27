import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createTaskSchema, updateTaskStatusSchema } from "../validations/task.validation";
import {
  createTask,
  listTasks,
  getTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  addSubtask,
  listSubtasks,
  addDependency,
  removeDependency,
  setRecurrence,
} from "../controllers/task.controller";

const router = Router();
router.use(requireAuth);

router.post("/", validate(createTaskSchema), createTask);
router.get("/", listTasks);
router.get("/:taskId", getTask);
router.patch("/:taskId", updateTask);
router.patch("/:taskId/status", validate(updateTaskStatusSchema), updateTaskStatus);
router.delete("/:taskId", deleteTask);
router.post("/:taskId/subtasks", addSubtask);
router.get("/:taskId/subtasks", listSubtasks);
router.post("/:taskId/dependencies", addDependency);
router.delete("/:taskId/dependencies/:dependsOnTaskId", removeDependency);
router.patch("/:taskId/recurrence", setRecurrence);

export default router;
