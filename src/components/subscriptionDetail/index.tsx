import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Tabs } from "antd";
import type { TabsProps } from "antd";
import { IProfile } from "../../shared.types";
import UserAccount from "./userAccountTab";
import SubscriptionTab from "./subscriptionTab";
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
      children: "Content of invoices",
    },
    {
      key: "Payment",
      label: "Payment",
      children: "content of payment",
    },
  ];
  const onTabChange = (key: string) => {
    console.log(key);
  };
  return (
    <div style={{ display: "flex" }}>
      <div style={{ width: "80%" }}>
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
