import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMonthlyReport } from '@/db/queries/reports';
import { formatMoney } from '@/lib/money';
import { BarChart3, TrendingUp, TrendingDown, Receipt, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

export default function ReportsPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  
  const { data: report, isLoading } = useQuery({
    queryKey: ['monthly-report', currentMonth],
    queryFn: () => getMonthlyReport(new Date(currentMonth + '-01'))
  });

  return (
    <div className="flex flex-col h-full bg-background relative isolate">
      <header className="bg-surface border-b border-border p-4 sticky top-0 z-10 shrink-0">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-accent/10 text-accent rounded-xl flex items-center justify-center shrink-0">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">التقارير الشهرية</h1>
              <p className="text-sm text-text-secondary">متابعة المبيعات والمصروفات والأرباح</p>
            </div>
          </div>
          
          <div className="bg-muted p-1 px-3 py-1.5 rounded-xl border border-border flex items-center gap-2 font-bold focus-within:border-accent">
            <Calendar className="w-4 h-4 text-text-secondary" />
            <input 
              type="month" 
              value={currentMonth}
              onChange={(e) => setCurrentMonth(e.target.value)}
              className="bg-transparent border-none outline-none font-medium cursor-pointer flex-1 text-sm dir-ltr"
            />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 content-area">
        <div className="max-w-4xl mx-auto space-y-6">
          {isLoading ? (
            <div className="p-12 text-center"><div className="animate-spin w-8 h-8 mx-auto border-4 border-accent/30 border-t-accent rounded-full"></div></div>
          ) : report ? (
            <>
              {/* Totals Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-surface border border-border p-5 rounded-2xl">
                  <div className="text-text-secondary mb-2 flex items-center gap-2">
                    <Receipt className="w-4 h-4" />
                    المبيعات (دفع + دين)
                  </div>
                  <div className="text-2xl md:text-3xl font-bold numeric text-text-primary">{formatMoney(report.totals.sales)}</div>
                </div>
                <div className="bg-surface border border-border p-5 rounded-2xl">
                  <div className="text-text-secondary mb-2 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-danger" />
                    المصروفات
                  </div>
                  <div className="text-2xl md:text-3xl font-bold numeric text-danger">{formatMoney(report.totals.expenses)}</div>
                </div>
                <div className="bg-surface border border-border p-5 rounded-2xl md:col-span-2 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-accent/5 pointer-events-none" />
                  <div className="text-text-secondary mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-success" />
                    صافي الأرباح (تقريبي)
                  </div>
                  <div className={cn("text-3xl md:text-4xl font-bold numeric", report.totals.netProfit >= 0 ? "text-success" : "text-danger")}>
                    {formatMoney(report.totals.netProfit)}
                  </div>
                </div>
              </div>

              {/* Daily Table */}
              <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-border bg-muted/30">
                  <h2 className="font-bold text-lg">التفصيل اليومي لشهر {format(new Date(currentMonth + '-01'), 'MMMM yyyy')}</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-start">
                    <thead className="bg-muted text-text-secondary font-medium">
                      <tr>
                        <th className="px-4 py-3">التاريخ</th>
                        <th className="px-4 py-3 text-center">إجمالي المبيعات</th>
                        <th className="px-4 py-3 text-center">نقداً</th>
                        <th className="px-4 py-3 text-center">آجل (ديون)</th>
                        <th className="px-4 py-3 text-center">مصروفات</th>
                        <th className="px-4 py-3 text-center">صافي اليوم</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {report.dailyReport.map((day: any) => {
                        const isWeekend = new Date(day.date).getDay() === 5; // Friday in middle east is weekend
                        
                        // Hide days with 0 activity
                        const hasActivity = day.sales > 0 || day.expenses > 0;
                        if (!hasActivity) return null;

                        return (
                          <tr key={day.date} className={cn("hover:bg-muted/30 transition-colors", isWeekend && "bg-danger/5")}>
                            <td className="px-4 py-3 whitespace-nowrap font-medium text-text-primary">
                              {format(parseISO(day.date), 'dd/MM/yyyy')}
                            </td>
                            <td className="px-4 py-3 text-center font-bold numeric text-text-primary">{formatMoney(day.sales)}</td>
                            <td className="px-4 py-3 text-center numeric text-success">{formatMoney(day.paid_sales)}</td>
                            <td className="px-4 py-3 text-center numeric text-warning">{formatMoney(day.debt_sales)}</td>
                            <td className="px-4 py-3 text-center numeric text-danger">{formatMoney(day.expenses)}</td>
                            <td className={cn("px-4 py-3 text-center font-bold numeric", day.netProfit >= 0 ? "text-success" : "text-danger")} dir="ltr">
                              {day.netProfit > 0 ? '+' : ''}{formatMoney(day.netProfit)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {report.dailyReport.filter(d => d.sales > 0 || d.expenses > 0).length === 0 && (
                  <div className="p-12 text-center text-text-secondary">
                    لا توجد حركة مالية في هذا الشهر.
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}
