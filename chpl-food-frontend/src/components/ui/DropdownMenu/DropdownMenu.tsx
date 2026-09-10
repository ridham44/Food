import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import * as RadixDropdown from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/cn';

export const DropdownMenu = RadixDropdown.Root;
export const DropdownMenuTrigger = RadixDropdown.Trigger;

export function DropdownMenuContent({
  className,
  align = 'end',
  sideOffset = 8,
  ...props
}: ComponentPropsWithoutRef<typeof RadixDropdown.Content>) {
  return (
    <RadixDropdown.Portal>
      <RadixDropdown.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'glass-panel--strong z-dropdown min-w-[200px] rounded-card p-1.5',
          'data-[state=open]:animate-auth-panel-in',
          className
        )}
        {...props}
      />
    </RadixDropdown.Portal>
  );
}

export function DropdownMenuItem({
  className,
  destructive,
  children,
  ...props
}: ComponentPropsWithoutRef<typeof RadixDropdown.Item> & { destructive?: boolean; children?: ReactNode }) {
  return (
    <RadixDropdown.Item
      className={cn(
        'flex cursor-pointer select-none items-center gap-2 rounded-control px-2.5 py-2 text-sm outline-none transition-colors',
        destructive ? 'text-danger hover:bg-danger/12' : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-45',
        className
      )}
      {...props}
    >
      {children}
    </RadixDropdown.Item>
  );
}

export function DropdownMenuSeparator({ className, ...props }: ComponentPropsWithoutRef<typeof RadixDropdown.Separator>) {
  return <RadixDropdown.Separator className={cn('my-1.5 h-px bg-border-subtle', className)} {...props} />;
}

export function DropdownMenuLabel({ className, ...props }: ComponentPropsWithoutRef<typeof RadixDropdown.Label>) {
  return <RadixDropdown.Label className={cn('px-2.5 py-1.5 text-xs font-medium text-text-muted', className)} {...props} />;
}
