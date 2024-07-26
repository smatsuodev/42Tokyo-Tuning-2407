import http from "k6/http";
import { check } from "k6";
import { createApiUrl } from "../utils.js";
import { Counter, Trend } from "k6/metrics";

const loginTime = new Trend("login_time", true);
const loginSuccessCounter = new Counter("login_success_count");

export const login = (username) => {
  const url = createApiUrl("/login");
  const payload = JSON.stringify({
    username,
    password: "password",
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const res = http.post(url, payload, params);
  check(res, { "Status Code: 200": (r) => r.status === 200 }, { name: login.name});

  if (res.status === 200 && !!res.body) {
    loginSuccessCounter.add(1);
    loginTime.add(res.timings.duration);
  }

  return JSON.parse(res.body || "null");
};
