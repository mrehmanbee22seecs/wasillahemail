import React from 'react';
import { Heart } from 'lucide-react';
import { useLikes, SocialTargetType } from '../../hooks/useSocial';
import { useAuth } from '../../contexts/AuthContext';

interface LikesProps {
  targetType: SocialTargetType;
  targetId: string | null;
}

const Likes: React.FC<LikesProps> = ({ targetType, targetId }) => {
  const { currentUser } = useAuth();
  const { likesCount, likedByMe, toggleLike } = useLikes(targetType, targetId);

  const handleClick = () => {
    if (!currentUser) {
      alert('Please sign in to like this.');
      return;
    }
    toggleLike();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1 text-xs sm:text-sm px-3 py-1.5 rounded-full border border-gray-300 hover:bg-gray-50"
    >
      <Heart
        className={`w-4 h-4 ${likedByMe ? 'text-red-500 fill-red-500' : 'text-gray-400'}`}
      />
      <span className="text-gray-800">{likesCount || 0}</span>
    </button>
  );
};

export default Likes;


