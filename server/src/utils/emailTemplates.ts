import { env } from "../config/env";

const wrap = (title: string, bodyHtml: string, ctaUrl?: string, ctaLabel?: string) => `
  <div style="font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
    <div style="padding: 24px 0 8px;">
      <span style="font-size: 18px; font-weight: 700; color: #0f766e;">Flowbase</span>
    </div>
    <h2 style="font-size: 18px; margin: 16px 0 8px;">${title}</h2>
    <div style="font-size: 14px; line-height: 1.6; color: #374151;">${bodyHtml}</div>
    ${
      ctaUrl
        ? `<a href="${ctaUrl}" style="display:inline-block;margin-top:20px;padding:10px 20px;background:#0f766e;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">${ctaLabel}</a>`
        : ""
    }
    <p style="margin-top:32px;font-size:12px;color:#9ca3af;">You're receiving this because you're a member of a workspace on Flowbase.</p>
  </div>
`;

export function taskAssignedEmail(params: {
  taskTitle: string;
  projectName: string;
  assignedByName: string;
  dueDate?: Date;
  taskUrl: string;
}) {
  const dueLine = params.dueDate
    ? `<p style="margin-top:12px;"><strong>Due:</strong> ${params.dueDate.toDateString()}</p>`
    : "";
  return {
    subject: `You were assigned: "${params.taskTitle}"`,
    html: wrap(
      "You've been assigned a task",
      `<p><strong>${params.assignedByName}</strong> assigned you a task in <strong>${params.projectName}</strong>:</p>
       <p style="font-size:15px;font-weight:600;margin-top:8px;">${params.taskTitle}</p>
       ${dueLine}`,
      params.taskUrl,
      "View task"
    ),
  };
}

export function taskMentionEmail(params: {
  taskTitle: string;
  mentionedByName: string;
  commentSnippet: string;
  taskUrl: string;
}) {
  return {
    subject: `${params.mentionedByName} mentioned you on "${params.taskTitle}"`,
    html: wrap(
      "You were mentioned",
      `<p><strong>${params.mentionedByName}</strong> mentioned you in a comment on:</p>
       <p style="font-size:15px;font-weight:600;margin-top:8px;">${params.taskTitle}</p>
       <p style="margin-top:12px;padding:12px;background:#f3f4f6;border-radius:6px;color:#4b5563;">"${params.commentSnippet}"</p>`,
      params.taskUrl,
      "Reply"
    ),
  };
}

export function taskDueSoonEmail(params: { taskTitle: string; projectName: string; dueDate: Date; taskUrl: string }) {
  return {
    subject: `Reminder: "${params.taskTitle}" is due soon`,
    html: wrap(
      "A task you're on is due soon",
      `<p>This task in <strong>${params.projectName}</strong> is due soon:</p>
       <p style="font-size:15px;font-weight:600;margin-top:8px;">${params.taskTitle}</p>
       <p style="margin-top:12px;"><strong>Due:</strong> ${params.dueDate.toDateString()}</p>`,
      params.taskUrl,
      "View task"
    ),
  };
}

export function buildTaskUrl(workspaceId: string, projectId: string, taskId: string) {
  return `${env.CLIENT_URL}/app/${workspaceId}/projects/${projectId}/board?task=${taskId}`;
}