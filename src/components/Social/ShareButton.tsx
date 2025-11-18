import React, { useState } from 'react';
import { Share2, Link as LinkIcon, MessageCircle, Mail } from 'lucide-react';

interface ShareButtonProps {
  url?: string;
  title?: string;
  variant?: 'icon' | 'button';
}

const ShareButton: React.FC<ShareButtonProps> = ({ url, title, variant = 'button' }) => {
  const [copied, setCopied] = useState(false);

  const shareUrl =
    url ||
    (typeof window !== 'undefined'
      ? window.location.href
      : 'https://wasilah.org');

  const shareTitle = title || 'Check out this opportunity on Wasilah';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: shareTitle, url: shareUrl });
      } catch {
        // ignore
      }
    } else {
      handleCopy();
    }
  };

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleNativeShare}
        className="inline-flex items-center justify-center p-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100"
        title="Share"
      >
        <Share2 className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="relative inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleNativeShare}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-gray-300 text-xs sm:text-sm text-gray-800 hover:bg-gray-50"
      >
        <Share2 className="w-4 h-4" />
        <span>Share</span>
      </button>

      <div className="flex items-center gap-1">
        {/* WhatsApp */}
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`${shareTitle}\n${shareUrl}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-full text-[#25D366] hover:bg-gray-50"
          title="Share on WhatsApp"
        >
          <MessageCircle className="w-4 h-4" />
        </a>

        {/* Email */}
        <a
          href={`mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareUrl)}`}
          className="p-2 rounded-full text-gray-700 hover:bg-gray-50"
          title="Share via Email"
        >
          <Mail className="w-4 h-4" />
        </a>

        {/* Copy link */}
        <button
          type="button"
          onClick={handleCopy}
          className="p-2 rounded-full text-gray-700 hover:bg-gray-50"
          title="Copy link"
        >
          <LinkIcon className="w-4 h-4" />
        </button>
      </div>

      {copied && (
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] px-2 py-1 bg-black text-white rounded-full">
          Link copied
        </span>
      )}
    </div>
  );
};

export default ShareButton;


