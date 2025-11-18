import React from 'react';
import { UserPlus, UserCheck } from 'lucide-react';
import { useFollow } from '../../hooks/useSocial';
import { useAuth } from '../../contexts/AuthContext';

interface FollowButtonProps {
  targetUserId: string | null;
}

const FollowButton: React.FC<FollowButtonProps> = ({ targetUserId }) => {
  const { currentUser } = useAuth();
  const { following, loading, toggleFollow } = useFollow(targetUserId);

  if (!targetUserId || !currentUser || currentUser.uid === targetUserId) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={toggleFollow}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm ${
        following
          ? 'bg-gray-100 text-gray-700 border border-gray-300'
          : 'bg-vibrant-orange text-white'
      }`}
    >
      {following ? (
        <>
          <UserCheck className="w-4 h-4" />
          <span>Following</span>
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          <span>Follow</span>
        </>
      )}
    </button>
  );
};

export default FollowButton;


