import { dbClient } from '@/db/client';

const LAST_BACKUP_KEY = 'pos_last_backup_time';

export const getBackupInfo = () => {
  const lastBackupStr = localStorage.getItem(LAST_BACKUP_KEY);
  if (!lastBackupStr) return { lastBackupTime: null, isOverdue: true };
  
  const lastBackupTime = parseInt(lastBackupStr, 10);
  const now = Date.now();
  const hoursSinceLastBackup = (now - lastBackupTime) / (1000 * 60 * 60);
  
  return {
    lastBackupTime,
    isOverdue: hoursSinceLastBackup >= 24
  };
};

export const performBackup = async () => {
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
    
    // Validate backup is done
    localStorage.setItem(LAST_BACKUP_KEY, Date.now().toString());
    
    return true;
  } catch (error) {
    console.error('Backup failed:', error);
    throw error;
  }
};
