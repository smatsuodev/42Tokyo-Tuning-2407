use std::sync::Arc;

use actix_web::{
    dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform},
    Error,
};
use futures_util::future::{ready, LocalBoxFuture, Ready};

use crate::{
    domains::auth_service::AuthService, repositories::auth_repository::AuthRepositoryImpl,
};

pub struct AuthMiddleware {
    auth_service: Arc<AuthService<AuthRepositoryImpl>>,
}

impl AuthMiddleware {
    pub fn new(auth_service: Arc<AuthService<AuthRepositoryImpl>>) -> Self {
        AuthMiddleware { auth_service }
    }
}

impl<S, B> Transform<S, ServiceRequest> for AuthMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type InitError = ();
    type Transform = AuthMiddlewareMiddleware<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(AuthMiddlewareMiddleware {
            service,
            auth_service: self.auth_service.clone(),
        }))
    }
}

pub struct AuthMiddlewareMiddleware<S> {
    service: S,
    auth_service: Arc<AuthService<AuthRepositoryImpl>>,
}

impl<S, B> Service<ServiceRequest> for AuthMiddlewareMiddleware<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let auth_header = req
            .headers()
            .get("Authorization")
            .and_then(|h| h.to_str().ok())
            .map(|s| s.to_string());
        let auth_header = Arc::new(auth_header);

        let auth_service = self.auth_service.clone();
        let fut = self.service.call(req);

        Box::pin(async move {
            let is_valid_token = match &*auth_header {
                Some(token) => auth_service.validate_session(token).await.is_ok(),
                None => false,
            };

            if is_valid_token {
                fut.await
            } else {
                Err(actix_web::error::ErrorUnauthorized(
                    "Invalid or missing token",
                ))
            }
        })
    }
}
