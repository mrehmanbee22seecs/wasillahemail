export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  projectId?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  createdAt: any;
  updatedAt: any;
  createdById: string;
  createdByName?: string;
  assignedToId?: string;
  assignedToName?: string;
  dependencies?: string[];
  notes?: string;
  reminderAt?: any;
  completedAt?: any;
  completedById?: string;
  timeSpentMinutes?: number;
  commentCount?: number;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  userName?: string;
  text: string;
  createdAt: any;
}

export interface TaskAnalyticsSummary {
  total: number;
  completed: number;
  inProgress: number;
  blocked: number;
  overdue: number;
  completionRate: number;
}


