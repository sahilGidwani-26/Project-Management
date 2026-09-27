import { Task } from "../models/Task";
import { User } from "../models/User";
import { Notification } from "../models/Notification";
import { sendMail } from "../utils/mailer";
import { taskDueSoonEmail, buildTaskUrl } from "../utils/emailTemplates";
import { Server as SocketIOServer } from "socket.io";

const CHECK_INTERVAL_MS = 30 * 60 * 1000; // every 30 minutes
const REMIND_WINDOW_HOURS = 24; // email once when a task is within 24h of its due date

/**
 * Polls for tasks whose due date is within the next 24 hours (and not yet
 * reminded, and not Done) and emails every assignee once. This is a simple
 * in-process interval rather than a separate cron package, so it starts
 * automatically with the server and needs no extra infrastructure.
 */
export function startDueDateReminderJob(io: SocketIOServer) {
  const run = async () => {
    try {
      const now = new Date();
      const windowEnd = new Date(now.getTime() + REMIND_WINDOW_HOURS * 60 * 60 * 1000);

      const dueSoonTasks = await Task.find({
        dueDate: { $gte: now, $lte: windowEnd },
        status: { $ne: "Done" },
        dueReminderSentAt: { $exists: false },
        assigneeIds: { $exists: true, $not: { $size: 0 } },
      })
        .populate<{ projectId: {
            [x: string]: any; name: string 
} }>("projectId", "name")
        .limit(200);

      for (const task of dueSoonTasks) {
        const users = await User.find({ _id: { $in: task.assigneeIds } }).select("email name notificationPreferences");
        const taskUrl = buildTaskUrl(task.workspaceId.toString(), task.projectId._id?.toString() || task.projectId.toString(), task._id.toString());

        for (const u of users) {
          await Notification.create({
            userId: u._id,
            type: "deadline",
            title: "Deadline approaching",
            message: `"${task.title}" is due soon`,
            relatedWorkspaceId: task.workspaceId,
            relatedProjectId: task.projectId,
            relatedTaskId: task._id,
          });
          io.to(`user:${u._id}`).emit("notification:new", { title: "Deadline approaching" });

          if (u.notificationPreferences?.deadlines !== false && task.dueDate) {
            const { subject, html } = taskDueSoonEmail({
              taskTitle: task.title,
              projectName: (task.projectId as unknown as { name: string })?.name || "your project",
              dueDate: task.dueDate,
              taskUrl,
            });
            sendMail(u.email, subject, html).catch(() => {});
          }
        }

        task.dueReminderSentAt = new Date();
        await task.save();
      }

      if (dueSoonTasks.length) {
        console.log(`[due-reminder] Sent reminders for ${dueSoonTasks.length} task(s)`);
      }
    } catch (err) {
      console.error("[due-reminder] Failed to run:", err);
    }
  };

  run(); // run once on boot
  setInterval(run, CHECK_INTERVAL_MS);
}