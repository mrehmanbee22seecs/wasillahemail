import React from 'react';
import { useTasks } from '../../hooks/useTasks';
import TaskCard from './TaskCard';

interface TaskListProps {
  projectId?: string;
  personal?: boolean;
}

const TaskList: React.FC<TaskListProps> = ({ projectId, personal }) => {
  const { tasks, loading, error, analytics, toggleStatus, deleteTask, addComment } = useTasks({
    projectId,
    personal,
  });

  if (loading) {
    return (
      <div className="text-xs text-gray-500 py-3">Loading tasks...</div>
    );
  }

  if (error) {
    return (
      <div className="text-xs text-red-600 py-3">{error}</div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-[11px] text-gray-600">
        <span>
          {analytics.total} task{analytics.total !== 1 ? 's' : ''} · {analytics.completionRate}% completed
        </span>
        {analytics.overdue > 0 && (
          <span className="text-red-600">
            {analytics.overdue} overdue
          </span>
        )}
      </div>
      {tasks.length === 0 ? (
        <div className="text-xs text-gray-500 py-2">No tasks yet.</div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleStatus={toggleStatus}
              onDelete={deleteTask}
              onAddComment={addComment}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskList;


