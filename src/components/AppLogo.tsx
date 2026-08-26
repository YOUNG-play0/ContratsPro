import React from 'react';

interface AppLogoProps {
  className?: string;
  size?: number | string;
}

export const AppLogo: React.FC<AppLogoProps> = ({ className = 'w-full h-full', size }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      <defs>
        <linearGradient id="appLogoBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E1B4B" />
          <stop offset="50%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#064E3B" />
        </linearGradient>
        <linearGradient id="appLogoShield" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <linearGradient id="appLogoDoc" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F8FAFC" />
        </linearGradient>
        <linearGradient id="appLogoEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <filter id="appLogoShadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000000" floodOpacity="0.2" />
        </filter>
      </defs>

      {/* Rounded container background */}
      <rect width="120" height="120" rx="26" fill="url(#appLogoBg)" />
      <rect x="2" y="2" width="116" height="116" rx="24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />

      {/* Subtle Shield aura */}
      <path
        d="M 60 22 C 78 22 88 28 88 44 C 88 68 60 88 60 88 C 60 88 32 68 32 44 C 32 28 42 22 60 22 Z"
        fill="url(#appLogoShield)"
        opacity="0.2"
      />

      {/* Contract Document */}
      <g filter="url(#appLogoShadow)">
        {/* Document background with fold */}
        <path
          d="M 40 32 L 70 32 L 80 42 L 80 86 C 80 88.2 78.2 90 76 90 L 40 90 C 37.8 90 36 88.2 36 86 L 36 36 C 36 33.8 37.8 32 40 32 Z"
          fill="url(#appLogoDoc)"
        />
        
        {/* Folded corner */}
        <path d="M 70 32 L 80 42 L 70 42 Z" fill="#CBD5E1" />

        {/* Document text lines */}
        <rect x="44" y="46" width="22" height="3.2" rx="1.6" fill="#4F46E5" />
        <rect x="44" y="53" width="28" height="2.6" rx="1.3" fill="#94A3B8" />
        <rect x="44" y="59.5" width="24" height="2.6" rx="1.3" fill="#94A3B8" />
        <rect x="44" y="66" width="26" height="2.6" rx="1.3" fill="#94A3B8" />
        <rect x="44" y="72.5" width="16" height="2.6" rx="1.3" fill="#94A3B8" />
      </g>

      {/* Verified / Active Badge with Checkmark */}
      <g filter="url(#appLogoShadow)">
        <circle cx="76" cy="76" r="16" fill="url(#appLogoEmerald)" stroke="#FFFFFF" strokeWidth="2.5" />
        <path
          d="M 70 76 L 74.5 80.5 L 82.5 71.5"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Gold Sparkle in upper corner */}
      <path
        d="M 88 23 Q 92 27 96 27 Q 92 27 88 31 Q 88 27 84 27 Q 88 27 88 23 Z"
        fill="#FCD34D"
        opacity="0.95"
      />
    </svg>
  );
};
