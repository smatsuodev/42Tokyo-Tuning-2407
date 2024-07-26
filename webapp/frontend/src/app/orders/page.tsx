import { Container, Typography } from "@mui/material";
import { NextPage } from "next";
import { fetchOrders, OrdersQueryParams } from "@/api/order";
import { OrderTable } from "@/components/order";
import { cookies } from "next/headers";
import { User } from "@/api/user";
import { redirect } from "next/navigation";

type Props = {
  searchParams: OrdersQueryParams;
};

const Orders: NextPage<Props> = async ({ searchParams }) => {
  const session = cookies().get("session");

  let area: number | null = null;
  let sessionToken = "";
  if (session) {
    const user: User = JSON.parse(session.value);
    sessionToken = user.session_token;

    if (user.role === "dispatcher") {
      area = user.area_id;
    }
  } else {
    redirect("/login");
  }

  const orders = await fetchOrders(searchParams, area, sessionToken);

  return (
    <Container>
      <Typography variant="h2" gutterBottom>
        リクエスト一覧
      </Typography>
      <OrderTable orders={orders} />
    </Container>
  );
};

export default Orders;

// ビルド時にSSGを防ぐ
export const dynamic = "force-dynamic";
