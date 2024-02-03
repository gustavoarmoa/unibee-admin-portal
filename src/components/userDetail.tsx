import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { message, Spin } from "antd";
import { getUserProfile } from "../requests";
import { LoadingOutlined } from "@ant-design/icons";
import { IProfile } from "../shared.types";
import UserAccountTab from "./subscriptionDetail/userAccountTab";

const APP_PATH = import.meta.env.BASE_URL;

const Index = () => {
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [userProfile, setUserProfile] = useState<IProfile | null>(null);

  const relogin = () =>
    navigate(`${APP_PATH}login`, {
      state: { msg: "session expired, please re-login" },
    });

  const fetchUserProfile = async () => {
    const userId = Number(params.userId);
    if (isNaN(userId) || userId < 0) {
      message.error("User not found");
      return;
    }
    try {
      setLoading(true);
      const res = await getUserProfile(userId);
      setLoading(false);
      console.log("res getting user profile: ", res);
      const code = res.data.code;
      code == 61 && relogin();
      if (code != 0) {
        throw new Error(res.data.message);
      }
      setUserProfile(res.data.data.User);
    } catch (err) {
      setLoading(false);
      if (err instanceof Error) {
        console.log("profile fetching err: ", err.message);
        message.error(err.message);
      } else {
        message.error("Unknown error");
      }
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  return (
    <div>
      <Spin
        spinning={loading}
        indicator={
          <LoadingOutlined style={{ fontSize: 32, color: "#FFF" }} spin />
        }
        fullscreen
      />
      <UserAccountTab user={userProfile} setUserProfile={setUserProfile} />
    </div>
  );
};

export default Index;
