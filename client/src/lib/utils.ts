import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function initials(name?: string): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function formatDate(date?: string | Date): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatDateTime(date?: string | Date): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function isOverdue(date?: string | Date): boolean {
  if (!date) return false;
  return new Date(date).getTime() < Date.now();
}

export const PRIORITY_COLORS: Record<string, string> = {
  Low: "bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20",
  Medium: "bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/20",
  High: "bg-orange-500/10 text-orange-600 dark:text-orange-300 border-orange-500/20",
  Urgent: "bg-red-500/10 text-red-600 dark:text-red-300 border-red-500/20",
};

export const STATUS_COLORS: Record<string, string> = {
  Backlog: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
  Todo: "bg-blue-500/10 text-blue-600 dark:text-blue-300",
  "In Progress": "bg-amber-500/10 text-amber-600 dark:text-amber-300",
  "In Review": "bg-violet-500/10 text-violet-600 dark:text-violet-300",
  Done: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
};
