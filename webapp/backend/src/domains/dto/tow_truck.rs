use serde::{Deserialize, Serialize};

// Input Data Structure

#[derive(Deserialize, Debug)]
pub struct UpdateLocationRequestDto {
    pub tow_truck_id: i32,
    pub node_id: i32,
}

// Output Data Structure

#[derive(Serialize, Clone)]
pub struct TowTruckDto {
    pub id: i32,
    pub driver_user_id: i32,
    pub driver_username: Option<String>,
    pub status: String,
    pub node_id: i32,
    pub area_id: i32,
}

impl TowTruckDto {
    pub fn from_entity(entity: crate::models::tow_truck::TowTruck) -> Self {
        TowTruckDto {
            id: entity.id,
            driver_user_id: entity.driver_id,
            driver_username: entity.driver_username,
            status: entity.status,
            node_id: entity.node_id,
            area_id: entity.area_id,
        }
    }
}
