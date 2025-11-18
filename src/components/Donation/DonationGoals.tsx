/**
 * Donation Goals Component
 * Displays and manages donation goals for NGOs
 */

import React, { useEffect, useState } from 'react';
import {
  Target,
  TrendingUp,
  Calendar,
  Plus,
  Edit,
  Trash2,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getNgoDonationGoals,
  createDonationGoal,
  getProjectDonations,
} from '../../services/donationService';
import { DonationGoal } from '../../types/donation';

interface DonationGoalsProps {
  ngoId: string;
  projectId?: string;
  showCreateForm?: boolean;
}

export const DonationGoals: React.FC<DonationGoalsProps> = ({
  ngoId,
  projectId,
  showCreateForm = false,
}) => {
  const { currentUser, isAdmin } = useAuth();
  const [goals, setGoals] = useState<DonationGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(showCreateForm);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetAmount: 10000,
    deadline: '',
  });

  useEffect(() => {
    loadGoals();
  }, [ngoId]);

  const loadGoals = async () => {
    setLoading(true);
    try {
      const goalsData = await getNgoDonationGoals(ngoId);
      // Filter by project if specified
      const filtered = projectId
        ? goalsData.filter((g) => g.projectId === projectId)
        : goalsData;
      setGoals(filtered);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createDonationGoal({
        ngoId,
        projectId,
        title: formData.title,
        description: formData.description,
        targetAmount: formData.targetAmount,
        currency: 'PKR',
        deadline: formData.deadline
          ? new Date(formData.deadline)
          : undefined,
        isActive: true,
      });

      // Reset form and reload goals
      setFormData({
        title: '',
        description: '',
        targetAmount: 10000,
        deadline: '',
      });
      setShowForm(false);
      loadGoals();
    } catch (error) {
      console.error('Error creating goal:', error);
      alert('Failed to create goal');
    }
  };

  const getProgress = (goal: DonationGoal) => {
    return (goal.currentAmount / goal.targetAmount) * 100;
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-600';
    if (progress >= 75) return 'bg-blue-600';
    if (progress >= 50) return 'bg-yellow-600';
    return 'bg-orange-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const canManageGoals = isAdmin || currentUser?.uid === ngoId;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Donation Goals
        </h2>
        {canManageGoals && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Goal
          </button>
        )}
      </div>

      {/* Create Goal Form */}
      {showForm && canManageGoals && (
        <form
          onSubmit={handleCreateGoal}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-4"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Create New Goal
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Goal Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700"
              placeholder="e.g., Build a School Library"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700"
              placeholder="Describe what this goal will achieve..."
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Amount (PKR) *
              </label>
              <input
                type="number"
                required
                min="1000"
                value={formData.targetAmount}
                onChange={(e) =>
                  setFormData({ ...formData, targetAmount: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Deadline (Optional)
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setFormData({
                  title: '',
                  description: '',
                  targetAmount: 10000,
                  deadline: '',
                });
              }}
              className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Create Goal
            </button>
          </div>
        </form>
      )}

      {/* Goals List */}
      {goals.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No active goals</p>
          {canManageGoals && (
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Create a goal to start tracking donations
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const progress = getProgress(goal);
            const progressColor = getProgressColor(progress);
            const isCompleted = progress >= 100;

            return (
              <div
                key={goal.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {goal.title}
                      </h3>
                      {isCompleted && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400">
                          <Check className="w-3 h-3 inline mr-1" />
                          Completed!
                        </span>
                      )}
                    </div>
                    {goal.description && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                        {goal.description}
                      </p>
                    )}
                  </div>
                  <Target className="w-6 h-6 text-green-600" />
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Progress
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {Math.min(progress, 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className={`${progressColor} h-3 rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Amounts */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Raised
                    </p>
                    <p className="text-lg font-bold text-green-600">
                      PKR {goal.currentAmount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Goal
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      PKR {goal.targetAmount.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Remaining / Deadline */}
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>
                    {isCompleted ? (
                      '🎉 Goal achieved!'
                    ) : (
                      <>
                        PKR {(goal.targetAmount - goal.currentAmount).toLocaleString()} to
                        go
                      </>
                    )}
                  </span>
                  {goal.deadline && (
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(goal.deadline.toDate()).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {/* Supporters Count */}
                {goal.currentAmount > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <TrendingUp className="w-4 h-4 inline mr-1" />
                      Thank you to all our supporters! 🙏
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Overall Stats */}
      {goals.length > 0 && (
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <h3 className="text-lg font-bold mb-2">Overall Impact</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-green-100">Active Goals</p>
              <p className="text-2xl font-bold">{goals.length}</p>
            </div>
            <div>
              <p className="text-sm text-green-100">Total Raised</p>
              <p className="text-2xl font-bold">
                PKR {goals.reduce((sum, g) => sum + g.currentAmount, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationGoals;
