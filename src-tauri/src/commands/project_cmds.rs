use sqlx::SqlitePool;
use tauri::State;

use crate::error::AppError;
use crate::models::project::Project;
use crate::repositories::project_repo::{self, CreateProjectInput, UpdateProjectInput};

#[tauri::command]
pub async fn get_projects(pool: State<'_, SqlitePool>) -> Result<Vec<Project>, AppError> {
    project_repo::get_all_projects(&pool).await
}

#[tauri::command]
pub async fn get_project(pool: State<'_, SqlitePool>, id: String) -> Result<Project, AppError> {
    project_repo::get_project_by_id(&pool, &id).await
}

#[tauri::command]
pub async fn create_project(
    pool: State<'_, SqlitePool>,
    input: CreateProjectInput,
) -> Result<Project, AppError> {
    project_repo::create_project(&pool, input).await
}

#[tauri::command]
pub async fn update_project(
    pool: State<'_, SqlitePool>,
    input: UpdateProjectInput,
) -> Result<Project, AppError> {
    project_repo::update_project(&pool, input).await
}

#[tauri::command]
pub async fn delete_project(pool: State<'_, SqlitePool>, id: String) -> Result<(), AppError> {
    project_repo::delete_project(&pool, &id).await
}
