import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useProjectChat } from '../../hooks/useChat';
import MessageList from './MessageList';
import MessageInput, { AttachmentDraft } from './MessageInput';

interface ProjectChatProps {
  projectId: string;
  projectTitle?: string;
}

const ProjectChat: React.FC<ProjectChatProps> = ({ projectId, projectTitle }) => {
  const { currentUser } = useAuth();
  const { messages, typingUsers, loading, send, setTyping } = useProjectChat(
    projectId,
    currentUser
  );

  const handleSend = async (text: string, attachment?: AttachmentDraft) => {
    await send(text, attachment);
  };

  if (!currentUser) {
    return null;
  }

  return (
    <section className="bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col h-80">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-logo-teal" />
          <h3 className="text-sm font-semibold text-logo-navy">
            Project Chat{projectTitle ? ` – ${projectTitle}` : ''}
          </h3>
        </div>
        <span className="text-[11px] text-gray-500">
          Real-time messages between NGO and volunteers
        </span>
      </div>
      <div className="flex-1 px-3 py-2">
        {loading ? (
          <div className="text-xs text-gray-500 py-4 text-center">Loading chat…</div>
        ) : (
          <MessageList
            messages={messages}
            currentUserId={currentUser.uid}
            typingUsers={typingUsers}
          />
        )}
      </div>
      <div className="px-3 py-2 border-t border-gray-100">
        <MessageInput
          onSend={handleSend}
          onTypingChange={setTyping}
        />
      </div>
    </section>
  );
};

export default ProjectChat;


