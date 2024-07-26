use crate::{
    domains::order_service::OrderService,
    errors::AppError,
    repositories::{
        auth_repository::AuthRepositoryImpl, map_repository::MapRepositoryImpl,
        order_repository::OrderRepositoryImpl, tow_truck_repository::TowTruckRepositoryImpl,
    },
};
use actix_web::{web, HttpResponse};

pub async fn result_handler(
    service: web::Data<
        OrderService<
            OrderRepositoryImpl,
            TowTruckRepositoryImpl,
            AuthRepositoryImpl,
            MapRepositoryImpl,
        >,
    >,
) -> Result<HttpResponse, AppError> {
    match service.get_completed_orders().await {
        Ok(completed_orders) => Ok(HttpResponse::Ok().json(completed_orders)),
        Err(err) => Err(err),
    }
}
