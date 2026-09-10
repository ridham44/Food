import type { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
};

export function Modal({ open, onOpenChange, title, description, children, footer, size = 'md' }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-modal bg-black/60 backdrop-blur-sm data-[state=open]:animate-auth-panel-in" />
        <Dialog.Content
          className={cn(
            'glass-panel--strong fixed left-1/2 top-1/2 z-modal w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2',
            'max-h-[85vh] overflow-y-auto rounded-dialog p-6 focus:outline-none',
            'data-[state=open]:animate-auth-panel-in',
            sizeClasses[size]
          )}
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-bold text-text-primary">{title}</Dialog.Title>
              {description && (
                <Dialog.Description className="mt-1 text-sm text-text-secondary">{description}</Dialog.Description>
              )}
            </div>
            <Dialog.Close
              className="rounded-control p-1.5 text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary"
              aria-label="Close"
            >
              <X style={{ height: 18, width: 18 }} aria-hidden="true" />
            </Dialog.Close>
          </div>

          {children}

          {footer && <div className="mt-6 flex items-center justify-end gap-3">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
