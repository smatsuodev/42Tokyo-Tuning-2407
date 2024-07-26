"use client";

import { Order } from "@/api/order";
import { formatDateTime } from "@/utils/day";
import { Table, TableBody, TableCell, TableHead, TableRow, TextField } from "@mui/material";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import styles from "./OrderTable.module.scss";
import { useRouter } from "next/navigation";

type Props = {
  orders: Order[];
};

const OrderTable: React.FC<Props> = ({ orders }) => {
  const [search, setSearch] = useState("");
  const filteredOrders = useMemo(() => {
    return orders.filter(
      (order) =>
        order.status.includes(search) ||
        order.client_username.includes(search) ||
        order.dispatcher_username?.includes(search) ||
        order.driver_username?.includes(search)
    );
  }, [search]);
  const router = useRouter();

  const handleRowClick = (orderId: number) => () => {
    router.push(`/orders/${orderId}`);
  };

  const imageLoader = (userId: number) => () => {
    return `/api/user_image/${userId}`;
  };

  // k6の負荷試験用
  // イメージのロードが終わったらaltにcompletedを追加
  const completedImage = () => {
    const images = document.querySelectorAll("img");
    images.forEach((image) => {
      image.addEventListener("load", () => {
        const alt = image.alt;
        if (!alt.includes("(completed)")) {
          image.alt = alt + " (completed)";
        }
      });
    });
  };

  useEffect(() => {
    completedImage();
  }, []);

  return (
    <>
      <TextField
        fullWidth
        label="Search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: "16px" }}
      />
      <Table id="order-table">
        <TableHead>
          <TableRow>
            <TableCell></TableCell>
            <TableCell>ステータス</TableCell>
            <TableCell>クライアント名</TableCell>
            <TableCell>ディスパッチャー名</TableCell>
            <TableCell>ドライバー名</TableCell>
            <TableCell>リクエスト日時</TableCell>
            <TableCell>リクエスト完了日時</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredOrders.slice(0, 10).map((order) => (
            <TableRow key={order.id} className={styles.row} hover onClick={handleRowClick(order.id)}>
              <TableCell>{order.id}</TableCell>
              <TableCell>{order.status}</TableCell>
              <TableCell>
                <div className={styles.user}>
                  <Image
                    className={styles.icon}
                    loader={imageLoader(order.client_id)}
                    src={`${order.client_id}.png`}
                    alt={`Picture of the user: ${order.client_id}`}
                    width={50}
                    height={50}
                  />
                  <span>{order.client_username}</span>
                </div>
              </TableCell>
              <TableCell>
                {order.dispatcher_user_id ? (
                  <div className={styles.user}>
                    <Image
                      className={styles.icon}
                      loader={imageLoader(order.dispatcher_user_id)}
                      src={`${order.dispatcher_user_id}.png`}
                      alt={`Picture of the user(${order.dispatcher_user_id})`}
                      width={50}
                      height={50}
                    />
                    <span>{order.dispatcher_username}</span>
                  </div>
                ) : (
                  <>-</>
                )}
              </TableCell>
              <TableCell>
                {order.driver_user_id ? (
                  <div className={styles.user}>
                    <Image
                      className={styles.icon}
                      loader={imageLoader(order.driver_user_id)}
                      src={`${order.driver_user_id}.png`}
                      alt={`Picture of the user(${order.driver_user_id})`}
                      width={50}
                      height={50}
                    />
                    <span>{order.driver_username}</span>
                  </div>
                ) : (
                  <>-</>
                )}
              </TableCell>
              <TableCell>{formatDateTime(order.order_time, "YYYY年MM月DD日 HH:mm:ss")}</TableCell>
              <TableCell>
                {order.completed_time ? formatDateTime(order.completed_time, "YYYY年MM月DD日 HH:mm:ss") : "未完了"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
};

export default OrderTable;
