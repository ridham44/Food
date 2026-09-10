import { ShoppingBag, ClipboardList, BarChart3 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ITEMS: Array<{ icon: LucideIcon; label: string }> = [
  { icon: ShoppingBag, label: 'Orders & Payments' },
  { icon: ClipboardList, label: 'Menu & Inventory' },
  { icon: BarChart3, label: 'Reports & Analytics' },
];

export function TrustHighlights() {
  return (
    <div>
      <p className="text-center text-xs text-text-muted">
        Everything your restaurant needs. One workspace.
      </p>
      <ul className="mt-2 grid grid-cols-3 gap-2">
        {ITEMS.map(({ icon: Icon, label }) => (
          <li
            key={label}
            className="flex flex-col items-center gap-1 rounded-control border border-border-subtle bg-surface-glass px-2 py-2 text-center"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-control bg-gradient-to-br from-primary/25 to-cyan/10 text-cyan">
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <span className="text-[11px] font-medium leading-tight text-text-secondary">
              {label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
