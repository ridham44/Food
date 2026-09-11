import { useState } from 'react';
import { cn } from '@/lib/cn';
import { assetUrl } from '@/lib/assetUrl';

type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: AvatarSize;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-14 w-14 text-xl',
};

/** Circular avatar — shows the image when available, falls back to initials on load failure or when no image is set. */
export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const resolvedSrc = assetUrl(src);
  const initial = (name?.trim()?.charAt(0) || '?').toUpperCase();

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary/25 to-cyan/10 font-semibold text-text-primary',
        sizeClasses[size],
        className
      )}
    >
      {resolvedSrc && !failed ? (
        <img
          src={resolvedSrc}
          alt={name ?? 'Avatar'}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        initial
      )}
    </span>
  );
}
