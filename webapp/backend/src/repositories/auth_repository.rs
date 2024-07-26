use std::collections::HashMap;
use std::sync::{Arc, RwLock};

use crate::errors::AppError;
use crate::models::user::{Dispatcher, User};
use crate::{domains::auth_service::AuthRepository, models::user::Session};
use sqlx::mysql::MySqlPool;

#[derive(Debug)]
pub struct AuthRepositoryImpl {
    pool: MySqlPool,
    sessions: Arc<RwLock<HashMap<String, i32>>>,
}

impl AuthRepositoryImpl {
    pub fn new(pool: MySqlPool, sessions: Arc<RwLock<HashMap<String, i32>>>) -> Self {
        AuthRepositoryImpl { pool, sessions }
    }
}

impl AuthRepository for AuthRepositoryImpl {
    async fn find_user_by_id(&self, id: i32) -> Result<Option<User>, AppError> {
        let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?")
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;

        Ok(user)
    }

    async fn find_user_by_username(&self, username: &str) -> Result<Option<User>, AppError> {
        let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE username = ?")
            .bind(username)
            .fetch_optional(&self.pool)
            .await?;

        Ok(user)
    }

    async fn find_profile_image_name_by_user_id(
        &self,
        user_id: i32,
    ) -> Result<Option<String>, AppError> {
        let profile_image_name = sqlx::query_scalar("SELECT profile_image FROM users WHERE id = ?")
            .bind(user_id)
            .fetch_optional(&self.pool)
            .await?;

        Ok(profile_image_name)
    }

    async fn authenticate_user(&self, username: &str, password: &str) -> Result<User, AppError> {
        let user =
            sqlx::query_as::<_, User>("SELECT * FROM users WHERE username = ? AND password = ?")
                .bind(username)
                .bind(password)
                .fetch_one(&self.pool)
                .await?;

        Ok(user)
    }

    async fn create_user(
        &self,
        username: &str,
        password: &str,
        role: &str,
    ) -> Result<(), AppError> {
        sqlx::query("INSERT INTO users (username, password, role) VALUES (?, ?, ?)")
            .bind(username)
            .bind(password)
            .bind(role)
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    async fn create_session(&self, user_id: i32, session_token: &str) -> Result<(), AppError> {
        self.sessions
            .write()
            .map_err(|_| AppError::InternalServerError)?
            .insert(session_token.to_string(), user_id);

        Ok(())
    }

    async fn delete_session(&self, session_token: &str) -> Result<(), AppError> {
        self.sessions
            .write()
            .map_err(|_| AppError::InternalServerError)?
            .remove(session_token);

        Ok(())
    }

    async fn find_session_by_session_token(
        &self,
        session_token: &str,
    ) -> Result<Session, AppError> {
        self.sessions
            .read()
            .map_err(|_| AppError::InternalServerError)?
            .get(session_token)
            .map(|user_id| Session {
                id: 0,
                user_id: *user_id,
                session_token: session_token.to_string(),
                is_valid: true,
            })
            .ok_or(AppError::InternalServerError)
    }

    async fn find_dispatcher_by_id(&self, id: i32) -> Result<Option<Dispatcher>, AppError> {
        let dispatcher = sqlx::query_as::<_, Dispatcher>("SELECT * FROM dispatchers WHERE id = ?")
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;

        Ok(dispatcher)
    }

    async fn find_dispatcher_by_user_id(
        &self,
        user_id: i32,
    ) -> Result<Option<Dispatcher>, AppError> {
        let dispatcher =
            sqlx::query_as::<_, Dispatcher>("SELECT * FROM dispatchers WHERE user_id = ?")
                .bind(user_id)
                .fetch_optional(&self.pool)
                .await?;

        Ok(dispatcher)
    }

    async fn create_dispatcher(&self, user_id: i32, area_id: i32) -> Result<(), AppError> {
        sqlx::query("INSERT INTO dispatchers (user_id, area_id) VALUES (?, ?)")
            .bind(user_id)
            .bind(area_id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }
}
