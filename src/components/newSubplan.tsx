import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Space, Table, Tag, Button, Form, Input, Select, Flex } from "antd";

const APP_PATH = import.meta.env.BASE_URL;
const API_URL = import.meta.env.VITE_API_URL;

const DEFAULT_FORM_VALUES = {
  currency: "USD",
  intervalUnit: "month",
  type: 1, // 1: main, 2: add-on
};

const Index = () => {
  const [form] = Form.useForm();
  const [errMsg, setErrMsg] = useState("");
  const navigate = useNavigate();

  const onSave = () => {
    const errFields = form.getFieldsError();
    console.log("errFields: ", errFields);
    const token = localStorage.getItem("merchantToken");
    console.log("form: ", form.getFieldsValue());
    // form.submit();
  };

  const saveForm = () => {
    console.log("saving....");
  };

  return (
    <div>
      <Form
        form={form}
        // onFinish={saveForm}
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
          <Input />
        </Form.Item>

        <Form.Item label="homeUrl" name="homeUrl">
          <Input />
        </Form.Item>

        {/* <Form.Item label=""> */}
        <div style={{ display: "flex", justifyContent: "center", gap: "18px" }}>
          <Button onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="primary" onClick={onSave}>
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
