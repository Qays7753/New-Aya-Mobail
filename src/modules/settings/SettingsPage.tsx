import React, { useState, useRef } from 'react';
import { Settings, Shield, HardDrive, Download, Upload, AlertTriangle, Key } from 'lucide-react';
import { dbClient } from '@/db/client';
import { savePin } from '@/lib/pin';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'security' | 'backup'>('security');
  
  // Security
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { requireAdminAction } = useAuth();

  const handleSavePin = async () => {
    if (newPin.length < 4) {
      toast.error('رمز PIN يجب أن يكون 4 أرقام على الأقل');
      return;
    }
    if (newPin !== confirmPin) {
      toast.error('الرموز غير متطابقة');
      return;
    }

    try {
      await savePin(newPin, false);
      toast.success('تم تغيير رمز PIN بنجاح');
      setIsChangingPin(false);
      setNewPin('');
      setConfirmPin('');
    } catch (e: any) {
      toast.error('حدث خطأ أثناء حفظ الرمز');
    }
  };

  const handleExportBackup = async () => {
    try {
      const dbData = await dbClient.exportDatabase();
      const blob = new Blob([dbData], { type: 'application/x-sqlite3' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pos_backup_${new Date().toISOString().split('T')[0]}.db`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('تم تصدير النسخة الاحتياطية بنجاح');
    } catch (e: any) {
      toast.error('فشل تصدير النسخة الاحتياطية: ' + e.message);
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (confirm('تنبيه: استعادة النسخة الاحتياطية سيقوم بمسح كافة البيانات الحالية. هل أنت متأكد؟')) {
      try {
        const buffer = await file.arrayBuffer();
        await dbClient.importDatabase(new Uint8Array(buffer));
        toast.success('تم استعادة البيانات بنجاح. سيتم إعادة تحميل التطبيق.');
        setTimeout(() => window.location.reload(), 1500);
      } catch (err: any) {
        toast.error('فشل استعادة البيانات: ' + err.message);
      }
    }
    
    // reset
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-background relative isolate">
      <header className="bg-surface border-b border-border p-4 shrink-0">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-12 h-12 bg-accent/10 text-accent rounded-xl flex items-center justify-center shrink-0">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">الإعدادات</h1>
            <p className="text-sm text-text-secondary">إدارة الأمان والنسخ الاحتياطي</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 content-area">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-6">
          
          {/* Sidebar Tabs */}
          <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
            <button
              onClick={() => setActiveTab('security')}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-start",
                activeTab === 'security' 
                  ? "bg-accent text-white shadow-sm" 
                  : "bg-surface text-text-secondary hover:bg-muted"
              )}
            >
              <Shield className="w-5 h-5" />
              الأمان
            </button>
            <button
              onClick={() => setActiveTab('backup')}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-start",
                activeTab === 'backup' 
                  ? "bg-accent text-white shadow-sm" 
                  : "bg-surface text-text-secondary hover:bg-muted"
              )}
            >
              <HardDrive className="w-5 h-5" />
              النسخ الاحتياطي
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-surface border border-border rounded-2xl p-6">
            
            {activeTab === 'security' && (
              <div className="space-y-6 animate-in fade-in">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Key className="w-6 h-6 text-accent" /> رمز الحماية (PIN)
                </h2>
                
                <div className="bg-muted p-4 rounded-xl border border-border">
                  <p className="text-sm text-text-secondary mb-4 leading-relaxed">
                    يُستخدم رمز الحماية لتأكيد العمليات الحساسة مثل استرجاع الفواتير، التعديل على الحسابات، وتسليم الأجهزة من الصيانة.
                  </p>
                  
                  {!isChangingPin ? (
                    <button
                      onClick={() => {
                        requireAdminAction(() => setIsChangingPin(true));
                      }}
                      className="h-11 px-6 bg-accent text-white font-bold rounded-lg hover:bg-accent-hover transition-colors flex items-center gap-2"
                    >
                      تغيير رمز PIN
                    </button>
                  ) : (
                    <div className="space-y-4 max-w-sm bg-surface p-4 rounded-xl border border-border">
                      <h3 className="font-bold">إعداد رمز جديد</h3>
                      <div>
                        <label className="block text-sm mb-1 text-text-secondary">الرمز الجديد</label>
                        <input
                          type="password"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={newPin}
                          onChange={(e) => setNewPin(e.target.value)}
                          className="w-full h-11 px-3 rounded-lg border border-border outline-none focus:border-accent text-center tracking-widest text-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1 text-text-secondary">تأكيد الرمز</label>
                        <input
                          type="password"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={confirmPin}
                          onChange={(e) => setConfirmPin(e.target.value)}
                          className="w-full h-11 px-3 rounded-lg border border-border outline-none focus:border-accent text-center tracking-widest text-lg"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSavePin}
                          className="flex-1 h-11 bg-accent text-white font-bold rounded-lg hover:bg-accent-hover transition-colors"
                        >
                          تأكيد
                        </button>
                        <button
                          onClick={() => {
                            setIsChangingPin(false);
                            setNewPin('');
                            setConfirmPin('');
                          }}
                          className="flex-1 h-11 bg-muted text-text-primary font-bold rounded-lg hover:bg-border transition-colors border border-border"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'backup' && (
              <div className="space-y-6 animate-in fade-in">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <HardDrive className="w-6 h-6 text-accent" /> النسخ الاحتياطي والاستعادة
                </h2>

                <div className="bg-warning-bg/30 border border-warning/30 p-4 rounded-xl mb-6 flex gap-3">
                  <AlertTriangle className="w-6 h-6 text-warning shrink-0" />
                  <div className="text-sm text-text-primary">
                    <p className="font-bold mb-1">البيانات تخزن محلياً فقط!</p>
                    <p>هذا المتجر يعمل بدون إنترنت ويخزن بياناته داخل متصفحك. <strong>يجب عليك أخذ نسخة احتياطية بشكل دوري</strong> لتجنب فقدان البيانات أو في حال أردت نقلها لجهاز آخر.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-border rounded-xl p-5 flex flex-col items-center justify-center text-center gap-3">
                    <div className="w-12 h-12 bg-success/10 text-success rounded-full flex items-center justify-center">
                      <Download className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold">أخذ نسخة احتياطية</h3>
                    <p className="text-sm text-text-secondary">تحميل قاعدة البيانات الحالية لـحفظها في مكان آمن.</p>
                    <button
                      onClick={handleExportBackup}
                      className="mt-2 w-full h-11 bg-success text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
                    >
                      تنزيل ملف النسخة
                    </button>
                  </div>

                  <div className="border border-border rounded-xl p-5 flex flex-col items-center justify-center text-center gap-3">
                    <div className="w-12 h-12 bg-accent/10 text-accent rounded-full flex items-center justify-center">
                      <Upload className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold">استعادة نسخة</h3>
                    <p className="text-sm text-text-secondary">رفع ملف نسخة سابقة واستعادة كامل البيانات منها.</p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2 w-full h-11 border-2 border-accent text-accent font-bold rounded-lg hover:bg-accent/5 transition-colors"
                    >
                      اختيار ملف النسخة
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept=".db"
                      onChange={handleImportBackup}
                    />
                  </div>
                </div>
                
              </div>
            )}
            
          </div>
        </div>
      </main>
    </div>
  );
}
