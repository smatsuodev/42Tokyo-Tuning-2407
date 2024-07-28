use crate::{
    errors::AppError,
    models::graph::{Edge, Node},
};

pub trait MapRepository {
    async fn get_all_nodes(&self, area_id: Option<i32>) -> Result<Vec<Node>, sqlx::Error>;
    async fn get_all_edges(&self, area_id: Option<i32>) -> Result<Vec<Edge>, sqlx::Error>;
    async fn get_area_id_by_node_id(&self, node_id: i32) -> Result<i32, sqlx::Error>;
    async fn update_edge(
        &self,
        node_a_id: i32,
        node_b_id: i32,
        weight: i32,
    ) -> Result<(), sqlx::Error>;
    fn shortest_path(&self, from_node_id: i32, to_node_id: i32, area_id: Option<i32>) -> i32;
}

#[derive(Debug)]
pub struct MapService<T: MapRepository + std::fmt::Debug> {
    repository: T,
}

impl<T: MapRepository + std::fmt::Debug> MapService<T> {
    pub fn new(repository: T) -> Self {
        MapService { repository }
    }

    pub async fn update_edge(
        &self,
        node_a_id: i32,
        node_b_id: i32,
        weight: i32,
    ) -> Result<(), AppError> {
        self.repository
            .update_edge(node_a_id, node_b_id, weight)
            .await?;

        Ok(())
    }
}
