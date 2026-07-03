use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Project {
    pub id: String,
    pub client_id: Option<String>,
    pub title: String,
    pub description: String,
    pub status: String,
    pub priority: String,
    pub budget: f64,
    pub spent: f64,
    pub deadline: Option<String>,
    pub color: String,
    pub tags: String,
    pub created_at: String,
    pub updated_at: String,
    pub deleted_at: Option<String>,
}
