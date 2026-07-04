use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

use crate::error::AppError;
use crate::models::client::{Client, CreateClientInput, UpdateClientInput};

pub async fn get_all_clients(pool: &SqlitePool) -> Result<Vec<Client>, AppError> {
    let clients = sqlx::query_as!(
        Client,
        r#"
        SELECT id, name, phone, email, address, color, tags, notes, created_at, updated_at, deleted_at
        FROM clients
        WHERE deleted_at IS NULL
        ORDER BY created_at DESC
        "#
    )
    .fetch_all(pool)
    .await
    .map_err(|e| AppError::Database(e.to_string()))?;

    Ok(clients)
}

pub async fn get_client_by_id(pool: &SqlitePool, id: &str) -> Result<Client, AppError> {
    let client = sqlx::query_as!(
        Client,
        r#"
        SELECT id, name, phone, email, address, color, tags, notes, created_at, updated_at, deleted_at
        FROM clients
        WHERE id = ? AND deleted_at IS NULL
        "#,
        id
    )
    .fetch_optional(pool)
    .await
    .map_err(|e| AppError::Database(e.to_string()))?
    .ok_or_else(|| AppError::NotFound(format!("Client {} not found", id)))?;

    Ok(client)
}

pub async fn create_client(
    pool: &SqlitePool,
    input: CreateClientInput,
) -> Result<Client, AppError> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let color = input.color.unwrap_or_else(|| "#6366f1".to_string());
    let tags = input.tags.unwrap_or_else(|| "[]".to_string());
    let notes = input.notes.unwrap_or_default();

    sqlx::query!(
        r#"
        INSERT INTO clients (id, name, phone, email, address, color, tags, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#,
        id,
        input.name,
        input.phone,
        input.email,
        input.address,
        color,
        tags,
        notes,
        now,
        now
    )
    .execute(pool)
    .await
    .map_err(|e| AppError::Database(e.to_string()))?;

    get_client_by_id(pool, &id).await
}

pub async fn update_client(
    pool: &SqlitePool,
    input: UpdateClientInput,
) -> Result<Client, AppError> {
    let now = Utc::now().to_rfc3339();

    // Fetch existing client first to merge fields if needed,
    // or we can use COALESCE in SQL but since we might update individual fields,
    // we use a dynamic approach or just update provided fields using SQL COALESCE.

    sqlx::query!(
        r#"
        UPDATE clients
        SET 
            name = COALESCE(?, name),
            phone = COALESCE(?, phone),
            email = COALESCE(?, email),
            address = COALESCE(?, address),
            color = COALESCE(?, color),
            tags = COALESCE(?, tags),
            notes = COALESCE(?, notes),
            updated_at = ?
        WHERE id = ? AND deleted_at IS NULL
        "#,
        input.name,
        input.phone,
        input.email,
        input.address,
        input.color,
        input.tags,
        input.notes,
        now,
        input.id
    )
    .execute(pool)
    .await
    .map_err(|e| AppError::Database(e.to_string()))?;

    get_client_by_id(pool, &input.id).await
}

pub async fn delete_client(pool: &SqlitePool, id: &str) -> Result<(), AppError> {
    let now = Utc::now().to_rfc3339();

    // Soft delete
    sqlx::query!(
        r#"
        UPDATE clients
        SET deleted_at = ?, updated_at = ?
        WHERE id = ?
        "#,
        now,
        now,
        id
    )
    .execute(pool)
    .await
    .map_err(|e| AppError::Database(e.to_string()))?;

    Ok(())
}
