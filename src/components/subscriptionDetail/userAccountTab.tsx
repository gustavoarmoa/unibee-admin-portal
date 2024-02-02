import { Button, Form, Input, Radio, Select, message } from "antd";
import { useNavigate } from "react-router-dom";
import { Country, IProfile } from "../../shared.types";
import { useEffect, useState } from "react";
import {
  getCountryList,
  getUserProfile,
  saveUserProfile,
} from "../../requests";

const APP_PATH = import.meta.env.BASE_URL;

const UserAccountTab = ({
  user,
  setUserProfile,
}: {
  user: IProfile | null;
  setUserProfile: (u: IProfile) => void;
}) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [countryList, setCountryList] = useState<Country[]>([]);
  const [loading, setLoading] = useState(false);

  const relogin = () =>
    navigate(`${APP_PATH}login`, {
      state: { msg: "session expired, please re-login" },
    });

  const filterOption = (
    input: string,
    option?: { label: string; value: string }
  ) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  const onSave = async () => {
    const userProfile = form.getFieldsValue();

    const isInvalid = form.getFieldsError().some((f) => f.errors.length > 0);
    console.log("is invalid: ", isInvalid);
    if (isInvalid) {
      return;
    }
    console.log("form values: ", userProfile);
    setLoading(true);

    try {
      const saveProfileRes = await saveUserProfile(form.getFieldsValue());
      console.log("save profile res: ", saveProfileRes);
      const code = saveProfileRes.data.code;
      if (code != 0) {
        code == 61 && relogin();
        throw new Error(saveProfileRes.data.message);
      }
      message.success("User Info Saved");
      setUserProfile(userProfile);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      if (err instanceof Error) {
        console.log("profile update err: ", err.message);
        message.error(err.message);
      } else {
        message.error("Unknown error");
      }
      return;
    }
  };

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      let countryListRes;
      try {
        const res = ([countryListRes] = await Promise.all([
          getCountryList(15621),
        ]));
        console.log("country: ", countryListRes);
        res.forEach((r) => {
          const code = r.data.code;
          code == 61 && relogin(); // TODO: redesign the relogin component(popped in current page), so users don't have to be taken to /login
          if (code != 0) {
            // TODO: save all the code as ENUM in constant,
            throw new Error(r.data.message);
          }
        });
        setLoading(false);
      } catch (err) {
        setLoading(false);
        if (err instanceof Error) {
          console.log("profile update err: ", err.message);
          message.error(err.message);
        } else {
          message.error("Unknown error");
        }
        return;
      }
      setCountryList(
        countryListRes.data.data.vatCountryList.map((c: any) => ({
          code: c.countryCode,
          name: c.countryName,
        }))
      );
    };

    fetchData();
  }, []);

  const countryCode = Form.useWatch("countryCode", form);
  useEffect(() => {
    countryCode &&
      countryList.length > 0 &&
      form.setFieldValue(
        "countryName",
        countryList.find((c) => c.code == countryCode)!.name
      );
  }, [countryCode]);

  return (
    user != null && (
      <Form
        form={form}
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 24 }}
        layout="horizontal"
        onFinish={onSave}
        // disabled={componentDisabled}
        style={{ maxWidth: 600 }}
        initialValues={user}
      >
        <Form.Item label="id" name="id" hidden>
          <Input disabled />
        </Form.Item>
        <Form.Item label="countryName" name="countryName" hidden>
          <Input disabled />
        </Form.Item>

        <Form.Item
          label="First name"
          name="firstName"
          rules={[
            {
              required: true,
              message: "Please input your first name!",
            },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Last name"
          name="lastName"
          rules={[
            {
              required: true,
              message: "Please input your last name!",
            },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item label="Email" name="email">
          <Input disabled />
        </Form.Item>

        <Form.Item
          label="Billing address"
          name="address"
          rules={[
            {
              required: true,
              message: "Please input your billing address!",
            },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Country"
          name="countryCode"
          rules={[
            {
              required: true,
              message: "Please select your first country!",
            },
          ]}
        >
          <Select
            showSearch
            placeholder="Type to search"
            optionFilterProp="children"
            // value={country}
            // onChange={onCountryChange}
            // onSearch={onSearch}
            filterOption={filterOption}
            options={countryList.map((c) => ({
              label: c.name,
              value: c.code,
            }))}
          />
        </Form.Item>

        <Form.Item label="Country Name" name="countryName" hidden>
          <Input />
        </Form.Item>

        <Form.Item label="Company name" name="companyName">
          <Input />
        </Form.Item>

        <Form.Item label="VAT number" name="vATNumber">
          <Input />
        </Form.Item>

        <Form.Item label="Phone number" name="mobile">
          <Input />
        </Form.Item>

        <Form.Item label="Telegram" name="telegram">
          <Input />
        </Form.Item>

        <Form.Item label="WhatsApp" name="whatsAPP">
          <Input />
        </Form.Item>

        <Form.Item label="WeChat" name="weChat">
          <Input />
        </Form.Item>

        <Form.Item label="LinkedIn" name="linkedIn">
          <Input />
        </Form.Item>

        <Form.Item label="Facebook" name="facebook">
          <Input />
        </Form.Item>

        <Form.Item label="TikTok" name="tikTok">
          <Input />
        </Form.Item>

        <Form.Item label="Other social info" name="otherSocialInfo">
          <Input />
        </Form.Item>

        <Form.Item label="Payment methods" name="paymentMethod">
          <Radio.Group>
            <Radio value="CreditCard">Credit Card</Radio>
            <Radio value="Crypto">Crypto</Radio>
            <Radio value="PayPal">PayPal</Radio>
            <Radio value="WireTransfer">Wire Transfer</Radio>
          </Radio.Group>
        </Form.Item>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            margin: "36px",
          }}
        >
          <Button type="primary" onClick={onSave} disabled={loading}>
            Save
          </Button>
        </div>
      </Form>
    )
  );
};

export default UserAccountTab;
