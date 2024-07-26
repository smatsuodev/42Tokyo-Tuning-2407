import exec from "k6/execution";
import { getAllOrders, getPendingOrders } from "../endpoints/getOrders.js";
import { login } from "../endpoints/login.js";
import { getUserImages } from "../endpoints/getUserImages.js";
import { getNearestTowTruck } from "../endpoints/getTowTrucks.js";
import { orderDispatch } from "../endpoints/requestDispatch.js";

export default function () {
  const areaDispatcherCounts = [
    [2, 1],
    [3, 10],
    [4, 10],
  ];
  const totalDispatcherCount = areaDispatcherCounts.reduce(
    (acc, [_, count]) => acc + count,
    0
  );
  const idx = exec.scenario.iterationInInstance % totalDispatcherCount;

  let areaIdx = 0;
  let dispatcherIdx = 0;
  let acc = 0;
  for (const [area, dispatcherCount] of areaDispatcherCounts) {
    if (idx < acc + dispatcherCount) {
      areaIdx = area;
      dispatcherIdx = idx - acc + 1;
      break;
    }
    acc += dispatcherCount;
  }
  const username = `dispatcher${areaIdx}_${dispatcherIdx}`;

  // ログイン
  const user = login(username);
  if (!user) {
    console.log(
      "user is undefined / null. Skip orderDispatch.",
      user,
      username
    );
    return;
  }

  const {
    session_token: sessionToken,
    dispatcher_id: dispatcherId,
    area_id: areaId,
  } = user;

  // 全ての依頼を取得する
  const allOrders = getAllOrders(sessionToken);

  if (!allOrders || !allOrders[0]) {
    console.log(
      "allOrders[0] is undefined / null. Skip orderDispatch.",
      allOrders
    );
    return;
  }

  // 全ての依頼の中を表示する上で必要な画像を取得する
  getUserImages(sessionToken, allOrders);

  // 対応待ちの依頼のみを取得する
  const pendingOrders = getPendingOrders(sessionToken, areaId);

  if (!pendingOrders || !pendingOrders[0]) {
    console.log(
      "pendingOrders[0] is undefined / null. Skip orderDispatch.",
      pendingOrders
    );
    return;
  }

  getUserImages(sessionToken, pendingOrders);

  // 対応待ちの依頼の中で最も古い依頼のIDを取得する
  const oldestPendingOrderId = pendingOrders[0].id;

  // 最も古い対応待ちの依頼に最も近いレッカー車を取得する
  const nearestTowTruck = getNearestTowTruck(
    sessionToken,
    oldestPendingOrderId
  );

  if (!nearestTowTruck || !nearestTowTruck.id) {
    console.log(
      "nearestTowTruck is undefined / null. Skip orderDispatch.",
      nearestTowTruck
    );
    return;
  }

  // ドライバーに依頼を割り当てる
  orderDispatch(
    sessionToken,
    dispatcherId,
    oldestPendingOrderId,
    nearestTowTruck.id
  );
}
