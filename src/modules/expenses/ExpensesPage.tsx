import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRecentExpenses, addExpense } from '@/db/queries/expenses';
import { getActiveAccounts } from '@/db/queries/accounts';
import { formatMoney, parseMoney } from '@/lib/money';
import { Plus, Receipt, CheckCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const EXPENSE_CATEGORIES = [
  'إيجار',
  'رواتب',
  'كهرباء/ماء/انترنت',
  'ضيافة ونثريات',
  'صيانة المحل',
  'أخرى'
];

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const [isAddMode, setIsAddMode] = useState(false);
  const [amountInput, setAmountInput] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState('');

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => getRecentExpenses(50)
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['active-accounts'],
    queryFn: getActiveAccounts,
  });

  if (accounts.length > 0 && !accountId) {
    setAccountId(accounts[0].id);
  }

  const expenseMutation = useMutation({
    mutationFn: () => addExpense({
      amount: parseMoney(amountInput),
      category,
      description,
      accountId
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['active-accounts'] });
      toast.success('تم تسجيل المصروف بنجاح');
      setIsAddMode(false);
      setAmountInput('');
      setDescription('');
    },
    onError: (err: any) => {
      toast.error('خطأ أثناء تسجيل المصروف: ' + err.message);
    }
  });

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="bg-surface border-b border-border p-4 shrink-0">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold">المصروفات</h1>
            <p className="text-sm text-text-secondary">تسجيل مصاريف المحل اليومية</p>
          </div>
          <button 
            onClick={() => setIsAddMode(!isAddMode)}
            className="bg-accent text-white px-4 h-11 rounded-lg font-bold flex items-center gap-2 hover:bg-accent-hover transition-colors shadow-sm"
          >
            {isAddMode ? 'إلغاء' : <><Plus className="w-5 h-5"/> تسجيل مصروف</>}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 content-area">
        <div className="max-w-4xl mx-auto">
          {isAddMode && (
            <div className="bg-surface border border-border rounded-2xl p-6 mb-6 shadow-sm animate-in slide-in-from-top-4">
              <h2 className="text-lg font-bold mb-4">تسجيل مصروف جديد</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">المبلغ <span className="text-danger">*</span></label>
                  <div className="relative">
                    <input 
                      type="text" 
                      inputMode="decimal"
                      value={amountInput}
                      onChange={(e) => setAmountInput(e.target.value)}
                      className="w-full h-12 pl-12 pr-4 rounded-xl border border-border bg-background focus:border-accent focus:ring-1 outline-none text-xl font-bold numeric"
                      placeholder="0"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-sm font-medium">د.ع</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">التبويب <span className="text-danger">*</span></label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-border bg-background focus:border-accent outline-none font-medium"
                  >
                    {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">البيان (التفاصيل) <span className="text-danger">*</span></label>
                <input 
                  type="text" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-border bg-background focus:border-accent outline-none"
                  placeholder="مثال: فاتورة كهرباء لشهر مايو..."
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-1">الدفع من حساب <span className="text-danger">*</span></label>
                <select 
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-border bg-background focus:border-accent outline-none font-medium"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} ({formatMoney(acc.balance)})</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => expenseMutation.mutate()}
                disabled={expenseMutation.isPending || !amountInput || !description}
                className="w-full h-[var(--btn-height)] bg-accent text-white font-bold rounded-xl disabled:opacity-50 hover:bg-accent-hover transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" /> تأكيد المصروف
              </button>
            </div>
          )}

          <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border bg-muted/30">
              <h2 className="font-bold flex items-center gap-2 text-lg">
                <Receipt className="w-5 h-5 text-accent" />
                سجل المصروفات الأخير
              </h2>
            </div>
            
            {isLoading ? (
              <div className="p-8 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full"></div></div>
            ) : expenses.length === 0 ? (
              <div className="p-8 text-center text-text-secondary">لا توجد مصروفات مسجلة بعد.</div>
            ) : (
              <div className="divide-y divide-border">
                {expenses.map(expense => {
                  const acc = accounts.find(a => a.id === expense.account_id);
                  return (
                    <div key={expense.id} className="p-4 hover:bg-muted/30 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold">{expense.category}</span>
                          <span className="text-sm bg-muted px-2 py-0.5 rounded text-text-secondary">{expense.expense_date}</span>
                        </div>
                        <p className="text-secondary text-sm">{expense.description}</p>
                        <p className="text-xs text-text-secondary mt-1">عبر: {acc?.name || 'حساب غير معروف'}</p>
                      </div>
                      <div className="font-bold text-lg text-danger numeric whitespace-nowrap bg-danger-bg px-3 py-1 rounded-lg">
                        - {formatMoney(expense.amount)}
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
