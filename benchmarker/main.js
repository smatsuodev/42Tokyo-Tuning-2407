import dispatchTowTruck from "./scenarios/dispatchTowTruck.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.2/index.js";

export const options = {
  scenarios: {
    area2: {
      executor: "shared-iterations",
      vus: 1,
      iterations: 4,
      maxDuration: __ENV.CLIENT_ORIGIN_URL.includes("https://app-")
        ? "60s"
        : "30s",
      exec: "dispatchTowTruck",
      gracefulStop: "30s",
      env: {
        AREA: "2",
      },
      options: {
        browser: {
          type: "chromium",
        },
      },
    },
    area3: {
      executor: "shared-iterations",
      vus: 2,
      iterations: 30,
      startTime: __ENV.CLIENT_ORIGIN_URL.includes("https://app-")
        ? "40s"
        : "20s",
      maxDuration: __ENV.CLIENT_ORIGIN_URL.includes("https://app-")
        ? "60s"
        : "30s",
      gracefulStop: "30s",
      exec: "dispatchTowTruck",
      env: {
        AREA: "3",
      },
      options: {
        browser: {
          type: "chromium",
        },
      },
    },
    area4: {
      executor: "shared-iterations",
      vus: 2,
      iterations: 30,
      startTime: __ENV.CLIENT_ORIGIN_URL.includes("https://app-")
        ? "60s"
        : "30s",
      maxDuration: __ENV.CLIENT_ORIGIN_URL.includes("https://app-")
        ? "60s"
        : "30s",
      exec: "dispatchTowTruck",
      gracefulStop: "30s",
      env: {
        AREA: "4",
      },
      options: {
        browser: {
          type: "chromium",
        },
      },
    },
    area5: {
      executor: "shared-iterations",
      vus: 2,
      iterations: 15,
      startTime: __ENV.CLIENT_ORIGIN_URL.includes("https://app-")
        ? "80s"
        : "40s",
      maxDuration: __ENV.CLIENT_ORIGIN_URL.includes("https://app-")
        ? "60s"
        : "30s",
      exec: "dispatchTowTruck",
      gracefulStop: "30s",
      env: {
        AREA: "5",
      },
      options: {
        browser: {
          type: "chromium",
        },
      },
    },
    area6: {
      executor: "shared-iterations",
      vus: 2,
      iterations: 15,
      startTime: __ENV.CLIENT_ORIGIN_URL.includes("https://app-")
        ? "100s"
        : "50s",
      maxDuration: __ENV.CLIENT_ORIGIN_URL.includes("https://app-")
        ? "60s"
        : "30s",
      gracefulStop: "30s",
      exec: "dispatchTowTruck",
      env: {
        AREA: "6",
      },
      options: {
        browser: {
          type: "chromium",
        },
      },
    },
    area7: {
      executor: "shared-iterations",
      vus: 2,
      iterations: 15,
      startTime: __ENV.CLIENT_ORIGIN_URL.includes("https://app-")
        ? "120s"
        : "60s",
      maxDuration: __ENV.CLIENT_ORIGIN_URL.includes("https://app-")
        ? "60s"
        : "30s",
      exec: "dispatchTowTruck",
      gracefulStop: "30s",
      env: {
        AREA: "7",
      },
      options: {
        browser: {
          type: "chromium",
        },
      },
    },
  },
};

export { dispatchTowTruck };

export function handleSummary(data) {
  const rawDataFilePath = __ENV.RAW_DATA_FILE_PATH;

  return {
    [rawDataFilePath]: JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: "→", enableColors: true }),
  };
}
