import http from "k6/http";
import { check } from "k6";
import { createApiUrl } from "../utils.js";
import { Counter, Trend } from "k6/metrics";

const getAllOrdersTime = new Trend("get_all_orders_time", true);
const getAllOrdersSucceedCounter = new Counter("get_all_orders_succeed_count");
const getPendingOrdersTime = new Trend("get_pending_orders_time", true);
const getPendingOrdersSucceedCounter = new Counter(
  "get_pending_orders_succeed_count"
);

export const getAllOrders = (sessionToken) => {
  const url = createApiUrl(
    "/order/list?page_size=5&sort_by=order_time&sort_order=asc"
  );
  const params = {
    headers: {
      Authorization: sessionToken,
    },
  };

  const res = http.get(url, params);
  check(res, { "Status Code: 200": (r) => r.status === 200 });

  if (res.status === 200 && !!res.body) {
    getAllOrdersSucceedCounter.add(1);
    getAllOrdersTime.add(res.timings.duration);
  }

  return JSON.parse(res.body || "null");
};

export const getPendingOrders = (sessionToken, areaId) => {
  const url = createApiUrl(
    `/order/list?page_size=5&status=pending&area=${areaId}&sort_by=order_time&sort_order=asc`
  );
  const params = {
    headers: {
      Authorization: sessionToken,
    },
  };

  const res = http.get(url, params);
  check(res, { "Status Code: 200": (r) => r.status === 200 });

  if (res.status === 200) {
    getPendingOrdersTime.add(res.timings.duration);
    getPendingOrdersSucceedCounter.add(1);
  }

  return JSON.parse(res.body || "null");
};
