import React, { useState } from 'react';
import { CheckCircle2, Circle, Flag, Clock, MessageSquare, Trash2 } from 'lucide-react';
import { Task } from '../../types/tasks';

interface TaskCardProps {
  task: Task;
  onToggleStatus: (taskId: string) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  onAddComment: (taskId: string, text: string) => Promise<void>;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onToggleStatus, onDelete, onAddComment }) => {
  const [comment, setComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  const completed = task.status === 'done';

  const handleComment = async () => {
    if (!comment.trim()) return;
    try {
      setCommentLoading(true);
      await onAddComment(task.id, comment);
      setComment('');
    } finally {
      setCommentLoading(false);
    }
  };

  const priorityColor = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
  }[task.priority];

  return (
    <div className="border border-gray-200 rounded-xl p-3 bg-white flex flex-col gap-2">
      <div className="flex items-start gap-2">
        <button
          onClick={() => onToggleStatus(task.id)}
          className="mt-0.5 text-vibrant-orange"
          aria-label={completed ? 'Mark as incomplete' : 'Mark as done'}
        >
          {completed ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <Circle className="w-5 h-5" />
          )}
        </button>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div
                className={`text-sm font-semibold text-logo-navy ${
                  completed ? 'line-through text-gray-500' : ''
                }`}
              >
                {task.title}
              </div>
              {task.description && (
                <div className="text-xs text-gray-600 line-clamp-2">{task.description}</div>
              )}
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${priorityColor}`}>
              {task.priority.toUpperCase()}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] text-gray-500">
            {task.dueDate && (
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Due {task.dueDate}
              </span>
            )}
            {task.assignedToName && (
              <span className="inline-flex items-center gap-1">
                <Flag className="w-3 h-3" />
                {task.assignedToName}
              </span>
            )}
            {typeof task.commentCount === 'number' && task.commentCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {task.commentCount} comment{task.commentCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => onDelete(task.id)}
          className="ml-1 text-gray-400 hover:text-red-500"
          aria-label="Delete task"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 mt-1">
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a quick update or note..."
          className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-[11px]"
        />
        <button
          type="button"
          disabled={commentLoading}
          onClick={handleComment}
          className="px-2 py-1 rounded-lg bg-gray-100 text-[11px] text-gray-700 hover:bg-gray-200 disabled:opacity-50 flex items-center gap-1"
        >
          <MessageSquare className="w-3 h-3" />
          Add
        </button>
      </div>
    </div>
  );
};

export default TaskCard;


