import type { ReactNode } from 'react';
import * as RadixTooltip from '@radix-ui/react-tooltip';
import { cn } from '@/lib/cn';

export const TooltipProvider = RadixTooltip.Provider;

export function Tooltip({
  content,
  children,
  side = 'top',
}: {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
}) {
  return (
    <RadixTooltip.Root delayDuration={200}>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={6}
          className={cn(
            'glass-panel--strong z-dropdown max-w-[240px] rounded-control px-2.5 py-1.5 text-xs text-text-secondary',
            'data-[state=delayed-open]:animate-auth-panel-in'
          )}
        >
          {content}
          <RadixTooltip.Arrow className="fill-[var(--surface-glass-strong)]" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
