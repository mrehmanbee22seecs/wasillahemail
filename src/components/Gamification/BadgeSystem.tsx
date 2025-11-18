import React, { useEffect, useState } from 'react';
import { Award } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Badge, subscribeToBadges } from '../../services/gamificationService';

const BadgeSystem: React.FC = () => {
  const { currentUser } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    if (!currentUser) {
      setBadges([]);
      return;
    }
    const unsub = subscribeToBadges(currentUser.uid, setBadges);
    return () => unsub();
  }, [currentUser]);

  if (!currentUser) return null;

  return (
    <section className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <Award className="w-4 h-4 text-vibrant-orange" />
        <h3 className="text-sm font-semibold text-logo-navy">Digital Badges</h3>
      </div>
      {badges.length === 0 ? (
        <p className="text-xs text-gray-600">
          No badges earned yet. Join and complete projects to unlock your first badge.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {badges.map((b) => (
            <div
              key={b.id}
              className="px-3 py-2 rounded-full bg-vibrant-orange/10 text-[11px] text-vibrant-orange font-semibold"
            >
              {b.name}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default BadgeSystem;


