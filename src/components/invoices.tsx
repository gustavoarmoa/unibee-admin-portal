import React, { ChangeEvent, useEffect, useState } from "react";
import type { RadioChangeEvent } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { Button, Checkbox, Form, Input, Tabs, Radio, message } from "antd";
import OtpInput from "react-otp-input";
import axios from "axios";

const APP_PATH = import.meta.env.BASE_URL; // if not specified in build command, default is /
const API_URL = import.meta.env.VITE_API_URL;

const Index = () => {
  useEffect(() => {}, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        marginTop: "200px",
      }}
    >
      Invoice list for all customers
    </div>
  );
};

export default Index;
