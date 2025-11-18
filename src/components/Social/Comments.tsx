import React, { useState } from 'react';
import { MessageCircle, Loader2 } from 'lucide-react';
import { useComments, SocialTargetType } from '../../hooks/useSocial';
import { useAuth } from '../../contexts/AuthContext';

interface CommentsProps {
  targetType: SocialTargetType;
  targetId: string | null;
}

const Comments: React.FC<CommentsProps> = ({ targetType, targetId }) => {
  const { currentUser } = useAuth();
  const [text, setText] = useState('');
  const { comments, loading, error, submitting, addComment } = useComments(targetType, targetId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Please sign in to comment.');
      return;
    }
    if (!text.trim()) return;
    await addComment(text);
    setText('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-vibrant-orange" />
        <h3 className="text-lg font-semibold text-logo-navy">Comments</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-vibrant-orange/60"
          rows={2}
          placeholder={
            currentUser ? 'Share your thoughts...' : 'Sign in to share your thoughts...'
          }
          disabled={!currentUser || submitting}
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!currentUser || submitting || !text.trim()}
            className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold ${
              !currentUser || submitting || !text.trim()
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-vibrant-orange text-white hover:bg-vibrant-orange-dark'
            }`}
          >
            {submitting && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
            Post
          </button>
        </div>
      </form>

      {loading && (
        <div className="text-xs text-gray-500 flex items-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin" />
          Loading comments...
        </div>
      )}

      {error && (
        <div className="text-xs text-red-500">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {comments.map((c) => {
          const createdDate =
            c.createdAt && typeof (c.createdAt as any).toDate === 'function'
              ? (c.createdAt as any).toDate()
              : null;
          return (
            <div
              key={c.id}
              className="border border-gray-200 rounded-xl p-3 bg-white text-sm text-gray-800"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-logo-navy">
                  {c.userName || 'Community Member'}
                </span>
                {createdDate && (
                  <span className="text-[10px] text-gray-500">
                    {createdDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-800 whitespace-pre-line">{c.text}</p>
            </div>
          );
        })}

        {!loading && comments.length === 0 && (
          <p className="text-xs text-gray-500">No comments yet. Be the first to start the conversation.</p>
        )}
      </div>
    </div>
  );
};

export default Comments;


