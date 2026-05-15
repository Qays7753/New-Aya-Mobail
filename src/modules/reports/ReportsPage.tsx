import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getComprehensiveMonthlyReport } from '@/db/queries/reports';
import { formatMoney } from '@/lib/money';
import { BarChart3, TrendingUp, TrendingDown, Receipt, Calendar, Download, PieChart as PieChartIcon, Package, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import * as XLSX from 'xlsx';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

type Tab = 'overview' | 'sales' | 'expenses' | 'products';

const COLORS = ['#CF694A', '#D4AF37', '#2A3F54', '#5CB85C', '#5BC0DE', '#F0AD4E', '#D9534F'];

export default function ReportsPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  
  const { data: report, isLoading } = useQuery({
    queryKey: ['monthly-report-comprehensive', currentMonth],
    queryFn: () => getComprehensiveMonthlyReport(new Date(currentMonth + '-01'))
  });

  const handleExportExcel = () => {
    if (!report) return;
    
    const wb = XLSX.utils.book_new();

    // 1. Daily Summary
    const dailyWS = XLSX.utils.json_to_sheet(report.dailyReport.map(d => ({
      'التاريخ': d.date,
      'المبيعات': d.sales,
      'المدفوع': d.paid_sales,
      'الخصم': d.discount,
      'المصروفات': d.expenses,
      'صافي الأرباح': d.netProfit
    })));
    XLSX.utils.book_append_sheet(wb, dailyWS, "الملخص اليومي");

    // 2. Sales By Category
    const salesCatWS = XLSX.utils.json_to_sheet(report.salesByCategory.map(c => ({
      'الفئة': c.category || 'غير مصنف',
      'إجمالي المبيعات': c.total
    })));
    XLSX.utils.book_append_sheet(wb, salesCatWS, "المبيعات حسب الفئة");

    // 3. Top Products
    const topProdWS = XLSX.utils.json_to_sheet(report.topProducts.map(p => ({
      'المنتج': p.name,
      'الكمية المباعة': p.qty,
      'إجمالي المبيعات': p.total
    })));
    XLSX.utils.book_append_sheet(wb, topProdWS, "المنتجات الأكثر مبيعاً");

    // 4. Expenses By Category
    const expCatWS = XLSX.utils.json_to_sheet(report.expensesByCategory.map(e => ({
      'الفئة': e.category || 'غير مصنف',
      'إجمالي المصروفات': e.total
    })));
    XLSX.utils.book_append_sheet(wb, expCatWS, "المصروفات حسب الفئة");

    XLSX.writeFile(wb, `تقرير_${currentMonth}.xlsx`);
  };

  return (
    <div className="flex flex-col h-full bg-background relative isolate">
      <header className="bg-surface border-b border-border p-4 sticky top-0 z-10 shrink-0">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-accent/10 text-accent rounded-xl flex items-center justify-center shrink-0">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">التقارير التحليلية</h1>
              <p className="text-sm text-text-secondary">تقارير مفصلة للمبيعات والمصروفات والأرباح</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 no-scrollbar">
            <div className="bg-muted p-1 px-3 py-1.5 rounded-xl border border-border flex items-center gap-2 font-bold focus-within:border-accent shrink-0">
              <Calendar className="w-4 h-4 text-text-secondary" />
              <input 
                type="month" 
                value={currentMonth}
                onChange={(e) => setCurrentMonth(e.target.value)}
                className="bg-transparent border-none outline-none font-medium cursor-pointer flex-1 text-sm dir-ltr"
              />
            </div>
            
            <button 
              onClick={handleExportExcel}
              disabled={!report || isLoading}
              className="h-10 px-4 bg-success text-white font-bold text-sm rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 shrink-0 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">تصدير Excel</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto mt-6 flex overflow-x-auto no-scrollbar gap-2 border-b border-border">
          {[
            { id: 'overview', label: 'نظرة عامة', icon: Target },
            { id: 'sales', label: 'المبيعات', icon: Receipt },
            { id: 'expenses', label: 'المصروفات', icon: TrendingDown },
            { id: 'products', label: 'المنتجات', icon: Package },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={cn(
                  "flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors",
                  isActive 
                    ? "border-accent text-accent" 
                    : "border-transparent text-text-secondary hover:text-text-primary hover:border-border"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 content-area">
        <div className="max-w-6xl mx-auto space-y-6">
          {isLoading ? (
            <div className="p-12 text-center"><div className="animate-spin w-8 h-8 mx-auto border-4 border-accent/30 border-t-accent rounded-full"></div></div>
          ) : report ? (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Totals Summary */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-surface border border-border p-5 rounded-2xl">
                      <div className="text-text-secondary mb-2 flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-accent" />
                        المبيعات (قبل الخصم)
                      </div>
                      <div className="text-2xl lg:text-3xl font-bold numeric text-text-primary">{formatMoney(report.totals.sales + report.totals.discount)}</div>
                      {report.totals.discount > 0 && <div className="text-sm text-danger mt-1">خصومات: {formatMoney(report.totals.discount)}</div>}
                    </div>
                    <div className="bg-surface border border-border p-5 rounded-2xl">
                      <div className="text-text-secondary mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-success" />
                        المبيعات الصافية
                      </div>
                      <div className="text-2xl lg:text-3xl font-bold numeric text-success">{formatMoney(report.totals.sales)}</div>
                    </div>
                    <div className="bg-surface border border-border p-5 rounded-2xl">
                      <div className="text-text-secondary mb-2 flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-danger" />
                        المصروفات
                      </div>
                      <div className="text-2xl lg:text-3xl font-bold numeric text-danger">{formatMoney(report.totals.expenses)}</div>
                    </div>
                    <div className="bg-surface border border-border p-5 rounded-2xl relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-accent/5 pointer-events-none" />
                      <div className="text-text-secondary mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4 text-accent" />
                        صافي الأرباح (تقريبي)
                      </div>
                      <div className={cn("text-2xl lg:text-3xl font-bold numeric", report.totals.netProfit >= 0 ? "text-success" : "text-danger")}>
                        {formatMoney(report.totals.netProfit)}
                      </div>
                    </div>
                  </div>

                  {/* Profit Chart */}
                  <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
                    <h3 className="font-bold text-lg mb-6">مخطط الأرباح والمصروفات اليومي</h3>
                    <div className="h-[300px] w-full" dir="ltr">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={report.dailyReport.slice().reverse()} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis dataKey="date" tickFormatter={(val) => format(parseISO(val), 'dd')} tick={{fontSize: 12}} />
                          <YAxis tick={{fontSize: 12}} tickFormatter={(val) => `${val/1000}k`} />
                          <Tooltip 
                            formatter={(value: number) => formatMoney(value)}
                            labelFormatter={(label) => format(parseISO(label), 'yyyy-MM-dd')}
                            contentStyle={{ borderRadius: '12px', borderColor: '#E5E7EB', textAlign: 'right' }}
                          />
                          <Legend />
                          <Bar dataKey="sales" name="المبيعات" fill="#5CB85C" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="expenses" name="المصروفات" fill="#D9534F" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'sales' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
                      <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                        <PieChartIcon className="w-5 h-5 text-accent" />
                        المبيعات حسب الفئة
                      </h3>
                      <div className="h-[300px] w-full" dir="ltr">
                        {report.salesByCategory.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={report.salesByCategory}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="total"
                                nameKey="category"
                                label={({name, percent}) => `${name || 'غير مصنف'} ${(percent * 100).toFixed(0)}%`}
                              >
                                {report.salesByCategory.map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value: number) => formatMoney(value)} />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-text-secondary">لا توجد بيانات مبيعات</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
                      <div className="p-5 border-b border-border bg-muted/30">
                         <h3 className="font-bold text-lg">تفصيل المبيعات حسب الفئة</h3>
                      </div>
                      <div className="overflow-y-auto max-h-[300px]">
                        <table className="w-full text-sm text-start">
                          <thead className="bg-muted text-text-secondary font-medium sticky top-0">
                            <tr>
                              <th className="px-5 py-3">الفئة</th>
                              <th className="px-5 py-3 text-end">المبيعات</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {report.salesByCategory.map((s: any, idx: number) => (
                              <tr key={idx} className="hover:bg-muted/30 transition-colors">
                                <td className="px-5 py-3 font-medium">{s.category || 'غير مصنف'}</td>
                                <td className="px-5 py-3 text-end font-bold numeric">{formatMoney(s.total)}</td>
                              </tr>
                            ))}
                            {report.salesByCategory.length === 0 && (
                              <tr><td colSpan={2} className="px-5 py-8 text-center text-text-secondary">لا توجد بيانات</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Daily Table */}
                  <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-border bg-muted/30">
                      <h2 className="font-bold text-lg">التقرير اليومي لشهر {format(new Date(currentMonth + '-01'), 'MMMM yyyy')}</h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-start">
                        <thead className="bg-muted text-text-secondary font-medium">
                          <tr>
                            <th className="px-4 py-3">التاريخ</th>
                            <th className="px-4 py-3 text-center">إجمالي المبيعات</th>
                            <th className="px-4 py-3 text-center">نقداً</th>
                            <th className="px-4 py-3 text-center">خصومات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {report.dailyReport.map((day: any) => {
                            const isWeekend = new Date(day.date).getDay() === 5;
                            if (day.sales === 0) return null;

                            return (
                              <tr key={day.date} className={cn("hover:bg-muted/30 transition-colors", isWeekend && "bg-danger/5")}>
                                <td className="px-4 py-3 whitespace-nowrap font-medium text-text-primary">
                                  {format(parseISO(day.date), 'dd/MM/yyyy')}
                                </td>
                                <td className="px-4 py-3 text-center font-bold numeric text-text-primary">{formatMoney(day.sales)}</td>
                                <td className="px-4 py-3 text-center numeric text-success">{formatMoney(day.paid_sales)}</td>
                                <td className="px-4 py-3 text-center numeric text-danger">{formatMoney(day.discount)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'expenses' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
                      <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                        <PieChartIcon className="w-5 h-5 text-danger" />
                        المصروفات حسب الفئة
                      </h3>
                      <div className="h-[300px] w-full" dir="ltr">
                        {report.expensesByCategory.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={report.expensesByCategory}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="total"
                                nameKey="category"
                                label={({name, percent}) => `${name || 'غير مصنف'} ${(percent * 100).toFixed(0)}%`}
                              >
                                {report.expensesByCategory.map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[(index+2) % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value: number) => formatMoney(value)} />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-text-secondary">لا توجد مسحوبات</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
                      <div className="p-5 border-b border-border bg-muted/30">
                         <h3 className="font-bold text-lg">تفصيل المصروفات حسب الفئة</h3>
                      </div>
                      <div className="overflow-y-auto max-h-[300px]">
                        <table className="w-full text-sm text-start">
                          <thead className="bg-muted text-text-secondary font-medium sticky top-0">
                            <tr>
                              <th className="px-5 py-3">الفئة</th>
                              <th className="px-5 py-3 text-end">المصروفات</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {report.expensesByCategory.map((e: any, idx: number) => (
                              <tr key={idx} className="hover:bg-muted/30 transition-colors">
                                <td className="px-5 py-3 font-medium">{e.category || 'غير مصنف'}</td>
                                <td className="px-5 py-3 text-end font-bold numeric text-danger">{formatMoney(e.total)}</td>
                              </tr>
                            ))}
                            {report.expensesByCategory.length === 0 && (
                              <tr><td colSpan={2} className="px-5 py-8 text-center text-text-secondary">لا توجد بيانات</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'products' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
                    <div className="p-5 border-b border-border bg-muted/30">
                       <h3 className="font-bold text-lg">أكثر 10 منتجات مبيعاً</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-start">
                        <thead className="bg-muted text-text-secondary font-medium">
                          <tr>
                            <th className="px-5 py-3 w-16 text-center">#</th>
                            <th className="px-5 py-3">المنتج</th>
                            <th className="px-5 py-3 text-center">الكمية المباعة</th>
                            <th className="px-5 py-3 text-end">إجمالي قيمة المبيعات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {report.topProducts.map((p: any, idx: number) => (
                            <tr key={idx} className="hover:bg-muted/30 transition-colors">
                              <td className="px-5 py-3 text-center text-text-secondary font-medium">{idx + 1}</td>
                              <td className="px-5 py-3 font-medium">{p.name}</td>
                              <td className="px-5 py-3 text-center numeric font-bold">{p.qty}</td>
                              <td className="px-5 py-3 text-end font-bold numeric text-success">{formatMoney(p.total)}</td>
                            </tr>
                          ))}
                          {report.topProducts.length === 0 && (
                            <tr><td colSpan={4} className="px-5 py-8 text-center text-text-secondary">لا توجد بيانات</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                       الكميات المباعة للمنتجات الأكثر مبيعاً
                    </h3>
                    <div className="h-[300px] w-full" dir="ltr">
                      {report.topProducts.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={report.topProducts} margin={{ top: 10, right: 10, left: 10, bottom: 20 }} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                            <XAxis type="number" tick={{fontSize: 12}} />
                            <YAxis type="category" dataKey="name" tick={{fontSize: 12}} width={120} />
                            <Tooltip 
                              cursor={{fill: 'transparent'}}
                              contentStyle={{ borderRadius: '12px', borderColor: '#E5E7EB', textAlign: 'right' }}
                            />
                            <Bar dataKey="qty" name="الكمية المباعة" fill="#D4AF37" radius={[0, 4, 4, 0]}>
                              {report.topProducts.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-text-secondary">لا توجد بيانات</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}

