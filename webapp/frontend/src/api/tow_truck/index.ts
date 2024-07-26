import Axios from "../axios";

export type TowTruck = {
  id: number;
  status: string;
  node_id: number;
};

const AxiosInstance = Axios.getInstance();

export const fetchNearestTowTruck = async (order_id: number, session_token: string) => {
  const res = await AxiosInstance.get<TowTruck>("/api/tow_truck/nearest", {
    params: {
      order_id
    },
    headers: {
      Authorization: session_token
    }
  });
  return res.data;
};
