import Axios from "../axios";
import Fetch from "../fetch";
import queryString from "query-string";

export type Order = {
  id: number;
  status: string;
  node_id: number;
  area_id: number;
  tow_truck_id: number;
  car_value: number;
  client_id: number;
  client_username: string;
  dispatcher_user_id: number;
  dispatcher_username: string;
  driver_user_id: number;
  driver_username: string;
  order_time: string;
  completed_time: string;
};

export type OrdersQueryParams = {
  status: string;
  sort_by: string;
  sort_order: string;
};

// TAGS

const AxiosInstance = Axios.getInstance();
const FetchInstance = Fetch.getInstance();

export const fetchOrders = async (query_params: OrdersQueryParams, area: number | null, session_token: string) => {
  const queryParams = queryString.stringify({
    ...query_params,
    status: "pending",
    sort_by: "order_time",
    sort_order: "asc",
    area
  });
  const orders = await FetchInstance.fetch<Order[]>(`/api/order/list?${queryParams}`, {
    headers: { Authorization: session_token }
  });
  return orders;
};

export const fetchOrder = async (order_id: string, session_token: string) => {
  const order = await FetchInstance.fetch<Order>(`/api/order/${order_id}`, {
    headers: { Authorization: session_token }
  });
  return order;
};

export const arrangeTowTruck = async (
  dispatcher_id: number,
  order_id: number,
  tow_truck_id: number,
  order_time: string,
  session_token: string
) => {
  await AxiosInstance.post(
    "/api/order/dispatcher",
    {
      dispatcher_id,
      order_id,
      tow_truck_id,
      order_time
    },
    { timeout: 5000, headers: { Authorization: session_token } }
  );
};
