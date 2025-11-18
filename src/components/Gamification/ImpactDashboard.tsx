import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { subscribeToUserPoints, subscribeToUserStats, PointsEntry, UserPointsStats } from '../../services/gamificationService';
import BadgeSystem from './BadgeSystem';
import Achievements from './Achievements';

const ImpactDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [entries, setEntries] = useState<PointsEntry[]>([]);
  const [stats, setStats] = useState<UserPointsStats | null>(null);

  useEffect(() => {
    if (!currentUser) {
      setEntries([]);
      setStats(null);
      return;
    }
    const unsubPoints = subscribeToUserPoints(currentUser.uid, setEntries);
    const unsubStats = subscribeToUserStats(currentUser.uid, setStats);
    return () => {
      unsubPoints();
      unsubStats();
    };
  }, [currentUser]);

  if (!currentUser) return null;

  return (
    <section className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-logo-navy">Impact & Points</h3>
          <p className="text-[11px] text-gray-600">
            Track your Wasilah impact, points and milestones.
          </p>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-vibrant-orange">
            {stats?.totalPoints || 0}
          </div>
          <div className="text-[11px] text-gray-500">Total Points</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <BadgeSystem />
        <Achievements />
      </div>

      <div className="mt-2">
        <h4 className="text-xs font-semibold text-logo-navy mb-2">Recent point history</h4>
        {entries.length === 0 ? (
          <p className="text-[11px] text-gray-600">No point-earning actions yet.</p>
        ) : (
          <ul className="space-y-1 max-h-40 overflow-y-auto text-[11px] text-gray-700">
            {entries.slice(0, 8).map((e) => {
              const date = e.createdAt?.toDate ? e.createdAt.toDate() : new Date();
              return (
                <li key={e.id} className="flex items-center justify-between">
                  <span>{e.reason}</span>
                  <span className="text-gray-500">
                    +{e.points} · {date.toLocaleDateString()}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
};

export default ImpactDashboard;


