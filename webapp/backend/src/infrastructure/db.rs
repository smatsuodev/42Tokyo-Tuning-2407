use sqlx::mysql::{MySqlPool, MySqlPoolOptions};
use std::env;

pub async fn create_pool() -> MySqlPool {
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    MySqlPoolOptions::new()
        .max_connections(500)
        .connect(&database_url)
        .await
        .expect("Failed to create pool")
}
