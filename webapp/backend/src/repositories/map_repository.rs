use core::panic;
use std::{
    borrow::Borrow,
    collections::HashMap,
    sync::{Arc, RwLock},
};

use sqlx::MySqlPool;

use crate::{
    domains::map_service::MapRepository,
    models::graph::{Edge, Graph, Node},
};

#[derive(Debug)]
pub struct MapRepositoryImpl {
    pool: MySqlPool,
    edges_cache: Arc<RwLock<HashMap<(i32, i32), Edge>>>,
    edges_by_area_cache: Arc<RwLock<Vec<HashMap<(i32, i32), Edge>>>>,
    nodes_cache: Vec<Node>,
    nodes_by_area_cache: Vec<Vec<Node>>,
    graphs_by_area_cache: Arc<RwLock<Vec<Graph>>>,
    graph_cache: Arc<RwLock<Graph>>,
}

impl MapRepositoryImpl {
    pub fn new(
        pool: MySqlPool,
        edges_cache: Arc<RwLock<HashMap<(i32, i32), Edge>>>,
        edges_by_area_cache: Arc<RwLock<Vec<HashMap<(i32, i32), Edge>>>>,
        nodes_cache: Vec<Node>,
        nodes_by_area_cache: Vec<Vec<Node>>,
        graphs_cache: Arc<RwLock<Vec<Graph>>>,
        graph_cache: Arc<RwLock<Graph>>,
    ) -> Self {
        MapRepositoryImpl {
            pool,
            edges_cache,
            edges_by_area_cache,
            nodes_cache,
            nodes_by_area_cache,
            graphs_by_area_cache: graphs_cache,
            graph_cache,
        }
    }
}

impl MapRepository for MapRepositoryImpl {
    fn shortest_path(&self, from_node_id: i32, to_node_id: i32, area_id: Option<i32>) -> i32 {
        match area_id {
            Some(area_id) => self.graphs_by_area_cache.read().unwrap()[area_id as usize - 1]
                .shortest_path(from_node_id, to_node_id),
            None => self
                .graph_cache
                .read()
                .unwrap()
                .shortest_path(from_node_id, to_node_id),
        }
    }

    async fn get_all_nodes(&self, area_id: Option<i32>) -> Result<Vec<Node>, sqlx::Error> {
        let nodes = match area_id {
            Some(area_id) => self.nodes_by_area_cache[area_id as usize - 1].clone(),
            None => self.nodes_cache.clone(),
        };

        Ok(nodes)
    }

    async fn get_all_edges(&self, area_id: Option<i32>) -> Result<Vec<Edge>, sqlx::Error> {
        let edges = match area_id {
            Some(area_id) => self.edges_by_area_cache.read().unwrap()[area_id as usize - 1]
                .values()
                .cloned()
                .collect(),
            None => self.edges_cache.read().unwrap().values().cloned().collect(),
        };

        Ok(edges)
    }

    async fn get_area_id_by_node_id(&self, node_id: i32) -> Result<i32, sqlx::Error> {
        let area_id = sqlx::query_scalar("SELECT area_id FROM nodes WHERE id = ?")
            .bind(node_id)
            .fetch_one(&self.pool)
            .await?;

        Ok(area_id)
    }

    async fn update_edge(
        &self,
        node_a_id: i32,
        node_b_id: i32,
        weight: i32,
    ) -> Result<(), sqlx::Error> {
        sqlx::query("UPDATE edges SET weight = ? WHERE (node_a_id = ? AND node_b_id = ?) OR (node_a_id = ? AND node_b_id = ?)")
            .bind(weight)
            .bind(node_a_id)
            .bind(node_b_id)
            .bind(node_b_id)
            .bind(node_a_id)
            .execute(&self.pool)
            .await?;
        self.edges_cache.write().unwrap().insert(
            (node_a_id, node_b_id),
            Edge {
                node_a_id,
                node_b_id,
                weight,
            },
        );

        self.edges_by_area_cache
            .write()
            .unwrap()
            .iter_mut()
            .for_each(|edges| {
                edges.insert(
                    (node_a_id, node_b_id),
                    Edge {
                        node_a_id,
                        node_b_id,
                        weight,
                    },
                );
            });

        self.graph_cache
            .write()
            .unwrap()
            .update_weight(node_a_id, node_b_id, weight);

        self.graphs_by_area_cache
            .write()
            .unwrap()
            .iter_mut()
            .for_each(|graph| {
                graph.update_weight(node_a_id, node_b_id, weight);
            });

        Ok(())
    }
}
