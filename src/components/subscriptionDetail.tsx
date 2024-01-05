import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Space, Table, Tag, Button, Form, Input, Select, message } from "antd";
import type { SelectProps } from "antd";
import { PLAN_STATUS } from "../constants";

const options: SelectProps["options"] = [];

const APP_PATH = import.meta.env.BASE_URL;
const API_URL = import.meta.env.VITE_API_URL;

type Plan = {
  id: number;
  gmtCreate: string;
  gmtModify: string;
  companyId: number;
  merchantId: number;
  planName: string;
  amount: number;
  currency: string;
  intervalUnit: string;
  intervalCount: number;
  description: string;
  isDeleted: number;
  imageUrl: string;
  homeUrl: string;
  channelProductName: string;
  channelProductDescription: string;
  taxPercentage: number;
  taxInclusive: number;
  type: number;
  status: number;
  bindingAddonIds: string;
};

const Index = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const params = useParams();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [addons, setAddons] = useState<Plan[]>([]);
  const [selectedAddon, setSelectedAddon] = useState<number[]>([]);
  const [errMsg, setErrMsg] = useState("");
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const submitForm = (values: any) => {
    const f = JSON.parse(JSON.stringify(values));
    f.amount = Number(f.amount);
    f.intervalCount = Number(f.intervalCount);
    f.planId = values.id;
    console.log("saving form: ", f);

    /*
    const token = localStorage.getItem("merchantToken");
    axios
      .post(`${API_URL}/merchant/plan/subscription_plan_edit`, f, {
        headers: {
          Authorization: `${token}`, // Bearer: ******
        },
      })
      .then((res) => {
        console.log("edit plan res: ", res);
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
          content: "Plan saved",
        });
      })
      .catch((err) => {
        console.log("edit plan err: ", err.message);
        messageApi.open({
          type: "error",
          content: err.message,
        });
        setErrMsg(err.message);
      });
      */
  };

  const bindAddon = () => {
    const token = localStorage.getItem("merchantToken");
    // const addonField = form.getFieldsValue(["addons"]);
    console.log("selectedAddon: ", selectedAddon);
    axios
      .post(
        `${API_URL}/merchant/plan/subscription_plan_addons_binding`,
        {
          planId: plan?.id,
          action: 0,
          addonIds: selectedAddon,
        },
        {
          headers: {
            Authorization: `${token}`, // Bearer: ******
          },
        }
      )
      .then((res) => {
        console.log("edit plan res: ", res);
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
          content: `Addons bound`,
        });
      })
      .catch((err) => {
        console.log("edit plan err: ", err.message);
        messageApi.open({
          type: "error",
          content: err.message,
        });
        setErrMsg(err.message);
      });
  };

  const onActivate = () => {
    const token = localStorage.getItem("merchantToken");
    axios
      .post(
        `${API_URL}/merchant/plan/subscription_plan_activate`,
        {
          planId: Number(params.planId),
        },
        {
          headers: {
            Authorization: `${token}`, // Bearer: ******
          },
        }
      )
      .then((res) => {
        console.log("plan activate res: ", res);
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
          content: "plan published",
        });
        setTimeout(() => {
          navigate(-1);
        }, 1200);
        // setPlan(res.data.data.Plan.plan);
      })
      .catch((err) => {
        console.log("plan activate err: ", err);
        messageApi.open({
          type: "error",
          content: err.message,
        });
        setErrMsg(err.message);
      });
  };

  useEffect(() => {
    console.log("params: ", params.planId, "//", typeof params.planId);
    if (isNaN(Number(params.planId))) {
      return;
    }
    const token = localStorage.getItem("merchantToken");
    axios
      .post(
        `${API_URL}/merchant/plan/subscription_plan_detail`,
        {
          planId: Number(params.planId),
        },
        {
          headers: {
            Authorization: `${token}`, // Bearer: ******
          },
        }
      )
      .then((res) => {
        console.log("plan detail res: ", res);
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
        setPlan(res.data.data.Plan.plan);
        setSelectedAddon(res.data.data.Plan.addons.map((a: any) => a.id));
      })
      .catch((err) => {
        console.log("get subscription list err: ", err);
        messageApi.open({
          type: "error",
          content: err.message,
        });
        setErrMsg(err.message);
      });

    axios
      .post(
        `${API_URL}/merchant/plan/subscription_plan_list`,
        {
          merchantId: 15621,
          type: 2, // get add-on list
          status: 2,
          // "currency": "usd",
          page: 0,
          count: 100,
        },
        {
          headers: {
            Authorization: `${token}`, // Bearer: ******
          },
        }
      )
      .then((res) => {
        console.log("addon plan list res: ", res);
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
        const addons = res.data.data.Plans.map((p: any) => p.plan);
        setAddons(addons);
      })
      .catch((err) => {
        console.log("get addon list err: ", err);
        messageApi.open({
          type: "error",
          content: err.message,
        });
        setErrMsg(err.message);
      });
  }, []);

  console.log("addons from bckedn: ", addons);

  return (
    <div>
      {contextHolder}
      {plan && (
        <Form
          form={form}
          onFinish={submitForm}
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 24 }}
          layout="horizontal"
          // disabled={componentDisabled}
          style={{ maxWidth: 600 }}
          initialValues={plan}
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

          <Form.Item label="Status" name="status">
            <span>{PLAN_STATUS[plan.status]}</span>
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
              disabled
              options={[
                { value: 1, label: "Main plan" },
                { value: 2, label: "Addon" },
              ]}
            />
          </Form.Item>

          {plan.type == 1 && (
            <Form.Item label="Add-ons" name="addons">
              <>
                <Select
                  mode="multiple"
                  allowClear
                  style={{ width: "100%" }}
                  value={selectedAddon}
                  onChange={(value) => {
                    console.log("on sleecgt change: ", setSelectedAddon(value));
                  }}
                  options={addons.map((a) => ({
                    label: a.planName,
                    value: a.id,
                  }))}
                />
                <Button type="link" onClick={bindAddon}>
                  bind
                </Button>
              </>
            </Form.Item>
          )}

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
          <div
            style={{ display: "flex", justifyContent: "center", gap: "18px" }}
          >
            <Button onClick={() => navigate(-1)}>Go back</Button>
            <Button
              type="primary"
              htmlType="submit"
              disabled={plan.status != 1}
            >
              Save
            </Button>
            <Button onClick={onActivate}>Publish</Button>
          </div>
          {/* </Form.Item>  */}
        </Form>
      )}
    </div>
  );
};

export default Index;
