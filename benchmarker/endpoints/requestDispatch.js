import http from "k6/http";
import { createApiUrl } from "../utils.js";
import { Trend, Counter } from "k6/metrics";

const orderDispatchTime = new Trend("order_dispatch_time", true);
const orderDispatchSucceedCounter = new Counter("order_dispatch_success_count");
const orderDispatchFailCounter = new Counter("order_dispatch_fail_count");

export const orderDispatch = (
  sessionToken,
  dispatcherId,
  orderId,
  towTruckId
) => {
  const url = createApiUrl("/order/dispatcher");
  const now = new Date().toISOString();

  const payload = JSON.stringify({
    order_id: orderId,
    dispatcher_id: dispatcherId,
    tow_truck_id: towTruckId,
    order_time: now,
  });

  const params = {
    headers: {
      Authorization: sessionToken,
      "Content-Type": "application/json",
    },
  };

  const res = http.post(url, payload, params);

  if (res.status === 200) {
    orderDispatchTime.add(res.timings.duration);
    orderDispatchSucceedCounter.add(1);
  } else {
    orderDispatchFailCounter.add(1);
  }
};
