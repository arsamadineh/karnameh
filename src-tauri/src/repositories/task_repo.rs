use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

use crate::error::AppError;
use crate::models::task::Task;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct CreateTaskInput {
    pub project_id: Option<String>,
    pub parent_id: Option<String>,
    pub title: String,
    pub description: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub due_date: Option<String>,
    pub tags: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTaskInput {
    pub id: String,
    pub title: Option<String>,
    pub description: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub due_date: Option<String>,
    pub sort_order: Option<i64>,
    pub tags: Option<String>,
}

pub async fn get_all_tasks(pool: &SqlitePool) -> Result<Vec<Task>, AppError> {
    let tasks = sqlx::query_as!(
        Task,
        r#"
        SELECT id, project_id, parent_id, title, description, status, priority, due_date, sort_order, tags, created_at, updated_at, deleted_at
        FROM tasks
        WHERE deleted_at IS NULL
        ORDER BY sort_order ASC, created_at DESC
        "#
    )
    .fetch_all(pool)
    .await
    .map_err(|e| AppError::Database(e.to_string()))?;

    Ok(tasks)
}

pub async fn get_task_by_id(pool: &SqlitePool, id: &str) -> Result<Task, AppError> {
    let task = sqlx::query_as!(
        Task,
        r#"
        SELECT id, project_id, parent_id, title, description, status, priority, due_date, sort_order, tags, created_at, updated_at, deleted_at
        FROM tasks
        WHERE id = ? AND deleted_at IS NULL
        "#,
        id
    )
    .fetch_optional(pool)
    .await
    .map_err(|e| AppError::Database(e.to_string()))?
    .ok_or_else(|| AppError::NotFound(format!("Task {} not found", id)))?;

    Ok(task)
}

pub async fn create_task(pool: &SqlitePool, input: CreateTaskInput) -> Result<Task, AppError> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let description = input.description.unwrap_or_default();
    let status = input.status.unwrap_or_else(|| "todo".to_string());
    let priority = input.priority.unwrap_or_else(|| "medium".to_string());
    let tags = input.tags.unwrap_or_else(|| "[]".to_string());

    sqlx::query!(
        r#"
        INSERT INTO tasks (id, project_id, parent_id, title, description, status, priority, due_date, sort_order, tags, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
        "#,
        id,
        input.project_id,
        input.parent_id,
        input.title,
        description,
        status,
        priority,
        input.due_date,
        tags,
        now,
        now
    )
    .execute(pool)
    .await
    .map_err(|e| AppError::Database(e.to_string()))?;

    get_task_by_id(pool, &id).await
}

pub async fn update_task(pool: &SqlitePool, input: UpdateTaskInput) -> Result<Task, AppError> {
    let now = Utc::now().to_rfc3339();

    sqlx::query!(
        r#"
        UPDATE tasks
        SET 
            title = COALESCE(?, title),
            description = COALESCE(?, description),
            status = COALESCE(?, status),
            priority = COALESCE(?, priority),
            due_date = COALESCE(?, due_date),
            sort_order = COALESCE(?, sort_order),
            tags = COALESCE(?, tags),
            updated_at = ?
        WHERE id = ? AND deleted_at IS NULL
        "#,
        input.title,
        input.description,
        input.status,
        input.priority,
        input.due_date,
        input.sort_order,
        input.tags,
        now,
        input.id
    )
    .execute(pool)
    .await
    .map_err(|e| AppError::Database(e.to_string()))?;

    get_task_by_id(pool, &input.id).await
}

pub async fn delete_task(pool: &SqlitePool, id: &str) -> Result<(), AppError> {
    let now = Utc::now().to_rfc3339();
    sqlx::query!(
        r#"
        UPDATE tasks
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
