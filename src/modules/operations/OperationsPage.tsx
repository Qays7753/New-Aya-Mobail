import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getRecentLedgerEntries, getDailySummary } from '@/db/queries/operations';
import { formatMoney } from '@/lib/money';
import { ArrowDownRight, ArrowUpRight, FileText, ArrowRightLeft, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function OperationsPage() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: summary } = useQuery({
    queryKey: ['daily-summary', date],
    queryFn: () => getDailySummary(date)
  });

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['ledger-entries'],
    queryFn: () => getRecentLedgerEntries(100)
  });

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="bg-surface border-b border-border p-4 shrink-0">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">الحركة المالية والسجل</h1>
            <p className="text-sm text-text-secondary">متابعة كافة حركات الصناديق والمصروفات والمبيعات</p>
          </div>
          <div className="flex items-center gap-2 bg-muted p-1 rounded-xl">
            <input 
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent border-none outline-none font-medium px-2 py-1 text-sm cursor-pointer"
            />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 content-area">
        <div className="max-w-4xl mx-auto space-y-6">
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-surface border border-border p-4 rounded-2xl flex flex-col justify-center">
                <span className="text-text-secondary text-sm mb-1">المبيعات (الكل)</span>
                <span className="font-bold text-xl md:text-2xl numeric text-accent">{formatMoney(summary.sales)}</span>
              </div>
              <div className="bg-surface border border-border p-4 rounded-2xl flex flex-col justify-center">
                <span className="text-text-secondary text-sm mb-1">المصاريف</span>
                <span className="font-bold text-xl md:text-2xl numeric text-danger">{formatMoney(summary.expenses)}</span>
              </div>
              <div className="bg-success-bg/50 border border-success/20 p-4 rounded-2xl flex flex-col justify-center">
                <span className="text-success text-sm font-medium mb-1 flex items-center gap-1"><ArrowDownRight className="w-4 h-4"/> مقبوضات (داخل)</span>
                <span className="font-bold text-xl md:text-2xl numeric text-success">{formatMoney(summary.totalIn)}</span>
              </div>
              <div className="bg-danger-bg/50 border border-danger/20 p-4 rounded-2xl flex flex-col justify-center">
                <span className="text-danger text-sm font-medium mb-1 flex items-center gap-1"><ArrowUpRight className="w-4 h-4"/> مدفوعات (خارج)</span>
                <span className="font-bold text-xl md:text-2xl numeric text-danger">{formatMoney(summary.totalOut)}</span>
              </div>
            </div>
          )}

          <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-accent" />
              <h2 className="font-bold text-lg">سجل العمليات الأخير</h2>
            </div>
            
            {isLoading ? (
              <div className="p-12 text-center"><div className="animate-spin w-8 h-8 mx-auto border-4 border-accent/30 border-t-accent rounded-full"></div></div>
            ) : entries.length === 0 ? (
              <div className="p-12 text-center text-text-secondary">لا توجد حركات مالية مسجلة بعد.</div>
            ) : (
              <div className="divide-y divide-border">
                {entries.map(entry => {
                  const isCredit = entry.type === 'credit';
                  return (
                    <div key={entry.id} className="p-4 hover:bg-muted/30 transition-colors flex justify-between items-center gap-4">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-1",
                          isCredit ? "bg-success-bg text-success" : "bg-danger-bg text-danger"
                        )}>
                          {isCredit ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold mb-1">{entry.description}</p>
                          <div className="flex items-center gap-2 text-xs text-text-secondary">
                            <span className="bg-muted px-1.5 py-0.5 rounded">{entry.account_name}</span>
                            <span>•</span>
                            <span>{format(new Date(entry.created_at), 'hh:mm a', { locale: ar })}</span>
                            <span>•</span>
                            <span>{entry.entry_date}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className={cn(
                        "font-bold text-lg numeric whitespace-nowrap px-3 py-1 rounded-lg",
                        isCredit ? "text-success bg-success-bg/50" : "text-danger bg-danger-bg/50"
                      )}>
                        {isCredit ? '+' : '-'} {formatMoney(entry.amount)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
