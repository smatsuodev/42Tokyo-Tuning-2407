import http from "k6/http";
import { check } from "k6";
import { createApiUrl } from "../utils.js";
import { Counter, Trend } from "k6/metrics";

const getNearestTowTruckTime = new Trend("get_nearest_tow_truck_time", true);
const getNearestTowTruckSucceedCounter = new Counter("get_nearest_tow_truck_succeed_count");

export const getNearestTowTruck = (sessionToken, orderId) => {
  const url = createApiUrl("/tow_truck/nearest?order_id=" + orderId);
  const params = {
    headers: {
      Authorization: sessionToken,
    },
  };

  const res = http.get(url, params);
  check(res, { "Status Code: 200": (r) => r.status === 200 });

  if (res.status === 200 || Boolean(res.body)) {
    getNearestTowTruckTime.add(res.timings.duration);
    getNearestTowTruckSucceedCounter.add(1);
  }

  return JSON.parse(res.body || "null");
};
