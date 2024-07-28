use std::collections::HashMap;
use std::sync::{Arc, RwLock};

use actix_cors::Cors;
use actix_web::{web, App, HttpServer};
use api::{
    auth_handler, health_check_handler, map_handler, order_handler, result_handler,
    tow_truck_handler,
};
use domains::map_service::MapService;
use domains::{
    auth_service::AuthService, order_service::OrderService, tow_truck_service::TowTruckService,
};
use middlewares::auth_middleware::AuthMiddleware;
use models::graph::{Edge, Graph, Node};
use repositories::auth_repository::AuthRepositoryImpl;
use repositories::map_repository::MapRepositoryImpl;
use repositories::order_repository::OrderRepositoryImpl;
use repositories::tow_truck_repository::TowTruckRepositoryImpl;

mod api;
mod domains;
mod errors;
mod infrastructure;
mod middlewares;
mod models;
mod repositories;
mod utils;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init();
    let pool = infrastructure::db::create_pool().await;
    let mut port = 8080;

    if cfg!(debug_assertions) {
        port = 18080;
    }

    let edges_cache: HashMap<(i32, i32), Edge> = sqlx::query_as::<_, Edge>(
        "SELECT
            e.node_a_id,
            e.node_b_id,
            e.weight
        FROM
            edges e",
    )
    .fetch_all(&pool)
    .await
    .unwrap()
    .into_iter()
    .map(|edge| ((edge.node_a_id, edge.node_b_id), edge))
    .collect();

    let num_of_areas: i32 = sqlx::query_scalar("SELECT COUNT(*) FROM areas")
        .fetch_one(&pool)
        .await
        .unwrap();
    let mut edges_by_area_cache: Vec<HashMap<(i32, i32), Edge>> = Vec::new();
    for area in 1..=num_of_areas {
        let edges = sqlx::query_as::<_, Edge>(
            "SELECT
                e.node_a_id,
                e.node_b_id,
                e.weight
            FROM
                edges e
            JOIN
                nodes n
            ON
                e.node_a_id = n.id
                AND n.area_id = ?
            ",
        )
        .bind(area)
        .fetch_all(&pool)
        .await
        .unwrap()
        .into_iter()
        .map(|edge| ((edge.node_a_id, edge.node_b_id), edge))
        .collect();
        edges_by_area_cache.push(edges);
    }

    let nodes_cache: Vec<Node> = sqlx::query_as::<_, Node>(
        "SELECT
        *
        FROM
            nodes n",
    )
    .fetch_all(&pool)
    .await
    .unwrap()
    .into_iter()
    .collect();

    let mut nodes_by_area_cache: Vec<Vec<Node>> = Vec::new();
    for area in 1..=num_of_areas {
        let nodes = sqlx::query_as::<_, Node>(
            "SELECT
                *
            FROM
                nodes n
            WHERE
                n.area_id = ?
            ",
        )
        .bind(area)
        .fetch_all(&pool)
        .await
        .unwrap()
        .into_iter()
        .collect();
        nodes_by_area_cache.push(nodes);
    }

    let mut graph_cache = Graph::new();
    for node in nodes_cache.clone() {
        graph_cache.add_node(node);
    }
    for edge in edges_cache.values() {
        graph_cache.add_edge(edge.clone());
    }

    let mut graphs_by_area_cache = Vec::new();
    for area in 1..=num_of_areas {
        let nodes = nodes_by_area_cache[area as usize - 1].clone();
        let edges = edges_by_area_cache[area as usize - 1].clone();
        let mut graph = Graph::new();
        for node in nodes {
            graph.add_node(node);
        }
        for edge in edges.values() {
            graph.add_edge(edge.clone());
        }
        graphs_by_area_cache.push(graph);
    }

    // 初期化時にDBからセッションを同期
    let sessions =
        sqlx::query_as::<_, (String, i32)>("SELECT session_token, user_id FROM sessions")
            .fetch_all(&pool)
            .await
            .unwrap()
            .into_iter()
            .collect();

    let sessions = Arc::new(RwLock::new(sessions));
    let edges_cache = Arc::new(RwLock::new(edges_cache));
    let edges_by_area_cache = Arc::new(RwLock::new(edges_by_area_cache));
    let graph_cache = Arc::new(RwLock::new(graph_cache));
    let graphs_cache = Arc::new(RwLock::new(graphs_by_area_cache));

    let auth_service = web::Data::new(AuthService::new(AuthRepositoryImpl::new(
        pool.clone(),
        sessions.clone(),
    )));
    let auth_service_for_middleware = Arc::new(AuthService::new(AuthRepositoryImpl::new(
        pool.clone(),
        sessions.clone(),
    )));
    let tow_truck_service = web::Data::new(TowTruckService::new(
        TowTruckRepositoryImpl::new(pool.clone()),
        OrderRepositoryImpl::new(pool.clone()),
        MapRepositoryImpl::new(
            pool.clone(),
            edges_cache.clone(),
            edges_by_area_cache.clone(),
            nodes_cache.clone(),
            nodes_by_area_cache.clone(),
            graphs_cache.clone(),
            graph_cache.clone(),
        ),
    ));
    let order_service = web::Data::new(OrderService::new(
        OrderRepositoryImpl::new(pool.clone()),
        TowTruckRepositoryImpl::new(pool.clone()),
        AuthRepositoryImpl::new(pool.clone(), sessions.clone()),
        MapRepositoryImpl::new(
            pool.clone(),
            edges_cache.clone(),
            edges_by_area_cache.clone(),
            nodes_cache.clone(),
            nodes_by_area_cache.clone(),
            graphs_cache.clone(),
            graph_cache.clone(),
        ),
    ));
    let map_service = web::Data::new(MapService::new(MapRepositoryImpl::new(
        pool.clone(),
        edges_cache.clone(),
        edges_by_area_cache.clone(),
        nodes_cache.clone(),
        nodes_by_area_cache.clone(),
        graphs_cache.clone(),
        graph_cache.clone(),
    )));

    HttpServer::new(move || {
        let mut cors = Cors::default();

        cors = cors
            .allowed_methods(vec!["GET", "POST", "PUT", "DELETE"])
            .allowed_headers(vec![
                actix_web::http::header::AUTHORIZATION,
                actix_web::http::header::ACCEPT,
            ])
            .allowed_header(actix_web::http::header::CONTENT_TYPE)
            .supports_credentials()
            .max_age(3600);

        App::new()
            .app_data(tow_truck_service.clone())
            .app_data(auth_service.clone())
            .app_data(order_service.clone())
            .app_data(map_service.clone())
            .wrap(cors)
            .service(
                web::scope("/api")
                    .service(
                        web::resource("/health_check")
                            .route(web::get().to(health_check_handler::health_check_handler)),
                    )
                    .service(
                        web::resource("/result")
                            .route(web::get().to(result_handler::result_handler)),
                    )
                    .service(
                        web::resource("/register")
                            .route(web::post().to(auth_handler::register_handler)),
                    )
                    .service(
                        web::resource("/login").route(web::post().to(auth_handler::login_handler)),
                    )
                    .service(
                        web::resource("/logout")
                            .route(web::post().to(auth_handler::logout_handler)),
                    )
                    .service(
                        web::resource("/user_image/{user_id}")
                            .route(web::get().to(auth_handler::user_profile_image_handler)),
                    )
                    .service(
                        web::scope("/tow_truck")
                            .wrap(AuthMiddleware::new(auth_service_for_middleware.clone()))
                            .service(web::resource("/list").route(
                                web::get().to(tow_truck_handler::get_paginated_tow_trucks_handler),
                            ))
                            .service(
                                web::resource("/location").route(
                                    web::post().to(tow_truck_handler::update_location_handler),
                                ),
                            )
                            .service(web::resource("/nearest").route(
                                web::get().to(
                                    tow_truck_handler::get_nearest_available_tow_trucks_handler,
                                ),
                            ))
                            .service(
                                web::resource("/{id}")
                                    .route(web::get().to(tow_truck_handler::get_tow_truck_handler)),
                            ),
                    )
                    .service(
                        web::scope("/order")
                            .wrap(AuthMiddleware::new(auth_service_for_middleware.clone()))
                            .service(
                                web::resource("/list").route(
                                    web::get().to(order_handler::get_paginated_orders_handler),
                                ),
                            )
                            .service(
                                web::resource("/status").route(
                                    web::post().to(order_handler::update_order_status_handler),
                                ),
                            )
                            .service(
                                web::resource("/client").route(
                                    web::post().to(order_handler::create_client_order_handler),
                                ),
                            )
                            .service(web::resource("/dispatcher").route(
                                web::post().to(order_handler::create_dispatcher_order_handler),
                            ))
                            .service(
                                web::resource("/{id}")
                                    .route(web::get().to(order_handler::get_order_handler)),
                            ),
                    )
                    .service(
                        web::scope("/map")
                            .wrap(AuthMiddleware::new(auth_service_for_middleware.clone()))
                            .service(
                                web::resource("/update_edge")
                                    .route(web::put().to(map_handler::update_edge_handler)),
                            ),
                    ),
            )
    })
    .bind(format!("0.0.0.0:{port}"))?
    .run()
    .await
}
