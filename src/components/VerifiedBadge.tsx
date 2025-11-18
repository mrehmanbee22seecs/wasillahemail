import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface VerifiedBadgeProps {
  verified: boolean;
  size?: 'sm' | 'md';
}

const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ verified, size = 'md' }) => {
  if (!verified) return null;

  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${padding} ${textSize} font-semibold`}
    >
      <ShieldCheck className={`${iconSize}`} />
      <span>Verified NGO</span>
    </span>
  );
};

export default VerifiedBadge;


