import { NavLink } from 'react-router-dom';
import { Package, DollarSign, ArrowRightLeft } from 'lucide-react';

export default function MorePage() {
  const menus = [
    { path: '/products', icon: Package, label: 'المنتجات' },
    { path: '/inventory', icon: Package, label: 'المخزون' },
    { path: '/expenses', icon: DollarSign, label: 'المصروفات' },
    { path: '/operations', icon: ArrowRightLeft, label: 'العمليات' },
  ];

  return (
    <div className="p-4 flex flex-col gap-4">
      <h1 className="text-xl font-bold mb-2">المزيد</h1>
      <div className="grid grid-cols-2 gap-4">
        {menus.map((m) => (
          <NavLink key={m.path} to={m.path} className="flex flex-col items-center gap-2 p-4 bg-surface border border-border rounded-lg shadow-sm hover:border-accent">
            <m.icon className="w-8 h-8 text-accent" />
            <span className="font-medium">{m.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}
