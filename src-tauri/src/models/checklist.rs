use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Checklist {
    pub id: String,
    pub title: String,
    pub date: String, // YYYY-MM-DD
    pub notes: String,
    pub completed_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChecklistItem {
    pub id: String,
    pub checklist_id: String,
    pub text: String,
    pub done: bool,
    pub sort_order: i64,
}
