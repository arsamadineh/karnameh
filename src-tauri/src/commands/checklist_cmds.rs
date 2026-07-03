use tauri::State;
use sqlx::SqlitePool;

use crate::models::checklist::{Checklist, ChecklistItem};
use crate::repositories::checklist_repo::{self, CreateChecklistInput, CreateChecklistItemInput};
use crate::error::AppError;

#[tauri::command]
pub async fn get_checklists(pool: State<'_, SqlitePool>) -> Result<Vec<Checklist>, AppError> {
    checklist_repo::get_checklists(&pool).await
}

#[tauri::command]
pub async fn get_checklist_by_date(pool: State<'_, SqlitePool>, date: String) -> Result<Option<Checklist>, AppError> {
    checklist_repo::get_checklist_by_date(&pool, &date).await
}

#[tauri::command]
pub async fn get_checklist_items(pool: State<'_, SqlitePool>, checklist_id: String) -> Result<Vec<ChecklistItem>, AppError> {
    checklist_repo::get_checklist_items(&pool, &checklist_id).await
}

#[tauri::command]
pub async fn create_checklist(pool: State<'_, SqlitePool>, input: CreateChecklistInput) -> Result<Checklist, AppError> {
    checklist_repo::create_checklist(&pool, input).await
}

#[tauri::command]
pub async fn add_checklist_item(pool: State<'_, SqlitePool>, input: CreateChecklistItemInput) -> Result<ChecklistItem, AppError> {
    checklist_repo::add_checklist_item(&pool, input).await
}

#[tauri::command]
pub async fn toggle_checklist_item(pool: State<'_, SqlitePool>, id: String, done: bool) -> Result<(), AppError> {
    checklist_repo::toggle_checklist_item(&pool, &id, done).await
}
