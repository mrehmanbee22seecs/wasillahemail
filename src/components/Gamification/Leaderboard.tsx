import React, { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { subscribeToLeaderboard, UserPointsStats } from '../../services/gamificationService';

type Scope = 'global' | 'monthly' | 'role';

const Leaderboard: React.FC = () => {
  const { userData } = useAuth();
  const [scope, setScope] = useState<Scope>('global');
  const [rows, setRows] = useState<UserPointsStats[]>([]);
  const [roleFilter, setRoleFilter] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToLeaderboard(scope, roleFilter, (list) => {
      setRows(list.slice(0, 10));
    });
    return () => unsub();
  }, [scope, roleFilter]);

  return (
    <section className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <h3 className="text-sm font-semibold text-logo-navy">Leaderboard</h3>
        </div>
        <div className="flex items-center gap-1 text-[11px]">
          <button
            className={`px-2 py-1 rounded ${
              scope === 'global' ? 'bg-logo-teal text-white' : 'text-gray-600'
            }`}
            onClick={() => setScope('global')}
          >
            Global
          </button>
          <button
            className={`px-2 py-1 rounded ${
              scope === 'monthly' ? 'bg-logo-teal text-white' : 'text-gray-600'
            }`}
            onClick={() => setScope('monthly')}
          >
            Monthly
          </button>
          <button
            className={`px-2 py-1 rounded ${
              scope === 'role' ? 'bg-logo-teal text-white' : 'text-gray-600'
            }`}
            onClick={() => {
              setScope('role');
              setRoleFilter(userData?.role || 'volunteer');
            }}
          >
            My role
          </button>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-gray-600">No leaderboard data yet.</p>
      ) : (
        <div className="space-y-1 text-[11px]">
          {rows.map((row, idx) => (
            <div
              key={row.userId}
              className="flex items-center justify-between py-1 border-b border-gray-50 last:border-b-0"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 text-center font-semibold">
                  {idx + 1}
                </span>
                <span className="font-medium text-logo-navy">
                  {row.displayName || 'User'}
                </span>
                <span className="text-[10px] text-gray-500 uppercase">
                  {row.role}
                </span>
              </div>
              <div className="text-[11px] text-logo-navy font-semibold">
                {scope === 'monthly' ? row.monthlyPoints : row.totalPoints} pts
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default Leaderboard;


