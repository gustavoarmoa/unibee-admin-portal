import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Space, Table, Tag, Button, Form, Input, Select, message } from "antd";

const APP_PATH = import.meta.env.BASE_URL;
const API_URL = import.meta.env.VITE_API_URL;

const DEFAULT_FORM_VALUES = {
  currency: "USD",
  intervalUnit: "month",
  type: 1, // 1: main, 2: add-on
  imageUrl: "http://www.google.com",
  homeUrl: "http://www.google.com",
};

// new plan: 之后就是old plan了, 需要edit了, default form value 也不能用了.

const Index = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const navigate = useNavigate();

  const submitForm = (values: any) => {
    const f = JSON.parse(JSON.stringify(values));
    f.amount = Number(f.amount);
    f.intervalCount = Number(f.intervalCount);
    console.log("saving form: ", f);

    const token = localStorage.getItem("merchantToken");
    axios
      .post(`${API_URL}/merchant/plan/subscription_plan_create`, f, {
        headers: {
          Authorization: `${token}`, // Bearer: ******
        },
      })
      .then((res) => {
        console.log("create plan res: ", res);
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
        messageApi.open({
          type: "success",
          content: "Plan created",
        });
        setTimeout(() => {
          navigate(-1);
        }, 1000);
      })
      .catch((err) => {
        console.log("login merchant profile err: ", err.message);
        messageApi.open({
          type: "error",
          content: err.message,
        });
        setErrMsg(err.message);
      });
  };

  return (
    <div>
      {contextHolder}
      <Form
        form={form}
        onFinish={submitForm}
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 24 }}
        layout="horizontal"
        // disabled={componentDisabled}
        style={{ maxWidth: 600 }}
        initialValues={DEFAULT_FORM_VALUES}
      >
        <Form.Item label="ID" name="id" hidden initialValue={15621}>
          <Input disabled />
        </Form.Item>

        <Form.Item
          label="Plan name"
          name="planName"
          rules={[
            {
              required: true,
              message: "Please input your plan name!",
            },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item label="Plan Description" name="description">
          <Input />
        </Form.Item>

        <Form.Item
          label="Amount"
          name="amount"
          rules={[
            {
              required: true,
              message: "Please input your plan amount!",
            },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Currency"
          name="currency"
          rules={[
            {
              required: true,
              message: "Please select your plan currency!",
            },
          ]}
        >
          <Select
            style={{ width: 120 }}
            options={[
              { value: "USD", label: "USD" },
              { value: "JPY", label: "JPY" },
            ]}
          />
        </Form.Item>

        <Form.Item
          label="Interval Unit"
          name="intervalUnit"
          rules={[
            {
              required: true,
              message: "Please select interval unit!",
            },
          ]}
        >
          <Select
            style={{ width: 120 }}
            options={[
              { value: "day", label: "day" },
              { value: "week", label: "week" },
              { value: "month", label: "month" },
              { value: "year", label: "year" },
            ]}
          />
        </Form.Item>

        <Form.Item
          label="Interval Count"
          name="intervalCount"
          rules={[
            {
              required: true,
              message: "Please input interval count!",
            },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item label="Plan type" name="type">
          <Select
            style={{ width: 120 }}
            options={[
              { value: 1, label: "Main plan" },
              { value: 2, label: "Addon" },
            ]}
          />
        </Form.Item>

        <Form.Item label="Product Name" name="productName">
          <Input />
        </Form.Item>

        <Form.Item label="Product Description" name="productDescription">
          <Input />
        </Form.Item>

        <Form.Item label="imageUrl" name="imageUrl">
          <Input disabled />
        </Form.Item>

        <Form.Item label="homeUrl" name="homeUrl">
          <Input disabled />
        </Form.Item>

        {/* <Form.Item label=""> */}
        <div style={{ display: "flex", justifyContent: "center", gap: "18px" }}>
          <Button onClick={() => navigate(-1)}>Go back</Button>
          <Button type="primary" htmlType="submit">
            Save
          </Button>
          <Button>Publish</Button>
        </div>
        {/* </Form.Item>  */}
      </Form>
    </div>
  );
};

export default Index;

/*
  "merchantId": 15621,
  "planName": "string",
  "amount": 0,
  "currency": "string",
  "intervalUnit": "string",
  "intervalCount": 1,
  "type": 1,
  "description": "string",
  "productName": "string",
  "productDescription": "string",
  "imageUrl": "string",
  "homeUrl": "string"

*/
