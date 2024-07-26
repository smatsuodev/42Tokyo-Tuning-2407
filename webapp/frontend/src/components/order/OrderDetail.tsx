"use client";

import { arrangeTowTruck, Order } from "@/api/order";
import { formatDateTime } from "@/utils/day";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Typography
} from "@mui/material";
import styles from "./OrderDetail.module.scss";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { fetchNearestTowTruck } from "@/api/tow_truck";

type Props = {
  order: Order;
};

const OrderDetail: React.FC<Props> = ({ order }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [nearestTowTruckId, setNearestTowTruckId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const { sessionToken, dispatcherId } = useAuth();

  const handleDialogOpen = async () => {
    await handleFetchNearestTowTruck();
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setError("");
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
    setSnackbarMessage("");
  };

  const handleFetchNearestTowTruck = async () => {
    try {
      if (!sessionToken) {
        setError("不明なエラーが発生しました。");
        throw new Error("Invalid sessionToken");
      }

      const nearestTowTruck = await fetchNearestTowTruck(order.id, sessionToken);
      setNearestTowTruckId(nearestTowTruck.id);
    } catch {
      throw new Error("Failed to obtain the nearest tow truck.");
    }
  };

  const handleArrangeTowTruck = async () => {
    try {
      if (!sessionToken || !dispatcherId || !nearestTowTruckId) {
        setError("不明なエラーが発生しました。");
        throw new Error("Invalid sessionToken or dispatcherId or towTruckId");
      }

      const orderTime = new Date().toISOString();
      await arrangeTowTruck(dispatcherId, order.id, nearestTowTruckId, orderTime, sessionToken);
      order.status = "dispatched";

      handleDialogClose();
      setSnackbarMessage("レッカー車が正常に手配されました。");
      setSnackbarOpen(true);
    } catch {
      setError("レッカー車の手配に失敗しました。もう一度やりなおしてください。");
    }
  };

  return (
    <div className={styles.orderDetail}>
      <div className={styles.section}>
        <Typography className={styles.title} variant="body1">
          リクエスト情報
        </Typography>
        <Typography variant="body1">
          <strong>リクエストID:</strong> <span className={styles.value}>{order.id}</span>
        </Typography>
        <Typography variant="body1">
          <strong>ステータス:</strong>{" "}
          <span id="order-status" className={styles.value}>
            {order.status}
          </span>
        </Typography>
        <Typography variant="body1">
          <strong>ノードID:</strong> <span className={styles.value}>{order.node_id}</span>
        </Typography>
        <Typography variant="body1">
          <strong>エリア:</strong> <span className={styles.value}>{order.area_id}</span>
        </Typography>
        <Typography variant="body1">
          <strong>トラックID:</strong> <span className={styles.value}>{order.tow_truck_id}</span>
        </Typography>
        {order.status === "pending" && (
          <Button
            id="button-get-nearest"
            variant="contained"
            color="primary"
            className={styles.towTruckButton}
            onClick={handleDialogOpen}
          >
            レッカー車を手配
          </Button>
        )}
      </div>
      <div className={styles.section}>
        <Typography className={styles.title} variant="body1">
          クライアント＆ディスパッチャー情報
        </Typography>
        <Typography variant="body1">
          <strong>車の価値:</strong> <span className={styles.value}>{order.car_value}</span>
        </Typography>
        <Typography variant="body1">
          <strong>クライアントID:</strong> <span className={styles.value}>{order.client_id}</span>
        </Typography>
        <Typography variant="body1">
          <strong>クライアント名:</strong> <span className={styles.value}>{order.client_username}</span>
        </Typography>
        <Typography variant="body1">
          <strong>ディスパッチャーID:</strong> <span className={styles.value}>{order.dispatcher_user_id}</span>
        </Typography>
        <Typography variant="body1">
          <strong>ディスパッチャー名:</strong> <span className={styles.value}>{order.dispatcher_username}</span>
        </Typography>
        <Typography variant="body1">
          <strong>ドライバー名:</strong> <span className={styles.value}>{order.driver_username}</span>
        </Typography>
      </div>
      <div className={styles.section}>
        <Typography className={styles.title} variant="body1">
          タイミング情報
        </Typography>
        <Typography variant="body1">
          <strong>リクエスト時間:</strong>{" "}
          <span className={styles.value}>{formatDateTime(order.order_time, "YYYY年MM月DD日 HH:mm:ss")}</span>
        </Typography>
        <Typography variant="body1">
          <strong>完了時間:</strong>{" "}
          <span className={styles.value}>
            {order.completed_time ? formatDateTime(order.completed_time, "YYYY年MM月DD日 HH:mm:ss") : "未完了"}
          </span>
        </Typography>
      </div>
      <Dialog open={dialogOpen} onClose={handleDialogClose}>
        <DialogTitle>レッカー車を手配</DialogTitle>
        <DialogContent>
          {error && (
            <Typography color="error" gutterBottom>
              {error}
            </Typography>
          )}
          <DialogContentText gutterBottom>
            こちらの最寄りのレッカー車を手配しますがよろしいでしょうか？
          </DialogContentText>
          <Typography variant="body1">
            <strong>レッカー車ID:</strong> <span id="tow-truck-id">{nearestTowTruckId}</span>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button color="primary" onClick={handleDialogClose}>
            キャンセル
          </Button>
          <Button id="button-order-dispatch" variant="contained" color="primary" onClick={handleArrangeTowTruck}>
            手配する
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        id="dispatch-success-message"
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        open={snackbarOpen}
        autoHideDuration={5000}
      >
        <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default OrderDetail;
