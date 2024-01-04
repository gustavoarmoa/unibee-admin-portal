import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const APP_PATH = import.meta.env.BASE_URL;
const API_URL = import.meta.env.VITE_API_URL;

const Index = () => {
  const [errMsg, setErrMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    setErrMsg("");
    axios
      .get(`${API_URL}/merchant/profile`, {
        headers: {
          Authorization: `${token}`, // Bearer: ******
        },
      })
      .then((res) => {
        console.log("merchant dashboard as profile res: ", res);
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
      })
      .catch((err) => {
        console.log("login merchant profile err: ", err.message);
        // todo: show a toast
        setErrMsg(err.message);
      });
  }, []);

  return <div>dashboard</div>;
};

export default Index;
