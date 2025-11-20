/**
 * Social Sharing Utilities
 * Client-side social media sharing functions (zero-cost, no API calls)
 * Optimized for Pakistan market
 */

export interface ShareData {
  title: string;
  text?: string;
  url: string;
  hashtags?: string[];
  via?: string; // Twitter handle
}

/**
 * Share on WhatsApp (very popular in Pakistan)
 */
export const shareOnWhatsApp = (data: ShareData): void => {
  const text = encodeURIComponent(`${data.title}\n${data.text || ''}\n${data.url}`);
  const whatsappUrl = `https://web.whatsapp.com/send?text=${text}`;
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
};

/**
 * Share on Facebook
 */
export const shareOnFacebook = (data: ShareData): void => {
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.url)}`;
  window.open(facebookUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
};

/**
 * Share on Twitter
 */
export const shareOnTwitter = (data: ShareData): void => {
  const params = new URLSearchParams({
    url: data.url,
    text: data.text || data.title,
    ...(data.hashtags && data.hashtags.length > 0 && { hashtags: data.hashtags.join(',') }),
    ...(data.via && { via: data.via }),
  });
  const twitterUrl = `https://twitter.com/intent/tweet?${params.toString()}`;
  window.open(twitterUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
};

/**
 * Share on LinkedIn
 */
export const shareOnLinkedIn = (data: ShareData): void => {
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(data.url)}`;
  window.open(linkedInUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
};

/**
 * Share via Email
 */
export const shareViaEmail = (data: ShareData): void => {
  const subject = encodeURIComponent(data.title);
  const body = encodeURIComponent(`${data.text || ''}\n\n${data.url}`);
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
};

/**
 * Native Web Share API (for mobile devices)
 */
export const shareNative = async (data: ShareData): Promise<boolean> => {
  if (!navigator.share) {
    return false;
  }

  try {
    await navigator.share({
      title: data.title,
      text: data.text,
      url: data.url,
    });
    return true;
  } catch (error) {
    // User cancelled or error occurred
    console.error('Native share failed:', error);
    return false;
  }
};

/**
 * Copy link to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (err) {
      document.body.removeChild(textArea);
      console.error('Clipboard copy failed:', err);
      return false;
    }
  }
};

/**
 * Generate shareable URL with UTM parameters for tracking
 */
export const generateShareUrl = (
  baseUrl: string,
  source: 'whatsapp' | 'facebook' | 'twitter' | 'linkedin' | 'email' | 'copy'
): string => {
  const url = new URL(baseUrl);
  url.searchParams.set('utm_source', source);
  url.searchParams.set('utm_medium', 'social');
  url.searchParams.set('utm_campaign', 'share');
  return url.toString();
};

/**
 * Get share counts (structure for future implementation)
 */
export interface ShareCounts {
  whatsapp: number;
  facebook: number;
  twitter: number;
  linkedin: number;
  email: number;
  copy: number;
  total: number;
}

export const trackShare = (
  contentId: string,
  platform: keyof Omit<ShareCounts, 'total'>
): void => {
  // Track share event with Google Analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'share', {
      content_type: 'content',
      content_id: contentId,
      method: platform,
    });
  }
};
