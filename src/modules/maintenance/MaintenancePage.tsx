import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getJobs, addJob, updateJobStatus, MaintenanceJob } from '@/db/queries/maintenance';
import { Wrench, Plus, CheckCircle, PackageCheck, Phone, X } from 'lucide-react';
import { formatMoney, parseMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const STATUS_MAP = {
  received: { label: 'قيد الاستلام', color: 'bg-muted text-text-secondary' },
  in_progress: { label: 'جاري الصيانة', color: 'bg-warning-bg text-warning' },
  completed: { label: 'تمت الصيانة', color: 'bg-success-bg text-success' },
  delivered: { label: 'سُلم للعميل', color: 'bg-accent/10 text-accent' },
};

export default function MaintenancePage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [isAddMode, setIsAddMode] = useState(false);
  
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    device_model: '',
    issue_description: '',
    expected_cost: '',
    notes: ''
  });

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['maintenance', filter],
    queryFn: () => getJobs(filter)
  });

  const saveMutation = useMutation({
    mutationFn: () => addJob({
      ...formData,
      expected_cost: parseMoney(formData.expected_cost)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      toast.success('تم استلام الجهاز بنجاح');
      setIsAddMode(false);
      setFormData({
        customer_name: '', customer_phone: '', device_model: '', 
        issue_description: '', expected_cost: '', notes: ''
      });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: MaintenanceJob['status'] }) => updateJobStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      toast.success('تم تحديث حالة الجهاز');
    }
  });

  return (
    <div className="flex flex-col h-full bg-background relative isolate">
      <header className="bg-surface border-b border-border p-4 sticky top-0 z-10 shrink-0">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Wrench className="w-6 h-6 text-accent" /> صيانة الأجهزة
            </h1>
            <button 
              onClick={() => setIsAddMode(true)}
              className="bg-accent text-white px-4 h-10 rounded-lg font-medium flex items-center gap-2 hover:bg-accent-hover transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">استلام جهاز جديد</span>
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {['all', 'received', 'in_progress', 'completed', 'delivered'].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={cn(
                  "px-4 h-10 rounded-xl whitespace-nowrap font-medium transition-colors border shadow-sm",
                  filter === s ? "bg-text-primary text-white border-transparent" : "bg-surface border-border text-text-secondary hover:border-accent"
                )}
              >
                {s === 'all' ? 'الكل' : STATUS_MAP[s as keyof typeof STATUS_MAP].label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 content-area">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="p-12 text-center"><div className="animate-spin w-8 h-8 mx-auto border-4 border-accent/30 border-t-accent rounded-full"></div></div>
          ) : jobs.length === 0 ? (
            <div className="text-center p-12 bg-surface rounded-2xl border border-border">
              <Wrench className="w-12 h-12 text-text-secondary mx-auto mb-4 opacity-50" />
              <p className="text-secondary font-medium">لا توجد أجهزة صيانة تطابق بحثك.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {jobs.map(job => (
                <div key={job.id} className="bg-surface border border-border rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm bg-muted px-2 py-0.5 rounded text-text-secondary">{job.job_number}</span>
                        <span className={cn("text-xs font-bold px-2 py-1 rounded", STATUS_MAP[job.status].color)}>
                          {STATUS_MAP[job.status].label}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg">{job.device_model}</h3>
                    </div>
                    {job.expected_cost && job.expected_cost > 0 && (
                      <div className="text-left">
                        <div className="text-xs text-text-secondary">التكلفة التقريبية</div>
                        <div className="font-bold numeric text-accent">{formatMoney(job.expected_cost)}</div>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-muted/50 p-3 rounded-xl text-sm space-y-1">
                    <p><span className="font-medium">المشكلة:</span> {job.issue_description}</p>
                    {job.notes && <p><span className="font-medium">ملاحظات:</span> {job.notes}</p>}
                  </div>

                  <div className="flex justify-between items-center text-sm border-t border-border pt-4">
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Phone className="w-4 h-4" /> 
                      <span className="font-medium">{job.customer_name}</span>
                      {job.customer_phone && <span className="numeric dir-ltr">({job.customer_phone})</span>}
                    </div>

                    <div className="flex gap-2">
                      {job.status === 'received' && (
                        <button 
                          onClick={() => updateStatusMutation.mutate({ id: job.id, status: 'in_progress' })}
                          className="px-3 py-1.5 bg-warning-bg text-warning rounded-lg font-bold text-xs"
                        >
                          البدء بالعمل
                        </button>
                      )}
                      {job.status === 'in_progress' && (
                        <button 
                          onClick={() => updateStatusMutation.mutate({ id: job.id, status: 'completed' })}
                          className="px-3 py-1.5 bg-success-bg text-success rounded-lg font-bold text-xs flex items-center gap-1"
                        >
                          <CheckCircle className="w-3 h-3" /> تم الإنجاز
                        </button>
                      )}
                      {job.status === 'completed' && (
                        <button 
                          onClick={() => updateStatusMutation.mutate({ id: job.id, status: 'delivered' })}
                          className="px-3 py-1.5 bg-accent text-white rounded-lg font-bold text-xs flex items-center gap-1"
                        >
                          <PackageCheck className="w-3 h-3" /> تسليم للعميل
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Job Dialog */}
      {isAddMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-surface w-full max-w-lg rounded-2xl p-6 shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h2 className="text-xl font-bold">استلام جهاز جديد للصيانة</h2>
              <button onClick={() => setIsAddMode(false)} className="p-2 hover:bg-muted rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">اسم العميل <span className="text-danger">*</span></label>
                  <input 
                    type="text" 
                    value={formData.customer_name}
                    onChange={e => setFormData({...formData, customer_name: e.target.value})}
                    className="w-full h-11 px-3 rounded-lg border border-border focus:border-accent outline-none bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">رقم الهاتف</label>
                  <input 
                    type="tel" 
                    value={formData.customer_phone}
                    onChange={e => setFormData({...formData, customer_phone: e.target.value})}
                    className="w-full h-11 px-3 rounded-lg border border-border focus:border-accent outline-none bg-background numeric dir-ltr text-right"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">نوع وموديل الجهاز <span className="text-danger">*</span></label>
                <input 
                  type="text" 
                  value={formData.device_model}
                  onChange={e => setFormData({...formData, device_model: e.target.value})}
                  className="w-full h-11 px-3 rounded-lg border border-border focus:border-accent outline-none bg-background"
                  placeholder="iPhone 13 Pro Max"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">وصف العطل <span className="text-danger">*</span></label>
                <textarea 
                  value={formData.issue_description}
                  onChange={e => setFormData({...formData, issue_description: e.target.value})}
                  className="w-full h-24 p-3 rounded-lg border border-border focus:border-accent outline-none bg-background resize-none"
                  placeholder="الشاشة مكسورة ولا تستجيب للمس..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">التكلفة التقريبية</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      inputMode="decimal"
                      value={formData.expected_cost}
                      onChange={e => setFormData({...formData, expected_cost: e.target.value})}
                      className="w-full h-11 pl-10 pr-3 rounded-lg border border-border focus:border-accent outline-none numeric font-bold bg-background"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">د.ع</span>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">ملاحظات إضافية</label>
                <input 
                  type="text" 
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  className="w-full h-11 px-3 rounded-lg border border-border focus:border-accent outline-none bg-background"
                  placeholder="مثال: الجهاز بدون شريحة، يوجد خدش في الخلف الدائم..."
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border shrink-0 mt-4">
              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !formData.customer_name || !formData.device_model || !formData.issue_description}
                className="w-full h-[var(--btn-height)] bg-accent text-white font-bold rounded-lg disabled:opacity-50 hover:bg-accent-hover transition-colors shadow-sm"
              >
                تأكيد الاستلام
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
