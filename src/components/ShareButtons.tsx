/**
 * Share Buttons Component
 * Social media sharing buttons for projects and events
 */

import React, { useState } from 'react';
import type { ShareableContent, SocialPlatform } from '../types/integrations';
import { openShareLink, copyToClipboard, shareViaWebAPI, canUseWebShare } from '../utils/socialSharing';

interface ShareButtonsProps {
  content: ShareableContent;
  size?: 'small' | 'medium' | 'large';
  showLabels?: boolean;
  className?: string;
}

export const ShareButtons: React.FC<ShareButtonsProps> = ({
  content,
  size = 'medium',
  showLabels = false,
  className = ''
}) => {
  const [copied, setCopied] = useState(false);
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);

  const sizeClasses = {
    small: 'w-8 h-8 text-sm',
    medium: 'w-10 h-10 text-base',
    large: 'w-12 h-12 text-lg'
  };

  const handleShare = (platform: SocialPlatform) => {
    openShareLink(platform, content);
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(content.url);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWebShare = async () => {
    await shareViaWebAPI(content);
  };

  const platforms: Array<{ id: SocialPlatform; label: string; icon: string; color: string }> = [
    { id: 'whatsapp', label: 'WhatsApp', icon: '📱', color: 'bg-green-500 hover:bg-green-600' },
    { id: 'facebook', label: 'Facebook', icon: '📘', color: 'bg-blue-600 hover:bg-blue-700' },
    { id: 'twitter', label: 'Twitter', icon: '🐦', color: 'bg-sky-500 hover:bg-sky-600' },
    { id: 'linkedin', label: 'LinkedIn', icon: '💼', color: 'bg-blue-700 hover:bg-blue-800' },
    { id: 'email', label: 'Email', icon: '✉️', color: 'bg-gray-600 hover:bg-gray-700' }
  ];

  const primaryPlatforms = platforms.slice(0, 3);
  const secondaryPlatforms = platforms.slice(3);

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Title */}
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Share this {content.title}
      </div>

      {/* Primary Share Buttons */}
      <div className="flex flex-wrap gap-2">
        {/* Native Web Share (Mobile) */}
        {canUseWebShare() && (
          <button
            onClick={handleWebShare}
            className={`${sizeClasses[size]} flex items-center justify-center rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-colors`}
            title="Share"
          >
            🔗
          </button>
        )}

        {/* Primary Platforms */}
        {primaryPlatforms.map((platform) => (
          <button
            key={platform.id}
            onClick={() => handleShare(platform.id)}
            className={`${sizeClasses[size]} flex items-center justify-center rounded-lg ${platform.color} text-white transition-colors`}
            title={`Share on ${platform.label}`}
          >
            {platform.icon}
          </button>
        ))}

        {/* Show More Button */}
        {!showAllPlatforms && (
          <button
            onClick={() => setShowAllPlatforms(true)}
            className={`${sizeClasses[size]} flex items-center justify-center rounded-lg bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors`}
            title="More options"
          >
            ⋯
          </button>
        )}

        {/* Copy Link Button */}
        <button
          onClick={handleCopy}
          className={`${sizeClasses[size]} flex items-center justify-center rounded-lg ${
            copied ? 'bg-green-500' : 'bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600'
          } text-gray-700 dark:text-gray-300 transition-colors`}
          title={copied ? 'Copied!' : 'Copy link'}
        >
          {copied ? '✓' : '🔗'}
        </button>
      </div>

      {/* Secondary Platforms (Expanded) */}
      {showAllPlatforms && (
        <div className="flex flex-wrap gap-2 pl-4 border-l-2 border-gray-300 dark:border-gray-600">
          {secondaryPlatforms.map((platform) => (
            <button
              key={platform.id}
              onClick={() => handleShare(platform.id)}
              className={`${
                showLabels ? 'px-4 py-2' : sizeClasses[size]
              } flex items-center justify-center gap-2 rounded-lg ${platform.color} text-white transition-colors`}
              title={`Share on ${platform.label}`}
            >
              <span>{platform.icon}</span>
              {showLabels && <span className="text-sm font-medium">{platform.label}</span>}
            </button>
          ))}
          
          <button
            onClick={() => setShowAllPlatforms(false)}
            className={`${sizeClasses[size]} flex items-center justify-center rounded-lg bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors`}
            title="Show less"
          >
            ×
          </button>
        </div>
      )}

      {/* Copy Confirmation */}
      {copied && (
        <div className="text-xs text-green-600 dark:text-green-400 font-medium">
          Link copied to clipboard!
        </div>
      )}
    </div>
  );
};

export default ShareButtons;
