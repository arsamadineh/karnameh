use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Task {
    pub id: String,
    pub project_id: Option<String>,
    pub parent_id: Option<String>,
    pub title: String,
    pub description: String,
    pub status: String, // 'todo', 'in_progress', 'done'
    pub priority: String,
    pub due_date: Option<String>,
    pub sort_order: i64,
    pub tags: String,
    pub created_at: String,
    pub updated_at: String,
    pub deleted_at: Option<String>,
}
