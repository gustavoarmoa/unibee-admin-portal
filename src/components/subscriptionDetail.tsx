import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "antd";

const APP_PATH = import.meta.env.BASE_URL;
const API_URL = import.meta.env.VITE_API_URL;

const Index = () => {
  const params = useParams();
  const [errMsg, setErrMsg] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  console.log("token: ", token);

  useEffect(() => {
    console.log("params: ", params.planId, "//", typeof params.planId);
    if (isNaN(Number(params.planId))) {
      return;
    }
    axios
      .post(
        `${API_URL}/merchant/auth/plan/subscription_plan_detail`,
        {
          planId: Number(params.planId),
          // merchantId: 15621,
          // type: 1,
          // status: 0,
          // currency: "usd",
        },
        {
          headers: {
            Authorization: `${token}`, // Bearer: ******
          },
        }
      )
      .then((res) => {
        console.log("subscription list res: ", res);
        const statuCode = res.data.code;
        if (statuCode != 0) {
          if (statuCode == 61) {
            console.log("invalid token");
            navigate(`${APP_PATH}login`, {
              state: { msg: "session expired, please re-login" },
            });
            return;
          }
          throw new Error(res.data.message);
        }
        // setPlan(normalize(res.data.data.Plans));
      })
      .catch((err) => {
        console.log("get subscription list err: ", err);
        // TODO: show a toast
        setErrMsg(err.message);
      });
  }, []);

  return (
    <div>
      <Button onClick={() => navigate(-1)}>Cancel</Button>
    </div>
  );
};

export default Index;
