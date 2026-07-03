import { invoke } from '@tauri-apps/api/core';

export async function getClients(): Promise<any[]> { return await invoke('get_clients'); }
export async function createClient(input: any): Promise<any> { return await invoke('create_client', { input }); }
export async function getClient(id: string): Promise<any> { return await invoke('get_client', { id }); }
export async function updateClient(input: any): Promise<any> { return await invoke('update_client', { input }); }
export async function deleteClient(id: string): Promise<void> { return await invoke('delete_client', { id }); }

// Projects
export async function getProjects(): Promise<any[]> { return await invoke('get_projects'); }
export async function getProject(id: string): Promise<any> { return await invoke('get_project', { id }); }
export async function createProject(input: any): Promise<any> { return await invoke('create_project', { input }); }
export async function updateProject(input: any): Promise<any> { return await invoke('update_project', { input }); }
export async function deleteProject(id: string): Promise<void> { return await invoke('delete_project', { id }); }

// Tasks
export async function getTasks(): Promise<any[]> { return await invoke('get_tasks'); }
export async function getTask(id: string): Promise<any> { return await invoke('get_task', { id }); }
export async function createTask(input: any): Promise<any> { return await invoke('create_task', { input }); }
export async function updateTask(input: any): Promise<any> { return await invoke('update_task', { input }); }
export async function deleteTask(id: string): Promise<void> { return await invoke('delete_task', { id }); }

// Checklists
export async function getChecklists(): Promise<any[]> { return await invoke('get_checklists'); }
export async function getChecklistByDate(date: string): Promise<any> { return await invoke('get_checklist_by_date', { date }); }
export async function getChecklistItems(checklistId: string): Promise<any[]> { return await invoke('get_checklist_items', { checklistId }); }
export async function createChecklist(input: any): Promise<any> { return await invoke('create_checklist', { input }); }
export async function addChecklistItem(input: any): Promise<any> { return await invoke('add_checklist_item', { input }); }
export async function toggleChecklistItem(id: string, done: boolean): Promise<void> { return await invoke('toggle_checklist_item', { id, done }); }
