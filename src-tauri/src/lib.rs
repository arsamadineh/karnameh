pub mod db;
pub mod error;
pub mod models;
pub mod repositories;
pub mod commands;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Initialize Database
      let app_dir = app.path().app_data_dir().expect("failed to get app data dir");
      
      // We block_on because setup is synchronous but our DB init is async
      let pool = tauri::async_runtime::block_on(async {
          db::init_db(&app_dir).await.expect("Failed to initialize database")
      });
      
      // Store connection pool in Tauri state
      app.manage(pool);

      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      commands::client_cmds::get_clients,
      commands::client_cmds::get_client,
      commands::client_cmds::create_client,
      commands::client_cmds::update_client,
      commands::client_cmds::delete_client,
      
      commands::project_cmds::get_projects,
      commands::project_cmds::get_project,
      commands::project_cmds::create_project,
      commands::project_cmds::update_project,
      commands::project_cmds::delete_project,
      
      commands::task_cmds::get_tasks,
      commands::task_cmds::get_task,
      commands::task_cmds::create_task,
      commands::task_cmds::update_task,
      commands::task_cmds::delete_task,
      
      commands::checklist_cmds::get_checklists,
      commands::checklist_cmds::get_checklist_by_date,
      commands::checklist_cmds::get_checklist_items,
      commands::checklist_cmds::create_checklist,
      commands::checklist_cmds::add_checklist_item,
      commands::checklist_cmds::toggle_checklist_item,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
