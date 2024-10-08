use sqlx::FromRow;
use std::cmp::Reverse;
use std::collections::{BinaryHeap, HashMap};

#[derive(FromRow, Clone, Debug)]
pub struct Node {
    pub id: i32,
    pub x: i32,
    pub y: i32,
}

#[derive(FromRow, Clone, Debug)]
pub struct Edge {
    pub node_a_id: i32,
    pub node_b_id: i32,
    pub weight: i32,
}

#[derive(Debug)]
pub struct Graph {
    pub max_node_id: usize,
    pub nodes: HashMap<i32, Node>,
    pub edges: HashMap<i32, Vec<Edge>>,
}

impl Graph {
    pub fn new() -> Self {
        Graph {
            max_node_id: 0,
            nodes: HashMap::new(),
            edges: HashMap::new(),
        }
    }

    pub fn add_node(&mut self, node: Node) {
        self.max_node_id = self.max_node_id.max(node.id as usize);
        self.nodes.insert(node.id, node);
    }

    pub fn add_edge(&mut self, edge: Edge) {
        self.edges
            .entry(edge.node_a_id)
            .or_default()
            .push(edge.clone());

        let reverse_edge = Edge {
            node_a_id: edge.node_b_id,
            node_b_id: edge.node_a_id,
            weight: edge.weight,
        };
        self.edges
            .entry(reverse_edge.node_a_id)
            .or_default()
            .push(reverse_edge);
    }

    pub fn update_weight(&mut self, node_a_id: i32, node_b_id: i32, weight: i32) {
        if let Some(edges) = self.edges.get_mut(&node_a_id) {
            for edge in edges {
                if edge.node_b_id == node_b_id {
                    edge.weight = weight;
                }
            }
        }

        if let Some(edges) = self.edges.get_mut(&node_b_id) {
            for edge in edges {
                if edge.node_b_id == node_a_id {
                    edge.weight = weight;
                }
            }
        }
    }

    pub fn shortest_path(&self, from_node_id: i32, to_node_id: i32) -> i32 {
        let mut distances = Vec::new();
        let mut heap = BinaryHeap::new();
        distances.resize(self.max_node_id + 1, i32::MAX);

        distances[from_node_id as usize] = 0;
        heap.push(Reverse((0, from_node_id)));

        while let Some(Reverse((cost, node_id))) = heap.pop() {
            if node_id == to_node_id {
                return cost;
            }

            if cost > distances[node_id as usize] {
                continue;
            }

            if let Some(edges) = self.edges.get(&node_id) {
                for edge in edges {
                    let next = edge.node_b_id;
                    let next_cost = cost + edge.weight;

                    if next_cost < distances[next as usize] {
                        distances[next as usize] = next_cost;
                        heap.push(Reverse((next_cost, next)));
                    }
                }
            }
        }

        i32::MAX
    }
}
