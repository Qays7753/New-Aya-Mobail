// Removed Dialog import
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRecentInvoices, returnInvoice, getInvoiceWithItems } from '@/db/queries/sales';
import { getActiveAccounts } from '@/db/queries/accounts';
import { useAuth } from '@/contexts/AuthContext';
import { formatMoney, parseMoney } from '@/lib/money';
import { format } from 'date-fns';
import { FileText, ArrowRightLeft, Search, XCircle, X, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { ReceiptOverlay } from '@/components/receipt/ReceiptOverlay';

export default function SalesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [refunds, setRefunds] = useState<{accountId: string, amountInput: string}[]>([]);
  
  const [receiptOverlayOpen, setReceiptOverlayOpen] = useState(false);
  const [receiptInvoiceData, setReceiptInvoiceData] = useState<any>(null);

  const { requireAdminAction } = useAuth();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => getRecentInvoices(100)
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['active-accounts'],
    queryFn: getActiveAccounts,
  });

  const returnMutation = useMutation({
    mutationFn: () => {
      const parsedRefunds = refunds.map(r => ({
        accountId: r.accountId,
        amount: parseMoney(r.amountInput || '0')
      })).filter(r => r.amount > 0);

      return returnInvoice(selectedInvoice.id, parsedRefunds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['active-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['ledger-entries'] });
      toast.success('تم استرجاع الفاتورة بنجاح');
      setReturnDialogOpen(false);
    },
    onError: (err: any) => {
      toast.error('حدث خطأ: ' + err.message);
    }
  });

  const openReturnDialog = (invoice: any) => {
    setSelectedInvoice(invoice);
    if (accounts.length > 0) {
      setRefunds([{ accountId: accounts[0].id, amountInput: (invoice.paid_amount / 100).toString() }]);
    }
    setReturnDialogOpen(true);
  };

  const handleUpdateRefund = (index: number, field: string, value: string) => {
    const updated = [...refunds];
    updated[index] = { ...updated[index], [field]: value };
    setRefunds(updated);
  };

  const filteredInvoices = invoices.filter((inv: any) => 
    inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background relative isolate">
      <header className="bg-surface border-b border-border p-4 shrink-0">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="w-6 h-6 text-accent" />
              فواتير المبيعات
            </h1>
            <p className="text-sm text-text-secondary">إدارة المبيعات السابقة واسترجاع الفواتير</p>
          </div>
          
          <div className="relative w-full md:w-64">
            <input 
              type="text" 
              placeholder="البحث برقم الفاتورة..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pe-10 ps-4 rounded-xl border border-border bg-background focus:border-accent outline-none"
            />
            <Search className="w-5 h-5 text-text-secondary absolute end-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 content-area">
        <div className="max-w-4xl mx-auto space-y-4">
          {isLoading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full"></div>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center p-12 text-text-secondary bg-surface rounded-2xl border border-border">
              لا توجد فواتير مطابقة
            </div>
          ) : (
            filteredInvoices.map((inv: any) => (
              <div key={inv.id} className="bg-surface border border-border p-4 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4 shadow-sm hover:border-accent/50 transition-colors">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-lg">{inv.invoice_number}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      inv.status === 'returned' ? 'bg-danger-bg text-danger' : 
                      inv.status === 'cancelled' ? 'bg-muted text-text-secondary' : 
                      'bg-success-bg text-success'
                    }`}>
                      {inv.status === 'returned' ? 'مسترجع' : inv.status === 'cancelled' ? 'ملغي' : 'مكتمل'}
                    </span>
                  </div>
                  <div className="text-sm text-text-secondary flex gap-4">
                    <span>التاريخ: {inv.invoice_date}</span>
                    <span>الوقت: {format(new Date(inv.created_at), 'HH:mm')}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-end">
                    <span className="block text-sm text-text-secondary">الإجمالي</span>
                    <span className="font-bold text-lg numeric text-accent">{formatMoney(inv.total_amount)}</span>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={async () => {
                        try {
                          const data = await getInvoiceWithItems(inv.id);
                          if (data) {
                            setReceiptInvoiceData(data);
                            setReceiptOverlayOpen(true);
                          }
                        } catch (err: any) {
                          toast.error('حدث خطأ أثناء عرض الإيصال');
                        }
                      }}
                      className="h-10 px-4 bg-surface text-text-primary font-medium rounded-lg hover:bg-muted transition-colors flex items-center gap-2 border border-border"
                    >
                      <Eye className="w-4 h-4" /> عرض الإيصال
                    </button>
                    {inv.status === 'active' && (
                      <button 
                        onClick={() => openReturnDialog(inv)}
                        className="h-10 px-4 bg-danger-bg text-danger font-medium rounded-lg hover:bg-danger/20 transition-colors flex items-center gap-2 border border-danger/20"
                      >
                        <ArrowRightLeft className="w-4 h-4" /> استرجاع
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {returnDialogOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface rounded-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] shadow-xl">
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h2 className="text-xl font-bold">استرجاع فاتورة</h2>
              <button onClick={() => setReturnDialogOpen(false)} className="p-2 hover:bg-muted rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-4">
              <div className="p-3 bg-danger-bg/50 border border-danger/20 rounded-xl mb-4">
                <p className="text-danger font-medium text-sm flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4" />
                  هل أنت متأكد من استرجاع الفاتورة {selectedInvoice.invoice_number}؟
                </p>
                <p className="text-xs text-danger/80 mt-1">سيتم إرجاع البضاعة للمخزن ويجب تحديد طريقة رد المبلغ للعميل.</p>
              </div>

              <div className="space-y-3">
                <label className="font-bold flex justify-between items-center text-sm">
                  <span>رد المبلغ (الإجمالي: {formatMoney(selectedInvoice.paid_amount)})</span>
                  <button 
                    onClick={() => setRefunds([...refunds, { accountId: accounts[0]?.id || '', amountInput: '0' }])}
                    className="text-accent text-xs hover:underline"
                  >
                    + صندوق آخر
                  </button>
                </label>

                {refunds.map((r, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-background rounded-xl border border-border p-2">
                    <select 
                      value={r.accountId}
                      onChange={(e) => handleUpdateRefund(idx, 'accountId', e.target.value)}
                      className="h-10 px-2 rounded-lg bg-muted text-sm font-medium border-none outline-none w-1/2"
                    >
                      {accounts.map((acc: any) => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                      ))}
                    </select>
                    <div className="relative flex-1">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={r.amountInput}
                        onChange={(e) => handleUpdateRefund(idx, 'amountInput', e.target.value)}
                        className="w-full h-10 pe-8 ps-2 rounded-lg border-none bg-muted font-bold numeric text-start outline-none focus:ring-1 focus:ring-accent"
                        style={{ direction: 'ltr' }}
                      />
                      <span className="absolute end-2 top-1/2 -translate-y-1/2 text-text-secondary text-xs">د.ع</span>
                    </div>
                    {refunds.length > 1 && (
                      <button 
                        onClick={() => setRefunds(refunds.filter((_, i) => i !== idx))}
                        className="p-2 text-danger hover:bg-danger/10 rounded-lg shrink-0"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-border flex gap-3 mt-6">
                <button
                  onClick={() => {
                    requireAdminAction(() => returnMutation.mutate());
                  }}
                  disabled={returnMutation.isPending}
                  className="flex-1 h-11 bg-danger text-white font-bold rounded-lg hover:bg-danger/90 flex justify-center items-center gap-2"
                >
                  تأكيد الاسترجاع
                </button>
                <button
                  onClick={() => setReturnDialogOpen(false)}
                  className="flex-1 h-11 bg-surface border border-border font-medium rounded-lg hover:bg-muted"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {receiptOverlayOpen && receiptInvoiceData && (
        <ReceiptOverlay
          isOpen={true}
          onClose={() => setReceiptOverlayOpen(false)}
          invoice={receiptInvoiceData}
        />
      )}
    </div>
  );
}
