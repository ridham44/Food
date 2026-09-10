import type { ComponentPropsWithoutRef } from 'react';
import * as RadixTabs from '@radix-ui/react-tabs';
import { cn } from '@/lib/cn';

export const Tabs = RadixTabs.Root;

export function TabsList({ className, ...props }: ComponentPropsWithoutRef<typeof RadixTabs.List>) {
  return (
    <RadixTabs.List
      className={cn(
        'inline-flex items-center gap-1 overflow-x-auto rounded-control border border-border-subtle bg-surface-glass p-1',
        className
      )}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: ComponentPropsWithoutRef<typeof RadixTabs.Trigger>) {
  return (
    <RadixTabs.Trigger
      className={cn(
        'shrink-0 whitespace-nowrap rounded-control px-3.5 py-1.5 text-sm font-medium text-text-secondary transition-all',
        'hover:text-text-primary',
        'data-[state=active]:bg-gradient-to-b data-[state=active]:from-primary data-[state=active]:to-primary-deep data-[state=active]:text-white data-[state=active]:shadow-[0_4px_14px_rgba(139,108,255,0.3)]',
        className
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: ComponentPropsWithoutRef<typeof RadixTabs.Content>) {
  return <RadixTabs.Content className={cn('outline-none', className)} {...props} />;
}
