import http from "k6/http";
import { check } from "k6";
import { createApiUrl } from "../utils.js";
import { Trend } from "k6/metrics";

const getUserImageTime = new Trend("get_user_image_time", true);

export const getUserImages = (sessionToken, orders) => {
    const params = {
        headers: {
            Authorization: sessionToken,
        },
    };
    orders.forEach((order) => {
        const clientUrl = createApiUrl(`/user_image/${order.client_id}`);
        const clientRes = http.get(clientUrl, params);
        check(clientRes, { "Status Code: 200": (r) => r.status === 200 });
        getUserImageTime.add(clientRes.timings.duration);

        if (order.dispatcher_user_id) {
            const dispatcherUrl = createApiUrl(`/user_image/${order.dispatcher_user_id}`);
            const dispatcherRes = http.get(dispatcherUrl, params);
            check(dispatcherRes, { "Status Code: 200": (r) => r.status === 200 });
            getUserImageTime.add(dispatcherRes.timings.duration);
        }

        if (order.driver_user_id) {
            const driverUrl = createApiUrl(`/user_image/${order.driver_user_id}`);
            const driverRes = http.get(driverUrl, params);
            check(driverRes, { "Status Code: 200": (r) => r.status === 200 });
            getUserImageTime.add(driverRes.timings.duration);
        }
    })
};
