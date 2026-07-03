use sqlx::SqlitePool;
use uuid::Uuid;
use chrono::Utc;

use crate::models::checklist::{Checklist, ChecklistItem};
use crate::error::AppError;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct CreateChecklistInput {
    pub title: String,
    pub date: String,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateChecklistItemInput {
    pub checklist_id: String,
    pub text: String,
}

pub async fn get_checklists(pool: &SqlitePool) -> Result<Vec<Checklist>, AppError> {
    let checklists = sqlx::query_as!(
        Checklist,
        r#"
        SELECT id, title, date, notes, completed_at, created_at, updated_at
        FROM checklists
        ORDER BY date DESC
        "#
    )
    .fetch_all(pool)
    .await
    .map_err(|e| AppError::Database(e.to_string()))?;

    Ok(checklists)
}

pub async fn get_checklist_by_date(pool: &SqlitePool, date: &str) -> Result<Option<Checklist>, AppError> {
    let checklist = sqlx::query_as!(
        Checklist,
        r#"
        SELECT id, title, date, notes, completed_at, created_at, updated_at
        FROM checklists
        WHERE date = ?
        "#,
        date
    )
    .fetch_optional(pool)
    .await
    .map_err(|e| AppError::Database(e.to_string()))?;

    Ok(checklist)
}

pub async fn get_checklist_items(pool: &SqlitePool, checklist_id: &str) -> Result<Vec<ChecklistItem>, AppError> {
    let items = sqlx::query_as!(
        ChecklistItem,
        r#"
        SELECT id, checklist_id, text, done as "done: bool", sort_order
        FROM checklist_items
        WHERE checklist_id = ?
        ORDER BY sort_order ASC
        "#,
        checklist_id
    )
    .fetch_all(pool)
    .await
    .map_err(|e| AppError::Database(e.to_string()))?;

    Ok(items)
}

pub async fn create_checklist(pool: &SqlitePool, input: CreateChecklistInput) -> Result<Checklist, AppError> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let notes = input.notes.unwrap_or_default();

    sqlx::query!(
        r#"
        INSERT INTO checklists (id, title, date, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        "#,
        id,
        input.title,
        input.date,
        notes,
        now,
        now
    )
    .execute(pool)
    .await
    .map_err(|e| AppError::Database(e.to_string()))?;

    let checklist = sqlx::query_as!(
        Checklist,
        "SELECT id, title, date, notes, completed_at, created_at, updated_at FROM checklists WHERE id = ?",
        id
    ).fetch_one(pool).await.unwrap();

    Ok(checklist)
}

pub async fn add_checklist_item(pool: &SqlitePool, input: CreateChecklistItemInput) -> Result<ChecklistItem, AppError> {
    let id = Uuid::new_v4().to_string();
    
    sqlx::query!(
        r#"
        INSERT INTO checklist_items (id, checklist_id, text, done, sort_order)
        VALUES (?, ?, ?, 0, 0)
        "#,
        id,
        input.checklist_id,
        input.text
    )
    .execute(pool)
    .await
    .map_err(|e| AppError::Database(e.to_string()))?;

    let item = sqlx::query_as!(
        ChecklistItem,
        r#"SELECT id, checklist_id, text, done as "done: bool", sort_order FROM checklist_items WHERE id = ?"#,
        id
    ).fetch_one(pool).await.unwrap();

    Ok(item)
}

pub async fn toggle_checklist_item(pool: &SqlitePool, id: &str, done: bool) -> Result<(), AppError> {
    let done_int = if done { 1 } else { 0 };
    sqlx::query!(
        r#"
        UPDATE checklist_items
        SET done = ?
        WHERE id = ?
        "#,
        done_int,
        id
    )
    .execute(pool)
    .await
    .map_err(|e| AppError::Database(e.to_string()))?;

    Ok(())
}
