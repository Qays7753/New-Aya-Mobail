import { useQuery } from '@tanstack/react-query';
import { getDailySummary } from '@/db/queries/operations';
import { getActiveAccounts } from '@/db/queries/accounts';
import { formatMoney } from '@/lib/money';
import { Wallet, TrendingUp, HandCoins, Package, Wrench, Receipt } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { data: summary } = useQuery({
    queryKey: ['daily-summary', ''],
    queryFn: () => getDailySummary()
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['active-accounts'],
    queryFn: getActiveAccounts
  });

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const QUICK_LINKS = [
    { icon: <HandCoins className="w-6 h-6" />, label: 'نقطة البيع', path: '/pos', color: 'bg-blue-500 text-white' },
    { icon: <Package className="w-6 h-6" />, label: 'المستودع', path: '/products', color: 'bg-purple-500 text-white' },
    { icon: <Wrench className="w-6 h-6" />, label: 'الصيانة', path: '/maintenance', color: 'bg-orange-500 text-white' },
    { icon: <Receipt className="w-6 h-6" />, label: 'المصروفات', path: '/expenses', color: 'bg-rose-500 text-white' },
    { icon: <Wallet className="w-6 h-6" />, label: 'الحركة المالية', path: '/operations', color: 'bg-emerald-500 text-white' },
  ];

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto">
      <div className="max-w-7xl mx-auto p-4 md:p-6 w-full space-y-8">
        
        <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">مرحباً بك في لوحة القيادة</h1>
            <p className="text-text-secondary text-lg">نظرة عامة على نشاط متجرك اليوم</p>
          </div>
          
          <div className="bg-surface border border-border p-4 rounded-2xl flex items-center gap-4 min-w-[250px]">
            <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm text-text-secondary">إجمالي الأرصدة (جميع الحسابات)</div>
              <div className="text-2xl font-bold numeric">{formatMoney(totalBalance)}</div>
            </div>
          </div>
        </header>

        {summary && (
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-accent" /> ملخص اليوم
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-surface border border-border p-5 rounded-2xl">
                <div className="text-text-secondary mb-2">المبيعات</div>
                <div className="text-3xl font-bold numeric text-accent">{formatMoney(summary.sales)}</div>
              </div>
              <div className="bg-surface border border-border p-5 rounded-2xl">
                <div className="text-text-secondary mb-2">المصروفات</div>
                <div className="text-3xl font-bold numeric text-danger">{formatMoney(summary.expenses)}</div>
              </div>
              <div className="bg-success-bg/50 border border-success/20 p-5 rounded-2xl">
                <div className="text-success font-medium mb-2">مقبوضات (صناديق)</div>
                <div className="text-3xl font-bold numeric text-success">{formatMoney(summary.totalIn)}</div>
              </div>
              <div className="bg-danger-bg/50 border border-danger/20 p-5 rounded-2xl">
                <div className="text-danger font-medium mb-2">مدفوعات (صناديق)</div>
                <div className="text-3xl font-bold numeric text-danger">{formatMoney(summary.totalOut)}</div>
              </div>
            </div>
          </section>
        )}

        <section>
          <h2 className="text-xl font-bold mb-4">روابط سريعة</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {QUICK_LINKS.map(link => (
              <Link 
                key={link.path} 
                to={link.path}
                className="bg-surface border border-border p-6 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-accent hover:shadow-md transition-all group"
              >
                <div className={cn("w-14 h-14 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm", link.color)}>
                  {link.icon}
                </div>
                <span className="font-bold text-center">{link.label}</span>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
