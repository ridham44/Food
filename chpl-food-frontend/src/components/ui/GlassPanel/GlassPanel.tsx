import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  strong?: boolean;
  radius?: 'control' | 'button' | 'card' | 'dialog';
}

export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, strong = false, radius = 'card', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          strong ? 'glass-panel--strong' : 'glass-panel',
          radius === 'control' && 'rounded-control',
          radius === 'button' && 'rounded-button',
          radius === 'card' && 'rounded-card',
          radius === 'dialog' && 'rounded-dialog',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassPanel.displayName = 'GlassPanel';
