import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, CheckCircle, Clock, User, Trash2 } from 'lucide-react';
import type { Task } from '../../../types';

interface EisenhowerMatrixProps {
  tasks: Task[];
  onTaskComplete: (id: string) => void;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (id: string) => void;
  onCreateTask: (quadrant?: string) => void;
}

interface QuadrantProps {
  title: string;
  description: string;
  tasks: Task[];
  color: string;
  icon: React.ReactNode;
  onTaskComplete: (id: string) => void;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (id: string) => void;
  onCreateTask: (quadrant: string) => void;
}

const Quadrant: React.FC<QuadrantProps> = ({
  title,
  description,
  tasks,
  color,
  icon,
  onTaskComplete,
  onTaskEdit,
  onTaskDelete,
  onCreateTask,
}) => {
  const { t } = useTranslation();

  return (
    <div className={`p-4 rounded-lg border-2 ${color} bg-opacity-10`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {icon}
          <div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-foreground-secondary">{description}</p>
          </div>
        </div>
        <button
          onClick={() => onCreateTask(title.toLowerCase().replace(' ', '_'))}
          className="btn-ghost p-2 hover:bg-background-secondary rounded-lg"
          title={`Add task to ${title}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2 min-h-[200px]">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-foreground-secondary">
            <p className="text-sm">No tasks in this quadrant</p>
            <button
              onClick={() => onCreateTask(title.toLowerCase().replace(' ', '_'))}
              className="btn-outline mt-2 text-xs"
            >
              Add Task
            </button>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="p-3 bg-background rounded-lg border border-border hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground truncate">{task.title}</h4>
                  {task.description && (
                    <p className="text-sm text-foreground-secondary mt-1 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.priority === 4 ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      task.priority === 3 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                      task.priority === 2 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      Priority {task.priority}
                    </span>
                    {task.due_date && (
                      <span className="text-xs text-foreground-secondary">
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-1 ml-2">
                  <button
                    onClick={() => onTaskComplete(task.id)}
                    className="p-1 hover:bg-green-100 dark:hover:bg-green-900 rounded"
                    title="Complete task"
                  >
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </button>
                  <button
                    onClick={() => onTaskEdit(task)}
                    className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded"
                    title="Edit task"
                  >
                    <Clock className="w-4 h-4 text-blue-600" />
                  </button>
                  <button
                    onClick={() => onTaskDelete(task.id)}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                    title="Delete task"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const EisenhowerMatrix: React.FC<EisenhowerMatrixProps> = ({
  tasks,
  onTaskComplete,
  onTaskEdit,
  onTaskDelete,
  onCreateTask,
}) => {
  const { t } = useTranslation();

  // Group tasks by quadrant
  const doTasks = tasks.filter(task => task.eisenhower_quadrant === 'do');
  const decideTasks = tasks.filter(task => task.eisenhower_quadrant === 'decide');
  const delegateTasks = tasks.filter(task => task.eisenhower_quadrant === 'delegate');
  const deleteTasks = tasks.filter(task => task.eisenhower_quadrant === 'delete');

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Eisenhower Matrix</h2>
        <p className="text-foreground-secondary">
          Organize your tasks by urgency and importance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Do First - Urgent & Important */}
        <Quadrant
          title="Do First"
          description="Urgent and Important"
          tasks={doTasks}
          color="border-red-500"
          icon={<div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>}
          onTaskComplete={onTaskComplete}
          onTaskEdit={onTaskEdit}
          onTaskDelete={onTaskDelete}
          onCreateTask={onCreateTask}
        />

        {/* Schedule - Important but Not Urgent */}
        <Quadrant
          title="Schedule"
          description="Important but Not Urgent"
          tasks={decideTasks}
          color="border-yellow-500"
          icon={<div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>}
          onTaskComplete={onTaskComplete}
          onTaskEdit={onTaskEdit}
          onTaskDelete={onTaskDelete}
          onCreateTask={onCreateTask}
        />

        {/* Delegate - Urgent but Not Important */}
        <Quadrant
          title="Delegate"
          description="Urgent but Not Important"
          tasks={delegateTasks}
          color="border-blue-500"
          icon={<div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">3</div>}
          onTaskComplete={onTaskComplete}
          onTaskEdit={onTaskEdit}
          onTaskDelete={onTaskDelete}
          onCreateTask={onCreateTask}
        />

        {/* Eliminate - Neither Urgent nor Important */}
        <Quadrant
          title="Eliminate"
          description="Neither Urgent nor Important"
          tasks={deleteTasks}
          color="border-gray-500"
          icon={<div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs font-bold">4</div>}
          onTaskComplete={onTaskComplete}
          onTaskEdit={onTaskEdit}
          onTaskDelete={onTaskDelete}
          onCreateTask={onCreateTask}
        />
      </div>

      {/* Matrix Legend */}
      <div className="bg-background-secondary rounded-lg p-4">
        <h3 className="font-semibold text-foreground mb-3">Matrix Guide</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-foreground mb-2">How to Use:</h4>
            <ul className="space-y-1 text-foreground-secondary">
              <li>• <strong>Do First:</strong> Handle immediately</li>
              <li>• <strong>Schedule:</strong> Plan for later</li>
              <li>• <strong>Delegate:</strong> Assign to others</li>
              <li>• <strong>Eliminate:</strong> Remove from list</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-2">Tips:</h4>
            <ul className="space-y-1 text-foreground-secondary">
              <li>• Focus on "Do First" tasks</li>
              <li>• Schedule time for "Schedule" tasks</li>
              <li>• Don't let "Delegate" tasks become urgent</li>
              <li>• Regularly review "Eliminate" tasks</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EisenhowerMatrix;