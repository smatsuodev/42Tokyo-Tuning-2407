use chrono::Utc;
use log::warn;

use super::dto::tow_truck::{self, TowTruckDto};
use super::map_service::MapRepository;
use super::order_service::OrderRepository;
use crate::errors::AppError;
use crate::models::graph::Graph;
use crate::models::tow_truck::TowTruck;

pub trait TowTruckRepository {
    async fn get_paginated_tow_trucks(
        &self,
        page: i32,
        page_size: i32,
        status: Option<String>,
        area_id: Option<i32>,
    ) -> Result<Vec<TowTruck>, AppError>;
    async fn update_location(&self, truck_id: i32, node_id: i32) -> Result<(), AppError>;
    async fn update_status(&self, truck_id: i32, status: &str) -> Result<(), AppError>;
    async fn find_tow_truck_by_id(&self, id: i32) -> Result<Option<TowTruck>, AppError>;
}

#[derive(Debug)]
pub struct TowTruckService<
    T: TowTruckRepository + std::fmt::Debug,
    U: OrderRepository + std::fmt::Debug,
    V: MapRepository + std::fmt::Debug,
> {
    tow_truck_repository: T,
    order_repository: U,
    map_repository: V,
}

impl<
        T: TowTruckRepository + std::fmt::Debug,
        U: OrderRepository + std::fmt::Debug,
        V: MapRepository + std::fmt::Debug,
    > TowTruckService<T, U, V>
{
    pub fn new(tow_truck_repository: T, order_repository: U, map_repository: V) -> Self {
        TowTruckService {
            tow_truck_repository,
            order_repository,
            map_repository,
        }
    }

    pub async fn get_tow_truck_by_id(&self, id: i32) -> Result<Option<TowTruckDto>, AppError> {
        let tow_truck = self.tow_truck_repository.find_tow_truck_by_id(id).await?;
        Ok(tow_truck.map(TowTruckDto::from_entity))
    }

    pub async fn get_all_tow_trucks(
        &self,
        page: i32,
        page_size: i32,
        status: Option<String>,
        area: Option<i32>,
    ) -> Result<Vec<TowTruckDto>, AppError> {
        let tow_trucks = self
            .tow_truck_repository
            .get_paginated_tow_trucks(page, page_size, status, area)
            .await?;
        let tow_truck_dtos = tow_trucks
            .into_iter()
            .map(TowTruckDto::from_entity)
            .collect();

        Ok(tow_truck_dtos)
    }

    pub async fn update_location(&self, truck_id: i32, node_id: i32) -> Result<(), AppError> {
        self.tow_truck_repository
            .update_location(truck_id, node_id)
            .await?;

        Ok(())
    }

    pub async fn get_nearest_available_tow_trucks(
        &self,
        order_id: i32,
    ) -> Result<Option<TowTruckDto>, AppError> {
        warn!(
            "{}: get_nearest_available_tow_trucks {} : called",
            Utc::now(),
            order_id
        );
        let order = self.order_repository.find_order_by_id(order_id).await?;
        let area_id = self
            .map_repository
            .get_area_id_by_node_id(order.node_id)
            .await?;
        let tow_trucks = self
            .tow_truck_repository
            .get_paginated_tow_trucks(0, -1, Some("available".to_string()), Some(area_id))
            .await?;

        // let nodes = self.map_repository.get_all_nodes(Some(area_id)).await?;
        // let edges = self.map_repository.get_all_edges(Some(area_id)).await?;

        // let mut graph = Graph::new();
        // for node in nodes {
        //     graph.add_node(node);
        // }
        // for edge in edges {
        //     graph.add_edge(edge);
        // }

        let mut min_distance = i32::MAX;
        let mut truck: Option<TowTruck> = None;
        warn!(
            "{}: get_nearest_available_tow_trucks {} : calc",
            Utc::now(),
            order_id
        );
        for t in tow_trucks {
            let distance = self.calculate_distance(t.node_id, order.node_id, Some(area_id));
            if distance < min_distance {
                min_distance = distance;
                truck = Some(t);
            }
        }

        if min_distance > 10000000 {
            return Ok(None);
        }

        let res = if let Some(truck) = truck {
            Some(TowTruckDto::from_entity(truck.clone()))
        } else {
            None
        };

        warn!(
            "{}: get_nearest_available_tow_trucks {} : finished",
            Utc::now(),
            order_id
        );
        Ok(res)
    }

    fn calculate_distance(&self, from_node_id: i32, to_node_id: i32, area: Option<i32>) -> i32 {
        self.map_repository
            .shortest_path(from_node_id, to_node_id, area)
    }
}
