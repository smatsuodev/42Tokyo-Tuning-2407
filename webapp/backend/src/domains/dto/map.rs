// Input Data Structure

use serde::Deserialize;

#[derive(Deserialize, Debug)]
pub struct UpdateEdgeRequestDto {
    pub node_a_id: i32,
    pub node_b_id: i32,
    pub weight: i32,
}
