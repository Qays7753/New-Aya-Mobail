import { NavLink } from 'react-router-dom';
import { Package, DollarSign, ArrowRightLeft, FileText, Settings, Archive, Lock } from 'lucide-react';

const PROTECTED = new Set(['/sales', '/inventory', '/expenses', '/operations', '/settings']);

const menus = [
  { path: '/sales', icon: FileText, label: 'فواتير المبيعات' },
  { path: '/products', icon: Package, label: 'المنتجات' },
  { path: '/inventory', icon: Archive, label: 'المخزون' },
  { path: '/expenses', icon: DollarSign, label: 'المصروفات' },
  { path: '/operations', icon: ArrowRightLeft, label: 'العمليات' },
  { path: '/settings', icon: Settings, label: 'الإعدادات' },
];

export default function MorePage() {
  return (
    <div className="p-4 flex flex-col gap-4" dir="rtl">
      <h1 className="text-xl font-bold mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>المزيد</h1>
      <div className="grid grid-cols-2 gap-4">
        {menus.map((m) => (
          <NavLink
            key={m.path}
            to={m.path}
            className="flex flex-col items-center gap-2 p-4 bg-surface border border-border rounded-xl shadow-sm hover:border-accent transition-colors relative"
          >
            {PROTECTED.has(m.path) && (
              <div className="absolute top-2 end-2">
                <Lock className="w-3.5 h-3.5 text-accent opacity-70" />
              </div>
            )}
            <m.icon className="w-8 h-8 text-accent" />
            <span className="font-medium text-sm text-center" style={{ fontFamily: 'Tajawal, sans-serif' }}>{m.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}
