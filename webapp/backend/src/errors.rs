use actix_web::{HttpResponse, ResponseError};
use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Bad Request")]
    BadRequest,
    #[error("Unauthorized")]
    Unauthorized,
    #[error("Not Found")]
    NotFound,
    #[error("Conflict")]
    Conflict,
    #[error("Internal Server Error")]
    InternalServerError,
    #[error(transparent)]
    SqlxError(#[from] sqlx::Error),
}

#[derive(Serialize)]
struct ErrorResponse {
    message: String,
}

impl ResponseError for AppError {
    fn error_response(&self) -> HttpResponse {
        let error_message = self.to_string();
        let error_response = ErrorResponse {
            message: error_message,
        };

        match *self {
            AppError::BadRequest => HttpResponse::BadRequest().json(error_response),
            AppError::Unauthorized => HttpResponse::Unauthorized().json(error_response),
            AppError::NotFound => HttpResponse::NotFound().json(error_response),
            AppError::Conflict => HttpResponse::Conflict().json(error_response),
            AppError::InternalServerError => {
                HttpResponse::InternalServerError().json(error_response)
            }
            AppError::SqlxError(_) => HttpResponse::InternalServerError().json(error_response),
        }
    }
}
