import {
  LayoutDashboard,
  ClipboardList,
  ChefHat,
  UtensilsCrossed,
  Tags,
  Gift,
  Package,
  Grid3x3,
  Users,
  UserCog,
  Truck,
  Wallet,
  Ticket,
  CreditCard,
  BarChart3,
  Settings,
  History,
  UserCircle,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', path: '/', icon: LayoutDashboard }],
  },
  {
    title: 'Restaurant',
    items: [
      { label: 'Orders', path: '/orders', icon: ClipboardList },
      { label: 'Kitchen', path: '/kitchen', icon: ChefHat },
      { label: 'Menu', path: '/menu', icon: UtensilsCrossed },
      { label: 'Categories', path: '/categories', icon: Tags },
      { label: 'Combos', path: '/combos', icon: Gift },
      { label: 'Inventory', path: '/inventory', icon: Package },
      { label: 'Tables', path: '/tables', icon: Grid3x3 },
    ],
  },
  {
    title: 'Customers',
    items: [{ label: 'Customers', path: '/customers', icon: Users }],
  },
  {
    title: 'Business',
    items: [
      { label: 'Staff', path: '/staff', icon: UserCog },
      { label: 'Vendors', path: '/vendors', icon: Truck },
      { label: 'Expenses', path: '/expenses', icon: Wallet },
      { label: 'Coupons', path: '/coupons', icon: Ticket },
      { label: 'Payments', path: '/payments', icon: CreditCard },
      { label: 'Reports', path: '/reports', icon: BarChart3 },
    ],
  },
  {
    title: 'Settings',
    items: [
      { label: 'Restaurant Settings', path: '/settings/restaurant', icon: Settings },
      { label: 'Activity Log', path: '/settings/activity-log', icon: History },
      { label: 'Profile', path: '/settings/profile', icon: UserCircle },
    ],
  },
];

/** Longest-prefix match against the current pathname, for the Topbar title. */
export function findActiveNavItem(pathname: string): NavItem | undefined {
  const all = NAV_SECTIONS.flatMap((section) => section.items);
  const exact = all.find((item) => item.path === pathname);
  if (exact) return exact;
  return all
    .filter((item) => item.path !== '/' && pathname.startsWith(item.path))
    .sort((a, b) => b.path.length - a.path.length)[0];
}
