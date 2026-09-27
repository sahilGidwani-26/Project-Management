export interface User {
  _id: string;
  name: string;
  email: string;
  profileImage?: string;
  jobTitle?: string;
  bio?: string;
  isSuperAdmin?: boolean;
}

export type WorkspaceRole = "OWNER" | "ADMIN" | "PROJECT_MANAGER" | "MEMBER" | "VIEWER";

export interface Workspace {
  _id: string;
  name: string;
  description?: string;
  slug: string;
  logo?: string;
  myRole?: WorkspaceRole;
}

export interface WorkspaceMember {
  _id: string;
  userId: User;
  role: WorkspaceRole;
  status: string;
}

export type ProjectStatus = "Planning" | "Active" | "On Hold" | "Completed" | "Archived";
export type Priority = "Low" | "Medium" | "High" | "Urgent";

export interface Project {
  _id: string;
  workspaceId: string;
  name: string;
  slug: string;
  description?: string;
  managerId?: User;
  members: User[];
  status: ProjectStatus;
  priority: Priority;
  startDate?: string;
  endDate?: string;
  color: string;
  progress: number;
  createdAt: string;
}

export type TaskStatus = "Backlog" | "Todo" | "In Progress" | "In Review" | "Done";

export interface Task {
  _id: string;
  workspaceId: string;
  projectId: string;
  parentTaskId?: string;
  title: string;
  description?: string;
  assigneeIds: User[];
  reporterId?: User;
  createdBy?: User;
  status: TaskStatus;
  priority: Priority;
  startDate?: string;
  dueDate?: string;
  labels: string[];
  order: number;
  estimatedMinutes?: number;
  actualMinutes?: number;
  createdAt: string;
}

export interface Comment {
  _id: string;
  taskId: string;
  userId: User;
  content: string;
  mentions?: User[];
  createdAt: string;
}

export interface Attachment {
  _id: string;
  taskId?: string;
  projectId?: string;
  uploadedBy: User;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

export interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface Channel {
  _id: string;
  workspaceId: string;
  type: "channel" | "dm";
  name?: string;
  description?: string;
  isPrivate: boolean;
  members: string[];
  lastMessageAt?: string;
}

export interface Message {
  _id: string;
  channelId: string;
  senderId: User;
  content: string;
  reactions: { emoji: string; userId: string }[];
  editedAt?: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}