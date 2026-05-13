import { NavLink } from 'react-router-dom';
import { Home, ShoppingCart, Wrench, BarChart2, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav({ className }: { className?: string }) {

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'الرئيسية' },
    { path: '/maintenance', icon: Wrench, label: 'الصيانة' },
    { path: '/pos', icon: ShoppingCart, label: 'POS', isCenter: true },
    { path: '/reports', icon: BarChart2, label: 'التقارير' },
    { path: '/more', icon: Menu, label: 'المزيد' },
  ];

  return (
    <nav className={cn("h-[60px] pb-[env(safe-area-inset-bottom)] bg-surface border-t border-border flex items-center justify-between px-2 shrink-0 relative", className)}>
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors relative",
              isActive ? "text-accent" : "text-text-secondary hover:text-text-primary",
              item.isCenter && "text-accent"
            )
          }
        >
          {({ isActive }) => (
            <>
              {item.isCenter ? (
                <div className="absolute -top-6 bg-accent text-white p-3 rounded-full shadow-md border-4 border-background">
                  <item.icon className="w-6 h-6" />
                </div>
              ) : (
                <>
                  <item.icon className={cn("w-6 h-6", isActive && "fill-current/20")} />
                  <span className="text-[10px]">{item.label}</span>
                </>
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
