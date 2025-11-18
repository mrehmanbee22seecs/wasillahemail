import React from 'react';
import TaskForm from './TaskForm';
import TaskList from './TaskList';
import { useTasks } from '../../hooks/useTasks';

interface TaskManagerProps {
  projectId: string;
}

const TaskManager: React.FC<TaskManagerProps> = ({ projectId }) => {
  const { createTask } = useTasks({ projectId });

  return (
    <section className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
      <h2 className="text-sm sm:text-base font-semibold text-logo-navy mb-3">
        Project Tasks
      </h2>
      <TaskForm onSubmit={createTask} />
      <div className="mt-4">
        <TaskList projectId={projectId} />
      </div>
    </section>
  );
};

export default TaskManager;


