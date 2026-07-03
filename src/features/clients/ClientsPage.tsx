import { createResource, For, Show, createSignal, createEffect } from 'solid-js';
import type { Component } from 'solid-js';
import { getClients, createClient, deleteClient, updateClient, getProjects } from '../../lib/tauri';
import { formatPersianNumber } from '../../lib/locale';
import { selectedClientId, setSelectedClientId, clientRefreshTrigger, triggerClientRefresh, triggerProjectRefresh } from '../../store';
import { IconEdit, IconTrash, IconUsers } from '../../components/ui/Icons';

const ClientsPage: Component = () => {
  // Sync resource refetching with global trigger signal
  const [clients, { refetch }] = createResource<any[]>(async () => {
    clientRefreshTrigger(); // track trigger
    return await getClients();
  });
  
  const [projects] = createResource<any[]>(getProjects);

  const [isAdding, setIsAdding] = createSignal(false);
  const [isEditing, setIsEditing] = createSignal(false);
  const [searchQuery, setSearchQuery] = createSignal('');

  // Form Signals
  const [name, setName] = createSignal('');
  const [phone, setPhone] = createSignal('');
  const [email, setEmail] = createSignal('');
  const [address, setAddress] = createSignal('');
  const [color, setColor] = createSignal('#6366f1');
  const [notes, setNotes] = createSignal('');

  // Get selected client details
  const activeClient = () => {
    const id = selectedClientId();
    if (!id) return null;
    return (clients() || []).find((c: any) => c.id === id) || null;
  };

  // Keep edit fields in sync when selected client changes
  createEffect(() => {
    const client = activeClient();
    if (client) {
      setName(client.name || '');
      setPhone(client.phone || '');
      setEmail(client.email || '');
      setAddress(client.address || '');
      setColor(client.color || '#6366f1');
      setNotes(client.notes || '');
    } else {
      clearForm();
    }
  });

  const clearForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setColor('#6366f1');
    setNotes('');
  };

  const handleAddSubmit = async (e: Event) => {
    e.preventDefault();
    if (!name()) return;
    
    await createClient({
      name: name(),
      phone: phone() || null,
      email: email() || null,
      address: address() || null,
      color: color(),
      notes: notes() || ''
    });

    clearForm();
    setIsAdding(false);
    refetch();
    triggerClientRefresh();
  };

  const handleEditSubmit = async (e: Event) => {
    e.preventDefault();
    const client = activeClient();
    if (!client || !name()) return;

    await updateClient({
      id: client.id,
      name: name() ? name() : undefined,
      phone: phone() ? phone() : null,
      email: email() ? email() : null,
      address: address() ? address() : null,
      color: color() ? color() : undefined,
      notes: notes() ? notes() : ''
    });

    setIsEditing(false);
    refetch();
    triggerClientRefresh();
    triggerProjectRefresh(); // projects might need color refresh
  };

  const handleDeleteConfirm = async (id: string) => {
    await deleteClient(id);
    if (selectedClientId() === id) {
      setSelectedClientId(null);
    }
    refetch();
    triggerClientRefresh();
    triggerProjectRefresh();
  };

  // Associated items
  const clientProjects = () => {
    const client = activeClient();
    if (!client) return [];
    return (projects() || []).filter((p: any) => p.client_id === client.id);
  };

  const clientTotalBudget = () => {
    return clientProjects().reduce((sum, p) => sum + (p.budget || 0), 0);
  };

  // Filter list
  const filteredClients = () => {
    const query = searchQuery().toLowerCase().trim();
    const list = clients() || [];
    if (!query) return list;
    return list.filter((c: any) => 
      c.name.toLowerCase().includes(query) || 
      (c.phone && c.phone.includes(query)) ||
      (c.email && c.email.toLowerCase().includes(query))
    );
  };

  // Predefined color palette
  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316'];

  return (
    <div class="animate-fade-in mobile-col" style={{ display: 'flex', height: '100%', gap: 'var(--space-6)' }}>
      
      {/* RIGHT SIDE: Client List Panel */}
      <div class="mobile-panel-list" style={{
        width: '320px',
        display: 'flex',
        'flex-direction': 'column',
        gap: 'var(--space-4)',
        'border-left': '1px solid var(--color-border)',
        'padding-left': 'var(--space-6)',
        'flex-shrink': 0
      }}>
        {/* Search & Add Button */}
        <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center' }}>
            <h2 style={{ 'font-size': 'var(--text-h1-size)', 'font-weight': 700 }}>مشتریان</h2>
            <button 
              onClick={() => {
                setIsAdding(true);
                setSelectedClientId(null);
                clearForm();
              }}
              class="btn-primary"
              style={{ padding: '4px 10px', 'font-size': 'var(--text-sm-size)' }}
            >
              افزودن +
            </button>
          </div>
          
          <input 
            type="text" 
            placeholder="جستجو در مشتریان..." 
            value={searchQuery()}
            onInput={(e) => setSearchQuery(e.currentTarget.value)}
            class="premium-input"
            style={{ padding: '8px 12px', 'font-size': 'var(--text-sm-size)' }}
          />
        </div>

        {/* List Content */}
        <div style={{ flex: 1, 'overflow-y': 'auto', display: 'flex', 'flex-direction': 'column', gap: 'var(--space-2)' }}>
          <Show when={clients()} fallback={<p style={{ color: 'var(--color-text-muted)', 'font-size': 'var(--text-body-size)' }}>در حال بارگذاری...</p>}>
            <Show when={filteredClients().length > 0} fallback={<p style={{ color: 'var(--color-text-muted)', 'font-size': 'var(--text-body-size)', 'text-align': 'center', 'padding-top': 'var(--space-8)' }}>مشتری یافت نشد</p>}>
              <For each={filteredClients()}>
                {(client) => {
                  const isSelected = () => selectedClientId() === client.id;
                  return (
                    <button
                      onClick={() => {
                        setSelectedClientId(client.id);
                        setIsAdding(false);
                        setIsEditing(false);
                      }}
                      style={{
                        display: 'flex',
                        'align-items': 'center',
                        gap: 'var(--space-3)',
                        padding: 'var(--space-3)',
                        'border-radius': 'var(--radius-md)',
                        'background-color': isSelected() ? 'var(--color-primary-muted)' : 'transparent',
                        border: '1px solid transparent',
                        'border-color': isSelected() ? 'var(--color-border-glow)' : 'transparent',
                        width: '100%',
                        'text-align': 'right'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected()) e.currentTarget.style.backgroundColor = 'var(--color-surface)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected()) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div style={{
                        width: '32px', height: '32px', 'border-radius': 'var(--radius-round)',
                        'background-color': client.color || 'var(--color-primary)',
                        display: 'flex', 'align-items': 'center', 'justify-content': 'center',
                        color: 'white', 'font-weight': 'bold', 'font-size': 'var(--text-body-size)'
                      }}>
                        {client.name.charAt(0)}
                      </div>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ 'font-weight': 600, 'font-size': 'var(--text-body-size)', color: isSelected() ? 'var(--color-primary)' : 'var(--color-text)', 'text-overflow': 'ellipsis', 'white-space': 'nowrap' }}>
                          {client.name}
                        </div>
                        <div style={{ 'font-size': 'var(--text-xs-size)', color: 'var(--color-text-muted)', 'margin-top': '2px' }}>
                          {client.phone ? formatPersianNumber(client.phone) : 'بدون شماره'}
                        </div>
                      </div>
                    </button>
                  );
                }}
              </For>
            </Show>
          </Show>
        </div>
      </div>

      {/* LEFT SIDE: Detail / Form Panel */}
      <div style={{ flex: 1, 'overflow-y': 'auto', 'overflow-x': 'hidden', display: 'flex', 'flex-direction': 'column', 'padding-bottom': 'var(--space-6)' }}>
        
        {/* CASE 1: Adding a Client */}
        <Show when={isAdding()}>
          <div class="premium-card animate-slide-up" style={{ 'max-width': '600px', display: 'flex', 'flex-direction': 'column', gap: 'var(--space-5)' }}>
            <h3 style={{ 'font-size': 'var(--text-h1-size)', 'font-weight': 700 }}>افزودن مشتری جدید</h3>
            
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: 'var(--space-4)' }}>
                <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-1)' }}>
                  <label style={{ 'font-size': 'var(--text-sm-size)', color: 'var(--color-text-muted)' }}>نام مشتری *</label>
                  <input type="text" value={name()} onInput={e => setName(e.currentTarget.value)} required class="premium-input" placeholder="مثال: شرکت پارس" />
                </div>
                <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-1)' }}>
                  <label style={{ 'font-size': 'var(--text-sm-size)', color: 'var(--color-text-muted)' }}>شماره تماس</label>
                  <input type="text" value={phone()} onInput={e => setPhone(e.currentTarget.value)} class="premium-input" placeholder="مثال: 09123456789" />
                </div>
              </div>

              <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: 'var(--space-4)' }}>
                <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-1)' }}>
                  <label style={{ 'font-size': 'var(--text-sm-size)', color: 'var(--color-text-muted)' }}>ایمیل</label>
                  <input type="email" value={email()} onInput={e => setEmail(e.currentTarget.value)} class="premium-input" placeholder="example@mail.com" />
                </div>
                <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-1)' }}>
                  <label style={{ 'font-size': 'var(--text-sm-size)', color: 'var(--color-text-muted)' }}>رنگ نمایه</label>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', 'align-items': 'center', 'margin-top': '4px' }}>
                    <For each={colors}>
                      {(c) => (
                        <button 
                          type="button"
                          onClick={() => setColor(c)}
                          style={{
                            width: '24px', height: '24px', 'border-radius': 'var(--radius-round)',
                            'background-color': c, border: color() === c ? '2px solid white' : 'none',
                            'box-shadow': color() === c ? '0 0 4px rgba(0,0,0,0.5)' : 'none'
                          }}
                        />
                      )}
                    </For>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-1)' }}>
                <label style={{ 'font-size': 'var(--text-sm-size)', color: 'var(--color-text-muted)' }}>آدرس</label>
                <input type="text" value={address()} onInput={e => setAddress(e.currentTarget.value)} class="premium-input" placeholder="تهران، خیابان ولیعصر..." />
              </div>

              <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-1)' }}>
                <label style={{ 'font-size': 'var(--text-sm-size)', color: 'var(--color-text-muted)' }}>یادداشت‌ها</label>
                <textarea value={notes()} onInput={e => setNotes(e.currentTarget.value)} class="premium-input" style={{ height: '80px', resize: 'none' }} placeholder="توضیحات تکمیلی..." />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)', 'justify-content': 'end', 'margin-top': 'var(--space-2)' }}>
                <button type="button" onClick={() => setIsAdding(false)} class="btn-secondary">انصراف</button>
                <button type="submit" class="btn-primary">ذخیره مشتری</button>
              </div>
            </form>
          </div>
        </Show>

        {/* CASE 2: Editing a Client */}
        <Show when={isEditing() && activeClient()}>
          <div class="premium-card animate-slide-up" style={{ 'max-width': '600px', display: 'flex', 'flex-direction': 'column', gap: 'var(--space-5)' }}>
            <h3 style={{ 'font-size': 'var(--text-h1-size)', 'font-weight': 700 }}>ویرایش مشتری: {activeClient()?.name}</h3>
            
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: 'var(--space-4)' }}>
                <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-1)' }}>
                  <label style={{ 'font-size': 'var(--text-sm-size)', color: 'var(--color-text-muted)' }}>نام مشتری *</label>
                  <input type="text" value={name()} onInput={e => setName(e.currentTarget.value)} required class="premium-input" />
                </div>
                <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-1)' }}>
                  <label style={{ 'font-size': 'var(--text-sm-size)', color: 'var(--color-text-muted)' }}>شماره تماس</label>
                  <input type="text" value={phone()} onInput={e => setPhone(e.currentTarget.value)} class="premium-input" />
                </div>
              </div>

              <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: 'var(--space-4)' }}>
                <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-1)' }}>
                  <label style={{ 'font-size': 'var(--text-sm-size)', color: 'var(--color-text-muted)' }}>ایمیل</label>
                  <input type="email" value={email()} onInput={e => setEmail(e.currentTarget.value)} class="premium-input" />
                </div>
                <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-1)' }}>
                  <label style={{ 'font-size': 'var(--text-sm-size)', color: 'var(--color-text-muted)' }}>رنگ نمایه</label>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', 'align-items': 'center', 'margin-top': '4px' }}>
                    <For each={colors}>
                      {(c) => (
                        <button 
                          type="button"
                          onClick={() => setColor(c)}
                          style={{
                            width: '24px', height: '24px', 'border-radius': 'var(--radius-round)',
                            'background-color': c, border: color() === c ? '2px solid white' : 'none',
                            'box-shadow': color() === c ? '0 0 4px rgba(0,0,0,0.5)' : 'none'
                          }}
                        />
                      )}
                    </For>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-1)' }}>
                <label style={{ 'font-size': 'var(--text-sm-size)', color: 'var(--color-text-muted)' }}>آدرس</label>
                <input type="text" value={address()} onInput={e => setAddress(e.currentTarget.value)} class="premium-input" />
              </div>

              <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-1)' }}>
                <label style={{ 'font-size': 'var(--text-sm-size)', color: 'var(--color-text-muted)' }}>یادداشت‌ها</label>
                <textarea value={notes()} onInput={e => setNotes(e.currentTarget.value)} class="premium-input" style={{ height: '80px', resize: 'none' }} />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)', 'justify-content': 'end', 'margin-top': 'var(--space-2)' }}>
                <button type="button" onClick={() => setIsEditing(false)} class="btn-secondary">انصراف</button>
                <button type="submit" class="btn-primary">ذخیره تغییرات</button>
              </div>
            </form>
          </div>
        </Show>

        {/* CASE 3: View Selected Client Details */}
        <Show when={activeClient() && !isAdding() && !isEditing()}>
          {(() => {
            const client = activeClient()!;
            return (
              <div class="animate-slide-up" style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-6)', 'overflow-y': 'auto', 'padding-left': 'var(--space-2)' }}>
                {/* Header card with name and main actions */}
                <div class="premium-card" style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center' }}>
                  <div style={{ display: 'flex', 'align-items': 'center', gap: 'var(--space-4)' }}>
                    <div style={{
                      width: '48px', height: '48px', 'border-radius': 'var(--radius-round)',
                      'background-color': client.color || 'var(--color-primary)',
                      display: 'flex', 'align-items': 'center', 'justify-content': 'center',
                      color: 'white', 'font-weight': 'bold', 'font-size': 'var(--text-h1-size)'
                    }}>
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <h3 style={{ 'font-size': 'var(--text-h1-size)', 'font-weight': 700 }}>{client.name}</h3>
                      <p style={{ 'font-size': 'var(--text-sm-size)', color: 'var(--color-text-muted)' }}>مشتری تجاری</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button onClick={() => setIsEditing(true)} class="btn-secondary" style={{ padding: '6px 12px', 'font-size': 'var(--text-sm-size)' }}>
                      <IconEdit style={{ width: '16px', height: '16px' }} /> ویرایش
                    </button>
                    <button onClick={() => handleDeleteConfirm(client.id)} class="btn-secondary" style={{ padding: '6px 12px', 'font-size': 'var(--text-sm-size)', color: 'var(--color-danger)', 'border-color': 'rgba(239, 68, 68, 0.2)' }}>
                      <IconTrash style={{ width: '16px', height: '16px' }} /> حذف
                    </button>
                  </div>
                </div>

                {/* Details grid */}
                <div style={{ display: 'grid', 'grid-template-columns': '2fr 1fr', gap: 'var(--space-6)' }}>
                  
                  {/* Right sub-column: Client profile fields & Notes */}
                  <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-6)' }}>
                    <div class="premium-card" style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-4)' }}>
                      <h4 style={{ 'font-size': 'var(--text-h3-size)', 'font-weight': 600 }}>اطلاعات تماس</h4>
                      
                      <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-3)' }}>
                        <div style={{ display: 'flex', 'justify-content': 'space-between', 'font-size': 'var(--text-body-size)' }}>
                          <span style={{ color: 'var(--color-text-muted)' }}>شماره تماس:</span>
                          <span style={{ 'font-weight': 500 }}>{client.phone ? formatPersianNumber(client.phone) : 'ثبت نشده'}</span>
                        </div>
                        <div style={{ display: 'flex', 'justify-content': 'space-between', 'font-size': 'var(--text-body-size)' }}>
                          <span style={{ color: 'var(--color-text-muted)' }}>ایمیل:</span>
                          <span style={{ 'font-weight': 500 }}>{client.email || 'ثبت نشده'}</span>
                        </div>
                        <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-1)', 'font-size': 'var(--text-body-size)' }}>
                          <span style={{ color: 'var(--color-text-muted)' }}>آدرس:</span>
                          <span style={{ 'font-weight': 500, 'margin-top': '2px' }}>{client.address || 'ثبت نشده'}</span>
                        </div>
                      </div>
                    </div>

                    <div class="premium-card" style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-3)' }}>
                      <h4 style={{ 'font-size': 'var(--text-h3-size)', 'font-weight': 600 }}>یادداشت‌ها</h4>
                      <p style={{ 'font-size': 'var(--text-body-size)', 'line-height': 1.6, 'white-space': 'pre-line', color: client.notes ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
                        {client.notes || 'یادداشتی برای این مشتری ثبت نشده است.'}
                      </p>
                    </div>
                  </div>

                  {/* Left sub-column: Client stats & Project links */}
                  <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-6)' }}>
                    <div class="premium-card" style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-4)' }}>
                      <h4 style={{ 'font-size': 'var(--text-h3-size)', 'font-weight': 600 }}>خلاصه وضعیت</h4>
                      
                      <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-3)' }}>
                        <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center' }}>
                          <span style={{ 'font-size': 'var(--text-body-size)', color: 'var(--color-text-muted)' }}>پروژه‌ها:</span>
                          <span style={{ 'font-size': 'var(--text-h1-size)', 'font-weight': 700, color: 'var(--color-primary)' }}>
                            {formatPersianNumber(clientProjects().length)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center' }}>
                          <span style={{ 'font-size': 'var(--text-body-size)', color: 'var(--color-text-muted)' }}>بودجه کل:</span>
                          <span style={{ 'font-size': 'var(--text-h2-size)', 'font-weight': 700, color: 'var(--color-success)' }}>
                            {formatPersianNumber(clientTotalBudget().toLocaleString())} ریال
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Associated project names list */}
                    <div class="premium-card" style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-3)' }}>
                      <h4 style={{ 'font-size': 'var(--text-body-size)', 'font-weight': 600 }}>پروژه‌های مرتبط</h4>
                      <Show 
                        when={clientProjects().length > 0} 
                        fallback={<p style={{ color: 'var(--color-text-muted)', 'font-size': 'var(--text-sm-size)' }}>هیچ پروژه‌ای تعریف نشده است.</p>}
                      >
                        <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--space-2)' }}>
                          <For each={clientProjects()}>
                            {(p) => (
                              <div style={{
                                display: 'flex', 'align-items': 'center', gap: 'var(--space-2)',
                                padding: 'var(--space-2)', 'border-radius': 'var(--radius-sm)',
                                'background-color': 'rgba(255,255,255,0.01)', border: '1px solid var(--color-border)'
                              }}>
                                <div style={{ width: '6px', height: '6px', 'border-radius': '50%', 'background-color': p.color }} />
                                <span style={{ 'font-size': 'var(--text-sm-size)', 'font-weight': 500 }}>{p.title}</span>
                              </div>
                            )}
                          </For>
                        </div>
                      </Show>
                    </div>
                  </div>

                </div>
              </div>
            );
          })()}
        </Show>

        {/* CASE 4: Welcome state when no client selected */}
        <Show when={!activeClient() && !isAdding()}>
          <div style={{
            flex: 1, display: 'flex', 'flex-direction': 'column',
            'align-items': 'center', 'justify-content': 'center',
            color: 'var(--color-text-muted)', gap: 'var(--space-4)'
          }}>
            <IconUsers style={{ width: '64px', height: '64px', opacity: 0.5 }} />
            <p style={{ 'font-size': 'var(--text-h3-size)', 'font-weight': 500 }}>جهت مشاهده جزئیات، یک مشتری را از لیست انتخاب کنید یا مشتری جدید اضافه کنید.</p>
          </div>
        </Show>

      </div>

    </div>
  );
};

export default ClientsPage;
