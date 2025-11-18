import React, { useState, useEffect } from 'react';
import { Send, Paperclip, Image as ImageIcon } from 'lucide-react';

interface AttachmentDraft {
  url: string;
  type: 'image' | 'file';
  name?: string;
}

interface MessageInputProps {
  onSend: (text: string, attachment?: AttachmentDraft) => Promise<void>;
  onTypingChange?: (isTyping: boolean) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSend, onTypingChange }) => {
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState<AttachmentDraft | undefined>(undefined);
  const [sending, setSending] = useState(false);
  const [showAttachment, setShowAttachment] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (!onTypingChange) return;
    if (text) {
      onTypingChange(true);
      timeout = setTimeout(() => onTypingChange(false), 3000);
    } else {
      onTypingChange(false);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [text, onTypingChange]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed && !attachment) return;
    try {
      setSending(true);
      await onSend(trimmed, attachment);
      setText('');
      setAttachment(undefined);
      setShowAttachment(false);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-2">
      {showAttachment && (
        <div className="border border-dashed border-gray-300 rounded-lg p-2 text-xs space-y-2">
          <div className="flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-gray-500" />
            <span className="font-semibold text-gray-700">Attachment (URL only)</span>
          </div>
          <div className="flex flex-col gap-1">
            <input
              type="text"
              placeholder="https://example.com/file or image"
              value={attachment?.url || ''}
              onChange={(e) =>
                setAttachment((prev) => ({
                  ...(prev || { type: 'file' }),
                  url: e.target.value,
                }))
              }
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setAttachment((prev) => ({
                    ...(prev || { url: '' }),
                    type: 'image',
                  }))
                }
                className={`px-2 py-1 rounded text-[11px] border ${
                  attachment?.type === 'image'
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'border-gray-300 text-gray-600'
                }`}
              >
                <ImageIcon className="w-3 h-3 inline mr-1" />
                Image
              </button>
              <button
                type="button"
                onClick={() =>
                  setAttachment((prev) => ({
                    ...(prev || { url: '' }),
                    type: 'file',
                  }))
                }
                className={`px-2 py-1 rounded text-[11px] border ${
                  attachment?.type === 'file'
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'border-gray-300 text-gray-600'
                }`}
              >
                <Paperclip className="w-3 h-3 inline mr-1" />
                File/link
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => setShowAttachment((v) => !v)}
          className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
          title="Add attachment (URL)"
        >
          <Paperclip className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Write a message…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-logo-teal focus:border-transparent"
          />
        </div>
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || (!text.trim() && !attachment)}
          className="p-2 rounded-lg bg-logo-teal text-white hover:bg-logo-teal/90 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export type { AttachmentDraft };
export default MessageInput;


