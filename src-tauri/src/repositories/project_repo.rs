use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

use crate::error::AppError;
use crate::models::project::Project;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct CreateProjectInput {
    pub client_id: Option<String>,
    pub title: String,
    pub description: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub budget: Option<f64>,
    pub deadline: Option<String>,
    pub color: Option<String>,
    pub tags: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProjectInput {
    pub id: String,
    pub title: Option<String>,
    pub description: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub budget: Option<f64>,
    pub spent: Option<f64>,
    pub deadline: Option<String>,
    pub color: Option<String>,
    pub tags: Option<String>,
}

pub async fn get_all_projects(pool: &SqlitePool) -> Result<Vec<Project>, AppError> {
    let projects = sqlx::query_as!(
        Project,
        r#"
        SELECT id, client_id, title, description, status, priority, budget, spent, deadline, color, tags, created_at, updated_at, deleted_at
        FROM projects
        WHERE deleted_at IS NULL
        ORDER BY created_at DESC
        "#
    )
    .fetch_all(pool)
    .await
    .map_err(|e| AppError::Database(e.to_string()))?;

    Ok(projects)
}

pub async fn get_project_by_id(pool: &SqlitePool, id: &str) -> Result<Project, AppError> {
    let project = sqlx::query_as!(
        Project,
        r#"
        SELECT id, client_id, title, description, status, priority, budget, spent, deadline, color, tags, created_at, updated_at, deleted_at
        FROM projects
        WHERE id = ? AND deleted_at IS NULL
        "#,
        id
    )
    .fetch_optional(pool)
    .await
    .map_err(|e| AppError::Database(e.to_string()))?
    .ok_or_else(|| AppError::NotFound(format!("Project {} not found", id)))?;

    Ok(project)
}

pub async fn create_project(
    pool: &SqlitePool,
    input: CreateProjectInput,
) -> Result<Project, AppError> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let description = input.description.unwrap_or_default();
    let status = input.status.unwrap_or_else(|| "draft".to_string());
    let priority = input.priority.unwrap_or_else(|| "medium".to_string());
    let budget = input.budget.unwrap_or(0.0);
    let color = input.color.unwrap_or_else(|| "#6366f1".to_string());
    let tags = input.tags.unwrap_or_else(|| "[]".to_string());

    sqlx::query!(
        r#"
        INSERT INTO projects (id, client_id, title, description, status, priority, budget, spent, deadline, color, tags, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0.0, ?, ?, ?, ?, ?)
        "#,
        id,
        input.client_id,
        input.title,
        description,
        status,
        priority,
        budget,
        input.deadline,
        color,
        tags,
        now,
        now
    )
    .execute(pool)
    .await
    .map_err(|e| AppError::Database(e.to_string()))?;

    get_project_by_id(pool, &id).await
}

pub async fn update_project(
    pool: &SqlitePool,
    input: UpdateProjectInput,
) -> Result<Project, AppError> {
    let now = Utc::now().to_rfc3339();

    sqlx::query!(
        r#"
        UPDATE projects
        SET 
            title = COALESCE(?, title),
            description = COALESCE(?, description),
            status = COALESCE(?, status),
            priority = COALESCE(?, priority),
            budget = COALESCE(?, budget),
            spent = COALESCE(?, spent),
            deadline = COALESCE(?, deadline),
            color = COALESCE(?, color),
            tags = COALESCE(?, tags),
            updated_at = ?
        WHERE id = ? AND deleted_at IS NULL
        "#,
        input.title,
        input.description,
        input.status,
        input.priority,
        input.budget,
        input.spent,
        input.deadline,
        input.color,
        input.tags,
        now,
        input.id
    )
    .execute(pool)
    .await
    .map_err(|e| AppError::Database(e.to_string()))?;

    get_project_by_id(pool, &input.id).await
}

pub async fn delete_project(pool: &SqlitePool, id: &str) -> Result<(), AppError> {
    let now = Utc::now().to_rfc3339();
    sqlx::query!(
        r#"
        UPDATE projects
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
