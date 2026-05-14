import { NavLink } from 'react-router-dom';
import { Home, ShoppingCart, Package, DollarSign, ArrowRightLeft, Wrench, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/dashboard', icon: Home, label: 'الرئيسية', requiresPin: true },
  { path: '/pos', icon: ShoppingCart, label: 'POS', requiresPin: false },
  { path: '/products', icon: Package, label: 'المنتجات', requiresPin: false },
  { path: '/inventory', icon: Package, label: 'المخزون', requiresPin: true },
  { path: '/expenses', icon: DollarSign, label: 'المصروفات', requiresPin: true },
  { path: '/operations', icon: ArrowRightLeft, label: 'العمليات', requiresPin: true },
  { path: '/maintenance', icon: Wrench, label: 'الصيانة', requiresPin: false },
  { path: '/reports', icon: BarChart2, label: 'التقارير', requiresPin: true },
];

export function SideRail({ className }: { className?: string }) {
  return (
    <aside className={cn("w-20 lg:w-[240px] border-e border-border bg-surface flex flex-col py-4 shrink-0 transition-all", className)}>
      <nav className="flex flex-col gap-2 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex flex-col lg:flex-row items-center gap-1 lg:gap-3 p-3 rounded-md text-text-secondary hover:bg-muted transition-colors",
                isActive && "bg-accent-light text-accent lg:border-s-4 lg:border-accent font-semibold"
              )
            }
          >
            <item.icon className="w-6 h-6" />
            <span className="text-[11px] lg:text-[14px]">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
