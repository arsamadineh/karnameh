use tauri::State;
use sqlx::SqlitePool;

use crate::models::client::{Client, CreateClientInput, UpdateClientInput};
use crate::repositories::client_repo;
use crate::error::AppError;

#[tauri::command]
pub async fn get_clients(pool: State<'_, SqlitePool>) -> Result<Vec<Client>, AppError> {
    client_repo::get_all_clients(&pool).await
}

#[tauri::command]
pub async fn get_client(pool: State<'_, SqlitePool>, id: String) -> Result<Client, AppError> {
    client_repo::get_client_by_id(&pool, &id).await
}

#[tauri::command]
pub async fn create_client(pool: State<'_, SqlitePool>, input: CreateClientInput) -> Result<Client, AppError> {
    client_repo::create_client(&pool, input).await
}

#[tauri::command]
pub async fn update_client(pool: State<'_, SqlitePool>, input: UpdateClientInput) -> Result<Client, AppError> {
    client_repo::update_client(&pool, input).await
}

#[tauri::command]
pub async fn delete_client(pool: State<'_, SqlitePool>, id: String) -> Result<(), AppError> {
    client_repo::delete_client(&pool, &id).await
}
