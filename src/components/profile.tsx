import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Form, Input, Spin, Skeleton } from "antd";
import { message } from "antd";
import { LoadingOutlined, PlusOutlined } from "@ant-design/icons";
import {
  getMerchantInfoReq,
  updateMerchantInfoReq,
  uploadLogoReq,
} from "../requests";
import { TMerchantInfo } from "../shared.types";
import { emailValidate } from "../helpers";

const APP_PATH = import.meta.env.BASE_URL;

const Index = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false); // page loading/submitting
  const [uploading, setUploading] = useState(false); // logo upload
  const [logoUrl, setLogoUrl] = useState("");
  const [merchantInfo, setMerchantInfo] = useState<TMerchantInfo | null>(null);

  const relogin = () =>
    navigate(`${APP_PATH}login`, {
      state: { msg: "session expired, please re-login" },
    });

  const getInfo = async () => {
    setLoading(true);
    try {
      const res = await getMerchantInfoReq();
      setLoading(false);
      const statusCode = res.data.code;
      if (statusCode != 0) {
        statusCode == 61 && relogin();
        throw new Error(res.data.message);
      }
      setMerchantInfo(res.data.data.MerchantInfo);
      setLogoUrl(res.data.data.MerchantInfo.companyLogo);
    } catch (err) {
      setLoading(false);
      if (err instanceof Error) {
        console.log("err getting profile: ", err.message);
        message.error(err.message);
      } else {
        message.error("Unknown error");
      }
    }
  };

  const onFileUplaod = async (event: React.ChangeEvent<HTMLInputElement>) => {
    let file;
    if (event.target.files && event.target.files.length > 0) {
      file = event.target.files[0];
    }
    if (file == null) {
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      message.error("Max logo file size: 4M.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    try {
      const res = await uploadLogoReq(formData);
      setUploading(false);
      console.log("upload res: ", res);
      const statusCode = res.data.code;
      if (statusCode != 0) {
        statusCode == 61 && relogin();
        throw new Error(res.data.message);
      }
      const logoUrl = res.data.data.url;
      form.setFieldValue("companyLogo", logoUrl);
      setLogoUrl(logoUrl);
    } catch (err) {
      setUploading(false);
      if (err instanceof Error) {
        console.log("err uploading logo: ", err.message);
        message.error(err.message);
      } else {
        message.error("Unknown error");
      }
    }
  };

  const onSubmit = async () => {
    const info = form.getFieldsValue();
    const isInvalid = form.getFieldsError().some((f) => f.errors.length > 0);
    if (isInvalid) {
      return;
    }

    setUploading(true);
    try {
      const res = await updateMerchantInfoReq(info);
      console.log("update info res: ", res);
      setUploading(false);
      const statusCode = res.data.code;
      if (statusCode != 0) {
        statusCode == 61 && relogin();
        throw new Error(res.data.message);
      }
      message.success("Info Updated");
    } catch (err) {
      setUploading(false);
      if (err instanceof Error) {
        console.log("err getting profile: ", err.message);
        message.error(err.message);
      } else {
        message.error("Unknown error");
      }
    }
  };

  useEffect(() => {
    getInfo();
  }, []);

  return (
    <div>
      {loading ? (
        <Spin
          spinning={loading}
          indicator={
            <LoadingOutlined style={{ fontSize: 32, color: "#FFF" }} spin />
          }
          fullscreen
        />
      ) : (
        merchantInfo && (
          <Form
            form={form}
            onFinish={onSubmit}
            name="basic"
            labelCol={{
              span: 10,
            }}
            wrapperCol={{
              span: 16,
            }}
            style={{
              maxWidth: 600,
            }}
            initialValues={merchantInfo}
            autoComplete="off"
          >
            <Form.Item
              label="Company Name"
              name="companyName"
              rules={[
                {
                  required: true,
                  message: "Please input your company name!",
                },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Company Logo (< 4M)"
              name="companyLogo"
              rules={[
                {
                  required: true,
                  message: "Please upload your company logo! (Max size: 4M)",
                },
                ({ getFieldValue }) => ({
                  validator(rule, value) {
                    if (value != "") {
                      return Promise.resolve();
                    }
                    return Promise.reject();
                  },
                }),
              ]}
            >
              <label htmlFor="comapnyLogoURL" style={{ cursor: "pointer" }}>
                {logoUrl == "" ? (
                  <div style={{ width: "48px", height: "48px" }}>
                    <Skeleton.Image
                      active={uploading}
                      style={{ width: "48px", height: "48px" }}
                    />
                  </div>
                ) : (
                  <img src={logoUrl} style={{ maxWidth: "64px" }} />
                )}
              </label>
            </Form.Item>
            <input
              type="file"
              accept="image/png, image/gif, image/jpeg"
              onChange={onFileUplaod}
              id="comapnyLogoURL"
              name="comapnyLogoURL"
              style={{ display: "none" }}
            />

            <Form.Item
              label="Physical Address"
              name="address"
              rules={[
                {
                  required: true,
                  message: "Please input your company address!",
                },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[
                {
                  required: true,
                  message: "Please input your Email!",
                },
                ({ getFieldValue }) => ({
                  validator(rule, value) {
                    if (emailValidate(value)) {
                      return Promise.resolve();
                    }
                    return Promise.reject("Invalid email address");
                  },
                }),
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Phone"
              name="phone"
              rules={[
                {
                  required: true,
                  message: "Please input company phone!",
                },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              wrapperCol={{
                offset: 8,
                span: 16,
              }}
            >
              <Button
                type="primary"
                htmlType="submit"
                onClick={onSubmit}
                loading={loading}
                disabled={loading || uploading}
              >
                Submit
              </Button>
            </Form.Item>
          </Form>
        )
      )}
    </div>
  );
};

export default Index;
