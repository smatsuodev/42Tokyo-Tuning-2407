import fs from "fs";

const args = process.argv.slice(2);
const SCORE_FILE_PATH = args[0];
const RAW_DATA_FILE_PATH = args[1];

const rawData = fs.readFileSync(RAW_DATA_FILE_PATH, "utf8");
const data = JSON.parse(rawData);

const metrics = data.metrics;
const checks = data.root_group?.checks;

const loginSuccessCount =
  checks?.find((check) => check.name === "login_success")?.passes ?? 0;
const completedLoadImageCount =
  metrics?.completed_load_image_count?.values?.count ?? 0;
const logoutSuccessCount =
  checks?.find((check) => check.name === "logout_success")?.passes ?? 0;
const getPendingOrdersSucceedCount = [];
const getOrderDetailsSucceedCount = [];
const getNearestTowTruckSucceedCount = [];
const orderDispatchSucceedCount = [];

for (let i = 2; i <= 7; i++) {
  getPendingOrdersSucceedCount.push(
    metrics[`get_pending_orders_succeed_count_area${i}`]?.values?.count ?? 0
  );
  getOrderDetailsSucceedCount.push(
    metrics[`get_order_details_succeed_count_area${i}`]?.values?.count ?? 0
  );
  getNearestTowTruckSucceedCount.push(
    metrics[`get_nearest_tow_truck_succeed_count_area${i}`]?.values?.count ?? 0
  );
  orderDispatchSucceedCount.push(
    metrics[`order_dispatch_success_count_area${i}`]?.values?.count ?? 0
  );
}

const weights = {
  login: 10,
  logout: 30,
  getPendingOrders: [10, 10, 50, 50, 50, 80],
  completedLoadImage: 1,
  getOrderDetails: [10, 10, 20, 20, 20, 30],
  getNearestTowTruck: [50, 100, 150, 200, 300, 400],
  orderDispatchSuccess: [200, 300, 400, 500, 600, 700],
};

const loginScore = Math.min(loginSuccessCount * weights.login, 1000);
const logoutScore = Math.min(logoutSuccessCount * weights.logout, 1000);
const getPendingOrdersScore = Math.min(
  getPendingOrdersSucceedCount.reduce(
    (acc, count, i) => acc + count * weights.getPendingOrders[i],
    0
  ),
  1000
);
const completedLoadImageScore = Math.min(
  completedLoadImageCount * weights.completedLoadImage,
  500
);
const getOrderDetailsScore = getOrderDetailsSucceedCount.reduce(
  (acc, count, i) => acc + count * weights.getOrderDetails[i],
  0
);
const getNearestTowTruckScore = getNearestTowTruckSucceedCount.reduce(
  (acc, count, i) => acc + count * weights.getNearestTowTruck[i],
  0
);
const orderDispatchSuccessScore = orderDispatchSucceedCount.reduce(
  (acc, count, i) => acc + count * weights.orderDispatchSuccess[i],
  0
);

const finalScore = (
  loginScore +
  getPendingOrdersScore +
  completedLoadImageScore +
  getOrderDetailsScore +
  getNearestTowTruckScore +
  orderDispatchSuccessScore +
  logoutScore
).toPrecision(10); // 有効数字を10桁に設定

const score = {
  finalScore,
};

const scoreString = JSON.stringify(score, null, 2);
fs.writeFileSync(SCORE_FILE_PATH, scoreString);
