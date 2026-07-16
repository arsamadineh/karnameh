import { createResource, createSignal } from 'solid-js';
import type { Component } from 'solid-js';
import {
  getClients, getProjects, getTasks, getChecklists,
  createClient, createProject, createTask, createChecklist
} from '../../lib/tauri';
import { checkForUpdate, downloadAndInstall } from '../../lib/updater';
import { formatPersianNumber } from '../../lib/locale';
import { currentTheme, setTheme, getCurrentAppVersion } from '../../store';
import { IconPalette, IconMoon, IconSun, IconDatabase, IconUpload, IconDownload, IconDashboard } from '../../components/ui/Icons';

const SettingsPage: Component = () => {
  const [clients] = createResource<any[]>(getClients);
  const [projects] = createResource<any[]>(getProjects);
  const [tasks] = createResource<any[]>(getTasks);
  const [checklists] = createResource<any[]>(getChecklists);

  const [isCheckingUpdate, setIsCheckingUpdate] = createSignal(false);
  const [updateMessage, setUpdateMessage] = createSignal('');

  const handleManualUpdateCheck = async () => {
    setIsCheckingUpdate(true);
    setUpdateMessage('در حال بررسی بروزرسانی...');
    try {
      const update = await checkForUpdate();
      if (update) {
        setUpdateMessage(`نسخه ${update.version} در دسترس است. دانلود و نصب آغاز شد...`);
        await downloadAndInstall(update, (pct) => {
          setUpdateMessage(`در حال دانلود: ${pct}%`);
        });
        setUpdateMessage('بروزرسانی با موفقیت نصب شد. برنامه در حال شروع مجدد است...');
        // relaunch() ends the process; the message below is a fallback.
      } else {
        setUpdateMessage('شما از آخرین نسخه استفاده می‌کنید.');
      }
    } catch (err: any) {
      const msg = err?.toString?.() || '';
      if (msg.includes('JSON') || msg.includes('parse') || msg.includes('404') || msg.includes('Not Found')) {
        setUpdateMessage('نسخه جدیدی منتشر نشده است.');
      } else {
        setUpdateMessage('خطا در بررسی بروزرسانی. اتصال اینترنت خود را بررسی کنید.');
      }
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  // Backup export data
  const handleExportData = () => {
    const rawData = {
      clients: clients() || [],
      projects: projects() || [],
      tasks: tasks() || [],
      checklists: checklists() || []
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(rawData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `karnameh_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Backup import data
  const handleImportData = async (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      if (!backup.clients || !backup.projects || !backup.tasks || !backup.checklists) {
        alert('فایل پشتیبان نامعتبر است.');
        return;
      }

      if (!confirm('آیا از بازگردانی اطلاعات اطمینان دارید؟ اطلاعات پشتیبان به سیستم اضافه خواهند شد.')) return;

      const clientMap: Record<string, string> = {};
      const projectMap: Record<string, string> = {};

      // 1. Import Clients
      for (const c of backup.clients) {
        const newClient = await createClient({
          name: c.name,
          phone: c.phone || null,
          email: c.email || null,
          address: c.address || null,
          color: c.color,
          notes: c.notes || ''
        });
        clientMap[c.id] = newClient.id;
      }

      // 2. Import Projects
      for (const p of backup.projects) {
        const mappedClientId = p.client_id ? clientMap[p.client_id] : null;
        const newProj = await createProject({
          client_id: mappedClientId,
          title: p.title,
          description: p.description || null,
          status: p.status,
          priority: p.priority,
          budget: p.budget,
          deadline: p.deadline || null,
          color: p.color
        });
        projectMap[p.id] = newProj.id;
      }

      // 3. Import Tasks
      for (const t of backup.tasks) {
        const mappedProjectId = t.project_id ? projectMap[t.project_id] : null;
        await createTask({
          project_id: mappedProjectId,
          title: t.title,
          description: t.description || null,
          status: t.status,
          priority: t.priority,
          due_date: t.due_date || null
        });
      }

      // 4. Import Checklists
      for (const cl of backup.checklists) {
        try {
          await createChecklist({
            title: cl.title,
            date: cl.date,
            notes: cl.notes || ''
          });
        } catch (err) {
          // ignore unique index date conflicts
        }
      }
      
      alert('اطلاعات با موفقیت بازگردانی شدند!');
      window.location.reload();
    } catch (err) {
      alert('خطا در بازگردانی اطلاعات: ' + err);
    }
  };

  return (
    <div class="animate-fade-in" style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-6)', 'max-width': '600px' }}>
      
      {/* Theme Card */}
      <div class="premium-card" style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-3)' }}>
        <h3 style={{ 'font-size': 'var(--text-h2-size)', 'font-weight': 700, display: 'flex', 'align-items': 'center', gap: 'var(--space-2)' }}>
          <IconPalette style={{ width: '20px', height: '20px', color: 'var(--color-primary)' }} />
          ظاهر و تم برنامه
        </h3>
        <p style={{ 'font-size': 'var(--text-sm-size)', color: 'var(--color-text-muted)' }}>پوسته نرم‌افزار را متناسب با سلیقه خود تغییر دهید.</p>
        
        <div style={{ display: 'flex', gap: 'var(--space-3)', 'margin-top': 'var(--space-2)' }}>
          <button 
            onClick={() => setTheme('dark')}
            style={{
              flex: 1, padding: 'var(--space-3)', 'border-radius': 'var(--radius-md)',
              border: `1.5px solid ${currentTheme() === 'dark' ? 'var(--color-primary)' : 'var(--color-border)'}`,
              'background-color': currentTheme() === 'dark' ? 'var(--color-primary-muted)' : 'transparent',
              color: currentTheme() === 'dark' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              'font-weight': 600
            }}
          >
            <div style={{ display: 'flex', 'align-items': 'center', 'justify-content': 'center', gap: 'var(--space-2)' }}>
              <IconMoon style={{ width: '18px', height: '18px' }} />
              حالت تاریک
            </div>
          </button>
          
          <button 
            onClick={() => setTheme('light')}
            style={{
              flex: 1, padding: 'var(--space-3)', 'border-radius': 'var(--radius-md)',
              border: `1.5px solid ${currentTheme() === 'light' ? 'var(--color-primary)' : 'var(--color-border)'}`,
              'background-color': currentTheme() === 'light' ? 'var(--color-primary-muted)' : 'transparent',
              color: currentTheme() === 'light' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              'font-weight': 600
            }}
          >
            <div style={{ display: 'flex', 'align-items': 'center', 'justify-content': 'center', gap: 'var(--space-2)' }}>
              <IconSun style={{ width: '18px', height: '18px' }} />
              حالت روشن
            </div>
          </button>

          <button 
            onClick={() => setTheme('system')}
            style={{
              flex: 1, padding: 'var(--space-3)', 'border-radius': 'var(--radius-md)',
              border: `1.5px solid ${currentTheme() === 'system' ? 'var(--color-primary)' : 'var(--color-border)'}`,
              'background-color': currentTheme() === 'system' ? 'var(--color-primary-muted)' : 'transparent',
              color: currentTheme() === 'system' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              'font-weight': 600
            }}
          >
            <div style={{ display: 'flex', 'align-items': 'center', 'justify-content': 'center', gap: 'var(--space-2)' }}>
              <IconPalette style={{ width: '18px', height: '18px' }} />
              پوسته سیستم
            </div>
          </button>
        </div>
      </div>

      {/* DB Card */}
      <div class="premium-card" style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-3)' }}>
        <h3 style={{ 'font-size': 'var(--text-h2-size)', 'font-weight': 700, display: 'flex', 'align-items': 'center', gap: 'var(--space-2)' }}>
          <IconDatabase style={{ width: '20px', height: '20px', color: 'var(--color-primary)' }} />
          پشتیبان‌گیری و پایگاه داده
        </h3>
        <p style={{ 'font-size': 'var(--text-sm-size)', color: 'var(--color-text-muted)' }}>
          اطلاعات برنامه در یک فایل محلی SQLite ذخیره می‌شوند. می‌توانید کل اطلاعات را صادر کنید.
        </p>

        <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-2)', 'font-size': 'var(--text-body-size)', 'background-color': 'rgba(255,255,255,0.01)', border: '1px solid var(--color-border)', padding: 'var(--space-3)', 'border-radius': 'var(--radius-md)', 'margin': 'var(--space-2) 0' }}>
          <div style={{ display: 'flex', 'justify-content': 'space-between' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>نوع موتور ذخیره‌سازی:</span>
            <span style={{ 'font-weight': 600 }}>SQLite 3 (محلی)</span>
          </div>
          <div style={{ display: 'flex', 'justify-content': 'space-between', 'margin-top': '4px' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>محل ذخیره فایل:</span>
            <span style={{ 'font-weight': 600, 'font-size': 'var(--text-xs-size)', 'direction': 'ltr' }}>~/.local/share/karnameh/karnameh.db</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)', 'align-items': 'center' }}>
          <button onClick={handleExportData} class="btn-primary" style={{ flex: 1, 'justify-content': 'center' }}>
            <IconUpload style={{ width: '18px', height: '18px' }} />
            خروجی پشتیبان (JSON)
          </button>
          
          <label class="btn-secondary" style={{ flex: 1, 'justify-content': 'center', cursor: 'pointer', display: 'inline-flex', 'align-items': 'center', gap: 'var(--space-2)' }}>
            <IconDownload style={{ width: '18px', height: '18px' }} />
            ورود فایل پشتیبان
            <input type="file" accept=".json" onChange={handleImportData} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      {/* Stats Summary Card */}
      <div class="premium-card" style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-3)' }}>
        <h3 style={{ 'font-size': 'var(--text-h2-size)', 'font-weight': 700, display: 'flex', 'align-items': 'center', gap: 'var(--space-2)' }}>
          <IconDashboard style={{ width: '20px', height: '20px', color: 'var(--color-primary)' }} />
          آمار کلی ذخیره‌شده
        </h3>
        
        <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: 'var(--space-3)', 'margin-top': 'var(--space-1)' }}>
          <div style={{ padding: 'var(--space-3)', 'background-color': 'rgba(255,255,255,0.01)', border: '1px solid var(--color-border)', 'border-radius': 'var(--radius-md)' }}>
            <span style={{ 'font-size': 'var(--text-xs-size)', color: 'var(--color-text-muted)' }}>تعداد مشتریان:</span>
            <h4 class="stat-tile" style={{ color: 'var(--color-primary)' }}>
              {formatPersianNumber((clients() || []).length)}
            </h4>
          </div>
          <div style={{ padding: 'var(--space-3)', 'background-color': 'rgba(255,255,255,0.01)', border: '1px solid var(--color-border)', 'border-radius': 'var(--radius-md)' }}>
            <span style={{ 'font-size': 'var(--text-xs-size)', color: 'var(--color-text-muted)' }}>تعداد پروژه‌ها:</span>
            <h4 class="stat-tile" style={{ color: 'var(--color-success)' }}>
              {formatPersianNumber((projects() || []).length)}
            </h4>
          </div>
          <div style={{ padding: 'var(--space-3)', 'background-color': 'rgba(255,255,255,0.01)', border: '1px solid var(--color-border)', 'border-radius': 'var(--radius-md)' }}>
            <span style={{ 'font-size': 'var(--text-xs-size)', color: 'var(--color-text-muted)' }}>تعداد وظایف:</span>
            <h4 class="stat-tile" style={{ color: 'var(--color-warning)' }}>
              {formatPersianNumber((tasks() || []).length)}
            </h4>
          </div>
          <div style={{ padding: 'var(--space-3)', 'background-color': 'rgba(255,255,255,0.01)', border: '1px solid var(--color-border)', 'border-radius': 'var(--radius-md)' }}>
            <span style={{ 'font-size': 'var(--text-xs-size)', color: 'var(--color-text-muted)' }}>چک‌لیست‌های ثبت‌شده:</span>
            <h4 class="stat-tile" style={{ color: 'var(--color-secondary)' }}>
              {formatPersianNumber((checklists() || []).length)}
            </h4>
          </div>
        </div>
      </div>

      {/* About & Updates Card */}
      <div class="premium-card" style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-2)', 'font-size': 'var(--text-sm-size)', color: 'var(--color-text-muted)' }}>
        <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center' }}>
          <div>
            <h4 style={{ 'font-size': 'var(--text-h3-size)', 'font-weight': 700, color: 'var(--color-text)', margin: 0 }}>کارنامه - نسخه {getCurrentAppVersion() || '۱.۲.۳'}</h4>
            <p style={{ margin: '4px 0 0 0' }}>فونت مورد استفاده: وزیرمتن (Vazirmatn) اثر صابر راستی‌کردار</p>
            <p style={{ margin: '4px 0 0 0' }}>© تمامی حقوق محفوظ است.</p>
          </div>
          <div style={{ display: 'flex', 'flex-direction': 'column', 'align-items': 'flex-end', gap: 'var(--space-2)' }}>
            <button class="btn-primary" onClick={handleManualUpdateCheck} disabled={isCheckingUpdate()} style={{ 'font-size': 'var(--text-xs-size)', padding: '6px 12px' }}>
              {isCheckingUpdate() ? 'در حال بررسی...' : 'بررسی بروزرسانی'}
            </button>
            {updateMessage() && <span style={{ 'font-size': 'var(--text-xs-size)', color: 'var(--color-primary)' }}>{updateMessage()}</span>}
          </div>
        </div>
      </div>

    </div>
  );
};

export default SettingsPage;
