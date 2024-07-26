use serde::{Deserialize, Serialize};

// Input Data Structure

#[derive(Deserialize, Debug)]
pub struct RegisterRequestDto {
    pub username: String,
    pub password: String,
    pub role: String,
    pub area_id: Option<i32>,
}

#[derive(Deserialize, Debug)]
pub struct LoginRequestDto {
    pub username: String,
    pub password: String,
}

#[derive(Deserialize)]
pub struct LogoutRequestDto {
    pub session_token: String,
}

// Output Data Structure

#[derive(Serialize)]
pub struct LoginResponseDto {
    pub user_id: i32,
    pub username: String,
    pub session_token: String,
    pub role: String,
    pub dispatcher_id: Option<i32>,
    pub area_id: Option<i32>,
}
