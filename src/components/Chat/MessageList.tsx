import React, { useMemo, useState } from 'react';
import { ProjectChatMessage } from '../../services/chatService';
import { Download, Search } from 'lucide-react';

interface MessageListProps {
  messages: ProjectChatMessage[];
  currentUserId: string | null;
  typingUsers: string[];
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentUserId, typingUsers }) => {
  const [search, setSearch] = useState('');

  const filteredMessages = useMemo(() => {
    if (!search.trim()) return messages;
    const term = search.toLowerCase();
    return messages.filter((m) =>
      m.text.toLowerCase().includes(term) || m.senderName.toLowerCase().includes(term)
    );
  }, [messages, search]);

  const handleExport = () => {
    const lines = messages.map((m) => {
      const date = m.createdAt?.toDate ? m.createdAt.toDate() : new Date();
      return `[${date.toISOString()}] ${m.senderName}: ${m.text}`;
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project-chat.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-2 text-xs">
        <div className="relative flex-1">
          <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search in chat"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-6 pr-2 py-1 border border-gray-200 rounded-lg text-[11px]"
          />
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="flex items-center gap-1 px-2 py-1 text-[11px] border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
        >
          <Download className="w-3 h-3" />
          Export
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {filteredMessages.length === 0 ? (
          <div className="text-xs text-gray-500 text-center mt-4">
            {search ? 'No messages match your search.' : 'No messages yet.'}
          </div>
        ) : (
          filteredMessages.map((m) => {
            const isMine = currentUserId && m.senderId === currentUserId;
            const date = m.createdAt?.toDate ? m.createdAt.toDate() : new Date();
            return (
              <div
                key={m.id}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-xl px-3 py-2 text-xs ${
                    isMine
                      ? 'bg-logo-teal text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="font-semibold mb-0.5">
                    {m.senderName}
                  </div>
                  <div className="whitespace-pre-wrap">{m.text}</div>
                  {m.attachmentUrl && (
                    <div className="mt-1">
                      {m.attachmentType === 'image' ? (
                        <img
                          src={m.attachmentUrl}
                          alt={m.attachmentName || 'Attachment'}
                          className="max-h-32 rounded-md border border-white/40"
                        />
                      ) : (
                        <a
                          href={m.attachmentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="underline text-[11px]"
                        >
                          {m.attachmentName || 'View attachment'}
                        </a>
                      )}
                    </div>
                  )}
                  <div className="mt-1 text-[10px] opacity-70">
                    {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {typingUsers.length > 0 && (
          <div className="text-[11px] text-gray-500 mt-2">
            {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing…
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageList;


