use sqlx::{sqlite::{SqliteConnectOptions, SqlitePoolOptions}, SqlitePool};
use std::str::FromStr;
use std::path::PathBuf;
use crate::error::AppError;

pub async fn init_db(app_dir: &PathBuf) -> Result<SqlitePool, AppError> {
    // Ensure the app directory exists
    if !app_dir.exists() {
        std::fs::create_dir_all(app_dir)
            .map_err(|e| AppError::Database(format!("Failed to create app directory: {}", e)))?;
    }

    let db_path = app_dir.join("karnameh.db");
    let db_url = format!("sqlite://{}?mode=rwc", db_path.to_string_lossy());

    let options = SqliteConnectOptions::from_str(&db_url)
        .map_err(|e| AppError::Database(format!("Invalid connection string: {}", e)))?
        .create_if_missing(true);

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(options)
        .await
        .map_err(|e| AppError::Database(format!("Failed to connect to database: {}", e)))?;

    // Run migrations
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .map_err(|e| AppError::Database(format!("Failed to run migrations: {}", e)))?;

    Ok(pool)
}
