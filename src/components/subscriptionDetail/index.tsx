import React, { CSSProperties, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Col, Divider, Row, Tabs, message } from "antd";
import type { TabsProps } from "antd";
import { IProfile } from "../../shared.types";
import UserAccount from "./userAccountTab";
import SubscriptionTab from "./subscriptionTab";
import InvoiceTab from "./invoicesTab";
import AdminNote from "./adminNote";
import { getUserProfile } from "../../requests";

const APP_PATH = import.meta.env.BASE_URL;

const Index = () => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<IProfile | null>(null);
  const [userId, setUserId] = useState<number | null>(null); // subscription obj has user profile data, but admin can update user profile in AccountTab.
  // so the data on subscription obj might be obsolete,
  // so I just use userId from subscription Obj, use this userId to run getUserProfile(userId), even after admin update the user info AccontTab, re-call getUserProfile
  const relogin = () =>
    navigate(`${APP_PATH}login`, {
      state: { msg: "session expired, please re-login" },
    });

  const tabItems: TabsProps["items"] = [
    {
      key: "Subscription",
      label: "Subscription",
      children: <SubscriptionTab setUserId={setUserId} />,
    },
    {
      key: "Account",
      label: "Account",
      children: (
        <UserAccount user={userProfile} setUserProfile={setUserProfile} />
      ),
    },
    {
      key: "Invoices",
      label: "Invoices",
      children: <InvoiceTab user={userProfile} />,
    },
    {
      key: "Payment",
      label: "Payment",
      children: "content of payment",
    },
  ];
  const onTabChange = (key: string) => {};

  const fetchUserProfile = async () => {
    try {
      const res = await getUserProfile(userId as number);
      console.log("res getting user profile: ", res);
      const code = res.data.code;
      code == 61 && relogin(); // TODO: redesign the relogin component(popped in current page), so users don't have to be taken to /login
      if (code != 0) {
        throw new Error(res.data.message);
      }
      setUserProfile(res.data.data.User);
    } catch (err) {
      // setLoading(false);
      if (err instanceof Error) {
        console.log("profile update err: ", err.message);
        message.error(err.message);
      } else {
        message.error("Unknown error");
      }
    }
  };

  useEffect(() => {
    if (userId == null) {
      return;
    }
    fetchUserProfile();
  }, [userId]);

  return (
    <div style={{ display: "flex" }}>
      <div style={{ width: "80%" }}>
        <UserInfoSection user={userProfile} />
        <Tabs defaultActiveKey="1" items={tabItems} onChange={onTabChange} />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginTop: "64px",
          }}
        >
          <Button onClick={() => navigate(-1)}>Back</Button>
        </div>
      </div>
      <AdminNote />
    </div>
  );
};

export default Index;

const rowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  height: "24px",
  color: "#757575",
};
const UserInfoSection = ({ user }: { user: IProfile | null }) => {
  const [loading, setLoading] = useState(false);
  //  const [user, setUser] = useState<IProfile | null>(null)
  /* 
 if (user == null) {
    return null;
  }
*/

  useEffect(() => {}, []);

  return (
    <div style={{ marginBottom: "24px" }}>
      <Divider orientation="left" style={{ margin: "16px 0" }}>
        User Info
      </Divider>
      <Row style={rowStyle}>
        <Col span={4}>
          <span style={{ fontWeight: "bold" }}>First Name</span>
        </Col>
        <Col span={6}>{user?.firstName}</Col>
        <Col span={4}>
          <span style={{ fontWeight: "bold" }}>Last Name</span>
        </Col>
        <Col span={6}>{user?.lastName}</Col>
      </Row>
      <Row style={rowStyle}>
        <Col span={4}>
          <span style={{ fontWeight: "bold" }}>Email</span>
        </Col>
        <Col span={6}>
          <a href={user?.email}>{user?.email} </a>
        </Col>
        <Col span={4}>
          <span style={{ fontWeight: "bold" }}>Phone</span>
        </Col>
        <Col span={6}>{user?.mobile}</Col>
      </Row>
      <Row style={rowStyle}>
        <Col span={4}>
          <span style={{ fontWeight: "bold" }}>Country</span>
        </Col>
        <Col span={6}>{user?.countryName}</Col>
        <Col span={4}>
          <span style={{ fontWeight: "bold" }}>Billing Address</span>
        </Col>
        <Col span={6}>{user?.address}</Col>
      </Row>
      <Row style={rowStyle}>
        <Col span={4}>
          <span style={{ fontWeight: "bold" }}>Payment Method</span>
        </Col>
        <Col span={6}>{user?.paymentMethod}</Col>
        <Col span={4}>
          <span style={{ fontWeight: "bold" }}>VAT Number</span>
        </Col>
        <Col span={6}>{user?.vATNumber}</Col>
      </Row>
    </div>
  );
};
