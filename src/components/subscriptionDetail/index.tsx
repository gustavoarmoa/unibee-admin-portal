import React, { CSSProperties, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Col, Divider, Row, Tabs } from "antd";
import type { TabsProps } from "antd";
import { IProfile } from "../../shared.types";
import UserAccount from "./userAccountTab";
import SubscriptionTab from "./subscriptionTab";
import InvoiceTab from "./invoicesTab";
import AdminNote from "./adminNote";

const Index = () => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<IProfile | null>(null);

  const tabItems: TabsProps["items"] = [
    {
      key: "Subscription",
      label: "Subscription",
      children: <SubscriptionTab setUserProfile={setUserProfile} />,
    },
    {
      key: "Account",
      label: "Account",
      children: <UserAccount user={userProfile} />,
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
  const onTabChange = (key: string) => {
    // console.log(key);
  };
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
  if (user == null) {
    return null;
  }

  return (
    <div style={{ marginBottom: "24px" }}>
      <Divider orientation="left" style={{ margin: "16px 0" }}>
        User Info
      </Divider>
      <Row style={rowStyle}>
        <Col span={4}>
          <span style={{ fontWeight: "bold" }}>First name</span>
        </Col>
        <Col span={6}>{user?.firstName}</Col>
        <Col span={4}>
          <span style={{ fontWeight: "bold" }}>Last name</span>
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
        <Col span={6}>{user?.phone}</Col>
      </Row>
      <Row style={rowStyle}>
        <Col span={4}>
          <span style={{ fontWeight: "bold" }}>Country</span>
        </Col>
        <Col span={6}>{user?.countryName}</Col>
        <Col span={4}>
          <span style={{ fontWeight: "bold" }}>Billing address</span>
        </Col>
        <Col span={6}>{user?.address}</Col>
      </Row>
      <Row style={rowStyle}>
        <Col span={4}>
          <span style={{ fontWeight: "bold" }}>Payment method</span>
        </Col>
        <Col span={6}>{user?.paymentMethod}</Col>
        <Col span={4}>
          <span style={{ fontWeight: "bold" }}>VAT number</span>
        </Col>
        <Col span={6}>{user?.vATNumber}</Col>
      </Row>
    </div>
  );
};
