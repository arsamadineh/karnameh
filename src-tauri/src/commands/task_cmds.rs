use sqlx::SqlitePool;
use tauri::State;

use crate::error::AppError;
use crate::models::task::Task;
use crate::repositories::task_repo::{self, CreateTaskInput, UpdateTaskInput};

#[tauri::command]
pub async fn get_tasks(pool: State<'_, SqlitePool>) -> Result<Vec<Task>, AppError> {
    task_repo::get_all_tasks(&pool).await
}

#[tauri::command]
pub async fn get_task(pool: State<'_, SqlitePool>, id: String) -> Result<Task, AppError> {
    task_repo::get_task_by_id(&pool, &id).await
}

#[tauri::command]
pub async fn create_task(
    pool: State<'_, SqlitePool>,
    input: CreateTaskInput,
) -> Result<Task, AppError> {
    task_repo::create_task(&pool, input).await
}

#[tauri::command]
pub async fn update_task(
    pool: State<'_, SqlitePool>,
    input: UpdateTaskInput,
) -> Result<Task, AppError> {
    task_repo::update_task(&pool, input).await
}

#[tauri::command]
pub async fn delete_task(pool: State<'_, SqlitePool>, id: String) -> Result<(), AppError> {
    task_repo::delete_task(&pool, &id).await
}
