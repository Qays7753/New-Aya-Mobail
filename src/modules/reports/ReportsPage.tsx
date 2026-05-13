import { BarChart3, LineChart, FileDown } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-background p-6">
      <div className="w-24 h-24 bg-accent/10 rounded-full flex items-center justify-center text-accent mb-6">
        <BarChart3 className="w-12 h-12" />
      </div>
      <h1 className="text-3xl font-bold mb-4">التقارير و الإحصاءات</h1>
      <p className="text-text-secondary text-lg max-w-lg text-center mb-8">
        هذا القسم قيد التطوير. سيمكنك قريباً من استخراج تقارير الأرباح والخسائر، ضريبة المبيعات، الميزانية العمومية، وتصدير البيانات بصيغة PDF و Excel.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
        <div className="bg-surface border border-border p-6 rounded-2xl flex flex-col items-center justify-center text-center opacity-50 grayscale">
          <LineChart className="w-8 h-8 mb-3" />
          <div className="font-bold">حركة الأرباح</div>
        </div>
        <div className="bg-surface border border-border p-6 rounded-2xl flex flex-col items-center justify-center text-center opacity-50 grayscale">
          <FileDown className="w-8 h-8 mb-3" />
          <div className="font-bold">الميزانية العمومية</div>
        </div>
        <div className="bg-surface border border-border p-6 rounded-2xl flex flex-col items-center justify-center text-center opacity-50 grayscale">
          <BarChart3 className="w-8 h-8 mb-3" />
          <div className="font-bold">مبيعات الأصناف</div>
        </div>
      </div>
    </div>
  );
}
