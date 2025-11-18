import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Achievement, subscribeToAchievements } from '../../services/gamificationService';

const Achievements: React.FC = () => {
  const { currentUser } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    if (!currentUser) {
      setAchievements([]);
      return;
    }
    const unsub = subscribeToAchievements(currentUser.uid, setAchievements);
    return () => unsub();
  }, [currentUser]);

  if (!currentUser) return null;

  return (
    <section className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <Star className="w-4 h-4 text-yellow-500" />
        <h3 className="text-sm font-semibold text-logo-navy">Achievements</h3>
      </div>
      {achievements.length === 0 ? (
        <p className="text-xs text-gray-600">No achievements unlocked yet.</p>
      ) : (
        <ul className="space-y-1 text-[11px] text-gray-700">
          {achievements.slice(0, 5).map((a) => (
            <li key={a.id}>
              <span className="font-semibold text-logo-navy">{a.name}</span>
              <span className="text-gray-500"> – {a.description}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default Achievements;


