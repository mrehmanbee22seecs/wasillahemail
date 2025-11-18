import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Task, TaskAnalyticsSummary, TaskComment, TaskPriority, TaskStatus } from '../types/tasks';

interface UseTasksOptions {
  projectId?: string;
  personal?: boolean;
}

interface UseTasksReturn {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  analytics: TaskAnalyticsSummary;
  createTask: (data: {
    title: string;
    description?: string;
    priority?: TaskPriority;
    dueDate?: string;
    assignedToId?: string;
    assignedToName?: string;
  }) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  toggleStatus: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  addComment: (taskId: string, text: string) => Promise<void>;
}

const TASKS_COLLECTION = 'project_tasks';
const COMMENTS_COLLECTION = 'task_comments';

export function useTasks(options: UseTasksOptions = {}): UseTasksReturn {
  const { projectId, personal } = options;
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) {
      setTasks([]);
      setLoading(false);
      return;
    }

    let q;
    const col = collection(db, TASKS_COLLECTION);

    if (projectId) {
      q = query(col, where('projectId', '==', projectId), orderBy('createdAt', 'desc'));
    } else if (personal) {
      q = query(col, where('assignedToId', '==', currentUser.uid), orderBy('dueDate', 'asc'));
    } else {
      setTasks([]);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Task[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as any) });
        });
        setTasks(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error loading tasks:', err);
        setError('Failed to load tasks');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [projectId, personal, currentUser]);

  const analytics: TaskAnalyticsSummary = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'done').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const blocked = tasks.filter((t) => t.status === 'blocked').length;
    const now = new Date();
    const overdue = tasks.filter(
      (t) => t.dueDate && t.status !== 'done' && new Date(t.dueDate) < now
    ).length;

    const completionRate = total ? Math.round((completed / total) * 100) : 0;

    return { total, completed, inProgress, blocked, overdue, completionRate };
  }, [tasks]);

  const createTask: UseTasksReturn['createTask'] = useCallback(
    async ({ title, description, priority = 'medium', dueDate, assignedToId, assignedToName }) => {
      if (!currentUser) throw new Error('Not authenticated');
      if (!title.trim()) throw new Error('Task title is required');

      const col = collection(db, TASKS_COLLECTION);
      await addDoc(col, {
        title: title.trim(),
        description: description?.trim() || '',
        status: 'todo' as TaskStatus,
        priority,
        projectId: projectId || null,
        dueDate: dueDate || null,
        createdById: currentUser.uid,
        createdByName: currentUser.displayName || currentUser.email,
        assignedToId: assignedToId || null,
        assignedToName: assignedToName || null,
        dependencies: [],
        notes: '',
        reminderAt: null,
        completedAt: null,
        completedById: null,
        timeSpentMinutes: 0,
        commentCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    },
    [currentUser, projectId]
  );

  const updateTask: UseTasksReturn['updateTask'] = useCallback(
    async (taskId, updates) => {
      const ref = doc(db, TASKS_COLLECTION, taskId);
      await updateDoc(ref, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    },
    []
  );

  const toggleStatus: UseTasksReturn['toggleStatus'] = useCallback(
    async (taskId) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      const nextStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done';
      const ref = doc(db, TASKS_COLLECTION, taskId);
      await updateDoc(ref, {
        status: nextStatus,
        completedAt: nextStatus === 'done' ? serverTimestamp() : null,
        completedById: nextStatus === 'done' ? currentUser?.uid || null : null,
        updatedAt: serverTimestamp(),
      });
    },
    [tasks, currentUser]
  );

  const deleteTask: UseTasksReturn['deleteTask'] = useCallback(async (taskId) => {
    const ref = doc(db, TASKS_COLLECTION, taskId);
    await deleteDoc(ref);
  }, []);

  const addComment: UseTasksReturn['addComment'] = useCallback(
    async (taskId, text) => {
      if (!currentUser) throw new Error('Not authenticated');
      if (!text.trim()) return;

      const col = collection(db, COMMENTS_COLLECTION);
      const comment: Omit<TaskComment, 'id'> = {
        taskId,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email || 'User',
        text: text.trim(),
        createdAt: serverTimestamp(),
      };
      await addDoc(col, comment);

      // Best-effort increment comment count
      const taskRef = doc(db, TASKS_COLLECTION, taskId);
      await updateDoc(taskRef, {
        commentCount: (taskRef as any).commentCount || 0,
        updatedAt: serverTimestamp(),
      }).catch(() => {});
    },
    [currentUser]
  );

  return {
    tasks,
    loading,
    error,
    analytics,
    createTask,
    updateTask,
    toggleStatus,
    deleteTask,
    addComment,
  };
}


