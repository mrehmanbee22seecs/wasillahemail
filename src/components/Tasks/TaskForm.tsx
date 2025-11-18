import React, { useState } from 'react';
import { TaskPriority } from '../../types/tasks';

interface TaskFormProps {
  onSubmit: (data: {
    title: string;
    description?: string;
    priority?: TaskPriority;
    dueDate?: string;
  }) => Promise<void>;
}

const TaskForm: React.FC<TaskFormProps> = ({ onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }
    try {
      setSubmitting(true);
      await onSubmit({
        title,
        description,
        priority,
        dueDate: dueDate || undefined,
      });
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
    } catch (err: any) {
      setError(err?.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div>
        <label className="block text-xs font-semibold text-logo-navy mb-1">Task title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          placeholder="e.g. Confirm volunteer list"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-logo-navy mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          rows={2}
          placeholder="Optional details or steps..."
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <label className="block text-xs font-semibold text-logo-navy mb-1">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className="border border-gray-300 rounded-lg px-2 py-1 text-xs"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-logo-navy mb-1">Due date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1 text-xs"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="ml-auto px-4 py-2 rounded-lg bg-vibrant-orange text-white text-xs font-semibold hover:bg-vibrant-orange-dark disabled:opacity-50"
        >
          {submitting ? 'Adding...' : 'Add task'}
        </button>
      </div>
    </form>
  );
};

export default TaskForm;


