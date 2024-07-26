"use client";

import { Button, Container } from "@mui/material";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { NextPage } from "next";
import { logout } from "@/api/user";

const Home: NextPage = () => {
  const router = useRouter();
  const { sessionToken, removeUserInfo } = useAuth();

  const handleLogout = async () => {
    await logout(sessionToken);
    removeUserInfo();
    router.push("/login");
  };

  return (
    <Container>
      <h2>レッカー車配車アプリケーション</h2>
      <div>
        <Button id="button-requests-page" variant="contained" onClick={() => router.push("/orders")}>
          クライアントからのリクエスト一覧ページ
        </Button>
        <button id="button-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </Container>
  );
};

export default Home;
