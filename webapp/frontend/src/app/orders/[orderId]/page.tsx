import { fetchOrder } from "@/api/order";
import { User } from "@/api/user";
import { OrderDetail } from "@/components/order";
import { Container, Typography } from "@mui/material";
import { NextPage } from "next";
import { cookies } from "next/headers";

type Props = {
  params: {
    orderId: string;
  };
};

const Order: NextPage<Props> = async ({ params }) => {
  const { orderId } = params;
  const session = cookies().get("session");

  let sessionToken = "";
  if (session) {
    const user: User = JSON.parse(session.value);
    sessionToken = user.session_token;
  }

  const order = await fetchOrder(orderId, sessionToken);

  return (
    <Container>
      <Typography variant="h2" gutterBottom>
        リクエスト詳細
      </Typography>
      <OrderDetail order={order} />
    </Container>
  );
};

export default Order;

// ビルド時にSSGを防ぐ
export const dynamic = "force-dynamic";
