import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { ApiError } from "../utils/ApiError";
import { sendSuccess, sendPaginated } from "../utils/ApiResponse";
import { Task } from "../models/Task";
import { Notification } from "../models/Notification";
import { ActivityLog } from "../models/ActivityLog";
import { User } from "../models/User";
import { sendMail } from "../utils/mailer";
import { taskAssignedEmail, buildTaskUrl } from "../utils/emailTemplates";
import { Server as SocketIOServer } from "socket.io";

function getIO(req: Request): SocketIOServer {
  return req.app.get("io");
}

async function notifyAssignees(params: {
  req: Request;
  assigneeIds: string[];
  taskId: string;
  taskTitle: string;
  workspaceId: string;
  projectId: string;
  projectName: string;
  assignedByName: string;
  dueDate?: Date;
  excludeUserId?: string;
}) {
  const targets = params.assigneeIds.filter((id) => id !== params.excludeUserId);
  if (!targets.length) return;

  const users = await User.find({ _id: { $in: targets } }).select("email name notificationPreferences");
  const taskUrl = buildTaskUrl(params.workspaceId, params.projectId, params.taskId);

  await Promise.all(
    users.map(async (u) => {
      await Notification.create({
        userId: u._id,
        type: "task_assigned",
        title: "New task assigned",
        message: `You were assigned to "${params.taskTitle}"`,
        relatedWorkspaceId: params.workspaceId,
        relatedProjectId: params.projectId,
        relatedTaskId: params.taskId,
      });
      params.req.app.get("io").to(`user:${u._id}`).emit("notification:new", { title: "New task assigned" });

      if (u.notificationPreferences?.taskAssigned !== false) {
        const { subject, html } = taskAssignedEmail({
          taskTitle: params.taskTitle,
          projectName: params.projectName,
          assignedByName: params.assignedByName,
          dueDate: params.dueDate,
          taskUrl,
        });
        sendMail(u.email, subject, html).catch(() => {});
      }
    })
  );
}

export const createTask = catchAsync(async (req: Request, res: Response) => {
  const {
    workspaceId,
    projectId,
    title,
    description,
    assigneeIds,
    status,
    priority,
    startDate,
    dueDate,
    labels,
    subtasks,
  } = req.body as {
    workspaceId: string;
    projectId: string;
    title: string;
    description?: string;
    assigneeIds?: string[];
    status: string;
    priority: string;
    startDate?: string;
    dueDate?: string;
    labels?: string[];
    subtasks?: string[];
  };

  const lastTask = await Task.findOne({ projectId, status }).sort({ order: -1 });
  const order = (lastTask?.order ?? 0) + 1;

  const task = await Task.create({
    workspaceId,
    projectId,
    title,
    description,
    assigneeIds: assigneeIds || [],
    status,
    priority,
    startDate,
    dueDate,
    labels,
    order,
    reporterId: req.user!.id,
    createdBy: req.user!.id,
  });

  if (subtasks?.length) {
    await Task.insertMany(
      subtasks.filter(Boolean).map((subtaskTitle) => ({
        workspaceId,
        projectId,
        parentTaskId: task._id,
        title: subtaskTitle,
        reporterId: req.user!.id,
        createdBy: req.user!.id,
        status: "Todo",
      }))
    );
  }

  const project = await task.populate<{ projectId: { name: string } }>("projectId", "name");
  const reporter = await User.findById(req.user!.id).select("name");

  await notifyAssignees({
    req,
    assigneeIds: (assigneeIds || []).map(String),
    taskId: task._id.toString(),
    taskTitle: title,
    workspaceId,
    projectId,
    projectName: (project.projectId as unknown as { name: string })?.name || "your project",
    assignedByName: reporter?.name || "Someone",
    dueDate: dueDate ? new Date(dueDate) : undefined,
    excludeUserId: req.user!.id,
  });

  await ActivityLog.create({
    workspaceId,
    actorId: req.user!.id,
    action: "task_created",
    resourceType: "Task",
    resourceId: task._id,
    metadata: { title },
  });

  const populated = await Task.findById(task._id).populate("assigneeIds", "name profileImage").populate("reporterId", "name profileImage");

  getIO(req).to(`project:${projectId}`).emit("task:created", populated);

  return sendSuccess(res, 201, populated, "Task created");
});

export const listTasks = catchAsync(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 50;
  const {
    projectId,
    assigneeId,
    createdBy,
    status,
    priority,
    label,
    search,
    sort,
  } = req.query as Record<string, string>;

  const isValidObjectId = (v?: string) => !!v && /^[0-9a-fA-F]{24}$/.test(v);

  const filter: Record<string, unknown> = {};
  if (isValidObjectId(projectId)) filter.projectId = projectId;
  if (isValidObjectId(assigneeId)) filter.assigneeIds = assigneeId;
  if (isValidObjectId(createdBy)) filter.createdBy = createdBy;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (label) filter.labels = label;
  if (search) filter.$text = { $search: search };

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    dueDate: { dueDate: 1 },
    priority: { priority: -1 },
    created: { createdAt: -1 },
  };

  const [items, total] = await Promise.all([
    Task.find(filter)
      .sort(sortMap[sort] || { order: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("assigneeIds", "name profileImage")
      .populate("reporterId", "name profileImage")
      .populate("createdBy", "name profileImage"),
    Task.countDocuments(filter),
  ]);

  return sendPaginated(res, items, page, limit, total, "Tasks");
});

export const getTask = catchAsync(async (req: Request, res: Response) => {
  const task = await Task.findById(req.params.taskId)
    .populate("assigneeIds", "name profileImage email")
    .populate("reporterId", "name profileImage email")
    .populate("createdBy", "name profileImage email")
    .populate("dependencies", "title status");
  if (!task) throw ApiError.notFound("Task not found");
  return sendSuccess(res, 200, task, "Task");
});

export const updateTask = catchAsync(async (req: Request, res: Response) => {
  const previous = await Task.findById(req.params.taskId);
  if (!previous) throw ApiError.notFound("Task not found");

  const task = await Task.findByIdAndUpdate(req.params.taskId, req.body, { new: true })
    .populate("assigneeIds", "name profileImage")
    .populate("reporterId", "name profileImage");
  if (!task) throw ApiError.notFound("Task not found");

  if (req.body.assigneeIds) {
    const before = new Set(previous.assigneeIds.map(String));
    const newlyAdded = (req.body.assigneeIds as string[]).filter((id) => !before.has(id));
    if (newlyAdded.length) {
      const project = await task.populate<{ projectId: { name: string } }>("projectId", "name");
      const actor = await User.findById(req.user!.id).select("name");
      await notifyAssignees({
        req,
        assigneeIds: newlyAdded,
        taskId: task._id.toString(),
        taskTitle: task.title,
        workspaceId: task.workspaceId.toString(),
        projectId: task.projectId.toString(),
        projectName: (project.projectId as unknown as { name: string })?.name || "your project",
        assignedByName: actor?.name || "Someone",
        dueDate: task.dueDate,
        excludeUserId: req.user!.id,
      });
    }
  }

  getIO(req).to(`project:${task.projectId}`).emit("task:updated", task);
  return sendSuccess(res, 200, task, "Task updated");
});

export const updateTaskStatus = catchAsync(async (req: Request, res: Response) => {
  const { status, order } = req.body;
  const task = await Task.findByIdAndUpdate(
    req.params.taskId,
    { status, ...(order !== undefined ? { order } : {}) },
    { new: true }
  );
  if (!task) throw ApiError.notFound("Task not found");

  getIO(req).to(`project:${task.projectId}`).emit("task:moved", { taskId: task._id, status: task.status, order: task.order });

  if (status === "Done" && task.assigneeIds.length) {
    await Notification.create({
      userId: task.reporterId,
      type: "task_completed",
      title: "Task completed",
      message: `"${task.title}" was marked as Done`,
      relatedProjectId: task.projectId,
      relatedTaskId: task._id,
    });
  }

  if (status === "Done" && task.recurrence?.active) {
    const nextDue = computeNextDueDate(task.dueDate || new Date(), task.recurrence);
    const nextTask = await Task.create({
      workspaceId: task.workspaceId,
      projectId: task.projectId,
      title: task.title,
      description: task.description,
      assigneeIds: task.assigneeIds,
      reporterId: task.reporterId,
      priority: task.priority,
      status: "Todo",
      dueDate: nextDue,
      labels: task.labels,
      milestoneId: task.milestoneId,
      recurrence: task.recurrence,
      recurrenceSourceId: task.recurrenceSourceId || task._id,
      createdBy: task.createdBy,
    });
    getIO(req).to(`project:${task.projectId}`).emit("task:created", nextTask);
  }

  return sendSuccess(res, 200, task, "Task status updated");
});

export const deleteTask = catchAsync(async (req: Request, res: Response) => {
  const task = await Task.findByIdAndDelete(req.params.taskId);
  if (task) getIO(req).to(`project:${task.projectId}`).emit("task:deleted", { taskId: task._id });
  return sendSuccess(res, 200, null, "Task deleted");
});

export const addSubtask = catchAsync(async (req: Request, res: Response) => {
  const parent = await Task.findById(req.params.taskId);
  if (!parent) throw ApiError.notFound("Parent task not found");

  const subtask = await Task.create({
    workspaceId: parent.workspaceId,
    projectId: parent.projectId,
    parentTaskId: parent._id,
    title: req.body.title,
    reporterId: req.user!.id,
    createdBy: req.user!.id,
  });

  return sendSuccess(res, 201, subtask, "Subtask added");
});

export const listSubtasks = catchAsync(async (req: Request, res: Response) => {
  const subtasks = await Task.find({ parentTaskId: req.params.taskId }).populate("assigneeIds", "name profileImage");
  return sendSuccess(res, 200, subtasks, "Subtasks");
});

export const addDependency = catchAsync(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const { dependsOnTaskId } = req.body;

  if (taskId === dependsOnTaskId) throw ApiError.badRequest("A task cannot depend on itself");

  const wouldCycle = await createsCycle(taskId, dependsOnTaskId);
  if (wouldCycle) throw ApiError.badRequest("This dependency would create a circular dependency loop");

  const task = await Task.findByIdAndUpdate(
    taskId,
    { $addToSet: { dependencies: dependsOnTaskId } },
    { new: true }
  ).populate("dependencies", "title status");
  if (!task) throw ApiError.notFound("Task not found");

  return sendSuccess(res, 200, task, "Dependency added");
});

export const removeDependency = catchAsync(async (req: Request, res: Response) => {
  const { taskId, dependsOnTaskId } = req.params;
  const task = await Task.findByIdAndUpdate(taskId, { $pull: { dependencies: dependsOnTaskId } }, { new: true });
  if (!task) throw ApiError.notFound("Task not found");
  return sendSuccess(res, 200, task, "Dependency removed");
});

async function createsCycle(taskId: string, dependsOnTaskId: string): Promise<boolean> {
  const visited = new Set<string>();
  const queue: string[] = [dependsOnTaskId];

  while (queue.length) {
    const current = queue.shift()!;
    if (current === taskId) return true;
    if (visited.has(current)) continue;
    visited.add(current);

    const currentTask = await Task.findById(current).select("dependencies");
    if (currentTask?.dependencies?.length) {
      queue.push(...currentTask.dependencies.map((d) => d.toString()));
    }
  }
  return false;
}

export const setRecurrence = catchAsync(async (req: Request, res: Response) => {
  const { frequency, intervalDays, active } = req.body;
  const task = await Task.findByIdAndUpdate(
    req.params.taskId,
    { recurrence: { frequency, intervalDays, active } },
    { new: true }
  );
  if (!task) throw ApiError.notFound("Task not found");
  return sendSuccess(res, 200, task, "Recurrence updated");
});

function computeNextDueDate(current: Date, recurrence: { frequency: string; intervalDays?: number }): Date {
  const next = new Date(current);
  switch (recurrence.frequency) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    case "custom":
      next.setDate(next.getDate() + (recurrence.intervalDays || 7));
      break;
  }
  return next;
}