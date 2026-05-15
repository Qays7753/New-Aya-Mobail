import React, { useState, useRef, useEffect } from 'react';
import { Settings, Shield, HardDrive, Download, Upload, AlertTriangle, Key, Store, Receipt } from 'lucide-react';
import { dbClient } from '@/db/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { exportDb, importDb } from '@/lib/backup';
import { changeDailyLock, changeAdminPin } from '@/lib/auth';
import { useSettingsStore } from '@/stores/settings.store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'pos' | 'security' | 'backup'>('general');
  const { settings, updateSettings } = useSettingsStore();

  // General Settings
  const [storeName, setStoreName] = useState(settings.storeName);
  const [storePhone, setStoreNamePhone] = useState(settings.storePhone);
  const [storeAddress, setStoreAddress] = useState(settings.storeAddress);

  // POS Settings
  const [receiptHeader, setReceiptHeader] = useState(settings.receiptHeader);
  const [receiptFooter, setReceiptFooter] = useState(settings.receiptFooter);
  const [taxPercent, setTaxPercent] = useState(settings.taxPercent.toString());
  
  // Security - Daily
  const [dailyLockCurrentAdminPin, setDailyLockCurrentAdminPin] = useState('');
  const [newDailyLock, setNewDailyLock] = useState('');
  const [confirmDailyLock, setConfirmDailyLock] = useState('');
  
  // Security - Admin
  const [adminCurrentPin, setAdminCurrentPin] = useState('');
  const [newAdminPin, setNewAdminPin] = useState('');
  const [confirmAdminPin, setConfirmAdminPin] = useState('');

  const [isChangingDaily, setIsChangingDaily] = useState(false);
  const [isChangingAdmin, setIsChangingAdmin] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { requireAdminAction } = useAuth();

  const handleSaveDailyLock = async () => {
    if (newDailyLock.length < 4) {
      toast.error('الرمز يجب أن يكون 4 أرقام على الأقل');
      return;
    }
    if (newDailyLock !== confirmDailyLock) {
      toast.error('الرموز غير متطابقة');
      return;
    }

    try {
      await changeDailyLock(newDailyLock, dailyLockCurrentAdminPin);
      toast.success('تم تغيير قفل اليومية بنجاح');
      setIsChangingDaily(false);
      setNewDailyLock('');
      setConfirmDailyLock('');
      setDailyLockCurrentAdminPin('');
    } catch (e: any) {
      toast.error(e.message || 'خطأ في تغيير الرمز');
    }
  };

  const handleSaveAdminPin = async () => {
    if (newAdminPin.length < 4) {
      toast.error('الرمز يجب أن يكون 4 أرقام على الأقل');
      return;
    }
    if (newAdminPin !== confirmAdminPin) {
      toast.error('الرموز غير متطابقة');
      return;
    }

    try {
      await changeAdminPin(adminCurrentPin, newAdminPin);
      toast.success('تم تغيير رمز المشرف بنجاح');
      setIsChangingAdmin(false);
      setNewAdminPin('');
      setConfirmAdminPin('');
      setAdminCurrentPin('');
    } catch (e: any) {
      toast.error(e.message || 'خطأ في تغيير الرمز');
    }
  };

  const handleExportBackup = async () => {
    requireAdminAction(async () => {
      try {
        await exportDb();
        toast.success('تم تصدير النسخة الاحتياطية بنجاح');
      } catch (e: any) {
        toast.error('فشل تصدير النسخة الاحتياطية: ' + e.message);
      }
    });
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (fileInputRef.current) fileInputRef.current.value = '';

    requireAdminAction(async () => {
      try {
        toast.loading('جارٍ التحقق من الملف وأخذ نسخة احتياطية واستعادة البيانات...');
        await importDb(file);
      } catch (err: any) {
        toast.dismiss();
        toast.error('فشلت الاستعادة: ' + err.message);
      }
    });
  };

  const handleSaveGeneral = () => {
    requireAdminAction(() => {
      updateSettings({
        storeName,
        storePhone,
        storeAddress,
      });
      toast.success('تم حفظ إعدادات المتجر');
    });
  };

  const handleSavePOS = () => {
    requireAdminAction(() => {
      updateSettings({
        receiptHeader,
        receiptFooter,
        taxPercent: parseFloat(taxPercent) || 0,
      });
      toast.success('تم حفظ إعدادات الطباعة');
    });
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
              onClick={() => setActiveTab('general')}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-start",
                activeTab === 'general' 
                  ? "bg-accent text-white shadow-sm" 
                  : "bg-surface text-text-secondary hover:bg-muted"
              )}
            >
              <Store className="w-5 h-5" />
              إعدادات المتجر
            </button>
            <button
              onClick={() => setActiveTab('pos')}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-start",
                activeTab === 'pos' 
                  ? "bg-accent text-white shadow-sm" 
                  : "bg-surface text-text-secondary hover:bg-muted"
              )}
            >
              <Receipt className="w-5 h-5" />
              نقطة البيع والطباعة
            </button>
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
            
            {activeTab === 'general' && (
              <div className="space-y-6 animate-in fade-in">
                <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                  <Store className="w-6 h-6 text-accent" /> إعدادات المتجر
                </h2>
                
                <div className="max-w-md space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">اسم المتجر</label>
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="w-full h-11 px-3 rounded-lg border border-border outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">رقم الهاتف (للتواصل السريع)</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={storePhone}
                      onChange={(e) => setStoreNamePhone(e.target.value)}
                      className="w-full h-11 px-3 rounded-lg border border-border outline-none focus:border-accent text-start text-left"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">العنوان</label>
                    <textarea
                      value={storeAddress}
                      onChange={(e) => setStoreAddress(e.target.value)}
                      className="w-full p-3 rounded-lg border border-border outline-none focus:border-accent resize-none h-24"
                    />
                  </div>
                  
                  <button
                    onClick={handleSaveGeneral}
                    className="h-11 px-6 bg-accent text-white font-bold rounded-lg hover:bg-accent-hover transition-colors"
                  >
                    حفظ إعدادات المتجر
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'pos' && (
              <div className="space-y-6 animate-in fade-in">
                <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                  <Receipt className="w-6 h-6 text-accent" /> نقطة البيع والطباعة
                </h2>
                
                <div className="max-w-md space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">الرقم الضريبي / ترويسة الفاتورة (أعلى الفاتورة)</label>
                    <textarea
                      value={receiptHeader}
                      onChange={(e) => setReceiptHeader(e.target.value)}
                      className="w-full p-3 rounded-lg border border-border outline-none focus:border-accent resize-none h-24 text-center leading-relaxed"
                      placeholder="مثال: الرقم الضريبي: 123456789"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">الجزء السفلي من الفاتورة (تذييل)</label>
                    <textarea
                      value={receiptFooter}
                      onChange={(e) => setReceiptFooter(e.target.value)}
                      className="w-full p-3 rounded-lg border border-border outline-none focus:border-accent resize-none h-24 text-center leading-relaxed"
                      placeholder="مثال: شكراً لتسوقكم معنا"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">نسبة الضريبة الافتراضية (%)</label>
                    <input
                      type="number"
                      dir="ltr"
                      min="0"
                      max="100"
                      value={taxPercent}
                      onChange={(e) => setTaxPercent(e.target.value)}
                      className="w-full h-11 px-3 rounded-lg border border-border outline-none focus:border-accent text-start"
                    />
                  </div>
                  
                  <button
                    onClick={handleSavePOS}
                    className="h-11 px-6 bg-accent text-white font-bold rounded-lg hover:bg-accent-hover transition-colors"
                  >
                    حفظ إعدادات الطباعة
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-8 animate-in fade-in">
                {/* Daily Lock Section */}
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                    <Key className="w-6 h-6 text-accent" /> رمز قفل اليومية (Daily Lock)
                  </h2>
                  <div className="bg-muted p-4 rounded-xl border border-border">
                    <p className="text-sm text-text-secondary mb-4 leading-relaxed">
                      يُستخدم لفتح اليومية في بداية المناوبة.
                    </p>
                    
                    {!isChangingDaily ? (
                      <button
                        onClick={() => setIsChangingDaily(true)}
                        className="h-11 px-6 bg-surface border border-border text-text-primary font-bold rounded-lg hover:border-accent transition-colors flex items-center gap-2"
                      >
                        تغيير قفل اليومية
                      </button>
                    ) : (
                      <div className="space-y-4 max-w-sm bg-surface p-4 rounded-xl border border-border">
                        <h3 className="font-bold">إعداد رمز جديد</h3>
                        <div>
                          <label className="block text-sm mb-1 text-text-secondary">رمز المشرف الحالي (للتحقق)</label>
                          <input
                            type="password" inputMode="numeric" pattern="[0-9]*"
                            value={dailyLockCurrentAdminPin} onChange={e => setDailyLockCurrentAdminPin(e.target.value)}
                            className="w-full h-11 px-3 rounded-lg border border-border outline-none focus:border-accent text-center tracking-widest text-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm mb-1 text-text-secondary">الرمز اليومي الجديد</label>
                          <input
                            type="password" inputMode="numeric" pattern="[0-9]*"
                            value={newDailyLock} onChange={e => setNewDailyLock(e.target.value)}
                            className="w-full h-11 px-3 rounded-lg border border-border outline-none focus:border-accent text-center tracking-widest text-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm mb-1 text-text-secondary">تأكيد الرمز الجديد</label>
                          <input
                            type="password" inputMode="numeric" pattern="[0-9]*"
                            value={confirmDailyLock} onChange={e => setConfirmDailyLock(e.target.value)}
                            className="w-full h-11 px-3 rounded-lg border border-border outline-none focus:border-accent text-center tracking-widest text-lg"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={handleSaveDailyLock} className="flex-1 h-11 bg-accent text-white font-bold rounded-lg hover:bg-accent-hover transition-colors">
                            حفظ
                          </button>
                          <button onClick={() => setIsChangingDaily(false)} className="flex-1 h-11 bg-muted text-text-primary font-bold rounded-lg hover:bg-border transition-colors border border-border">
                            إلغاء
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin PIN Section */}
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                    <Shield className="w-6 h-6 text-danger" /> رمز المشرف (Admin PIN)
                  </h2>
                  <div className="bg-danger-bg/50 p-4 rounded-xl border border-danger/20">
                    <p className="text-sm text-text-secondary mb-4 leading-relaxed">
                      للعمليات الحساسة مثل المرتجعات، الإعدادات، واسترجاع المبالغ.
                    </p>
                    
                    {!isChangingAdmin ? (
                      <button
                        onClick={() => setIsChangingAdmin(true)}
                        className="h-11 px-6 bg-danger text-white font-bold rounded-lg hover:opacity-90 transition-colors flex items-center gap-2"
                      >
                        تغيير رمز المشرف
                      </button>
                    ) : (
                      <div className="space-y-4 max-w-sm bg-surface p-4 rounded-xl border border-danger/20 shadow-sm">
                        <h3 className="font-bold text-danger">تغيير رمز المشرف</h3>
                        <div>
                          <label className="block text-sm mb-1 text-text-secondary">رمز المشرف الحالي</label>
                          <input
                            type="password" inputMode="numeric" pattern="[0-9]*"
                            value={adminCurrentPin} onChange={e => setAdminCurrentPin(e.target.value)}
                            className="w-full h-11 px-3 rounded-lg border border-border outline-none focus:border-danger text-center tracking-widest text-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm mb-1 text-text-secondary">رمز المشرف الجديد</label>
                          <input
                            type="password" inputMode="numeric" pattern="[0-9]*"
                            value={newAdminPin} onChange={e => setNewAdminPin(e.target.value)}
                            className="w-full h-11 px-3 rounded-lg border border-border outline-none focus:border-danger text-center tracking-widest text-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm mb-1 text-text-secondary">تأكيد الرمز الجديد</label>
                          <input
                            type="password" inputMode="numeric" pattern="[0-9]*"
                            value={confirmAdminPin} onChange={e => setConfirmAdminPin(e.target.value)}
                            className="w-full h-11 px-3 rounded-lg border border-border outline-none focus:border-danger text-center tracking-widest text-lg"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={handleSaveAdminPin} className="flex-1 h-11 bg-danger text-white font-bold rounded-lg hover:opacity-90 transition-opacity">
                            تأكيد التغيير
                          </button>
                          <button onClick={() => setIsChangingAdmin(false)} className="flex-1 h-11 bg-muted text-text-primary font-bold rounded-lg hover:bg-border transition-colors border border-border">
                            إلغاء
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
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
