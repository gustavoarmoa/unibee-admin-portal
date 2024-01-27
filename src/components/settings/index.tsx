import React, { CSSProperties, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Col, Divider, Row, Tabs } from "antd";
import type { TabsProps } from "antd";
import { Checkbox } from "antd";
import type { CheckboxProps } from "antd";
import { IProfile } from "../../shared.types";

type TPermission = {
  appConfig: { read: boolean; write: boolean };
  emailTemplate: { read: boolean; write: boolean };
  invoiceTemplate: { read: boolean; write: boolean };
  plan: { read: boolean; write: boolean };
  subscription: { read: boolean; write: boolean };
  invoice: { read: boolean; write: boolean; generate: boolean };
  accountData: {
    read: boolean;
    write: boolean;
    invite: boolean;
    permissionSetting: boolean;
  };
  customerData: { read: boolean; write: boolean };
  analytic: { read: boolean; export: boolean };
};

const roles = [
  "App Owner",
  "Admin",
  "Power User",
  "Finance",
  "Customer Support",
] as const; // to mark it readonly
type TRoles = (typeof roles)[number]; // APP Owner | Admin | *** |

const role: Record<TRoles, TPermission> = {
  "App Owner": {
    appConfig: { read: true, write: true },
    emailTemplate: { read: true, write: true },
    invoiceTemplate: { read: true, write: true },
    plan: { read: true, write: true },
    subscription: { read: true, write: true },
    invoice: { read: true, write: true, generate: true },
    accountData: {
      read: true,
      write: true,
      invite: true,
      permissionSetting: true,
    },
    customerData: { read: true, write: true },
    analytic: { read: true, export: true },
  },
  Admin: {
    appConfig: { read: true, write: true },
    emailTemplate: { read: true, write: true },
    invoiceTemplate: { read: true, write: true },
    plan: { read: true, write: true },
    subscription: { read: true, write: true },
    invoice: { read: true, write: true, generate: true },
    accountData: {
      read: true,
      write: true,
      invite: false,
      permissionSetting: true,
    },
    customerData: { read: true, write: true },
    analytic: { read: true, export: true },
  },
  "Power User": {
    appConfig: { read: false, write: false },
    emailTemplate: { read: true, write: true },
    invoiceTemplate: { read: true, write: true },
    plan: { read: true, write: true },
    subscription: { read: true, write: true },
    invoice: { read: true, write: true, generate: true },
    accountData: {
      read: true,
      write: true,
      invite: true,
      permissionSetting: true,
    },
    customerData: { read: true, write: true },
    analytic: { read: true, export: false },
  },
  Finance: {
    appConfig: { read: false, write: false },
    emailTemplate: { read: true, write: false },
    invoiceTemplate: { read: true, write: false },
    plan: { read: true, write: false },
    subscription: { read: true, write: false },
    invoice: { read: true, write: true, generate: true },
    accountData: {
      read: false,
      write: false,
      invite: false,
      permissionSetting: false,
    },
    customerData: { read: true, write: false },
    analytic: { read: true, export: true },
  },
  "Customer Support": {
    appConfig: { read: false, write: false },
    emailTemplate: { read: true, write: false },
    invoiceTemplate: { read: true, write: false },
    plan: { read: true, write: false },
    subscription: { read: true, write: false },
    invoice: { read: true, write: false, generate: true },
    accountData: {
      read: false,
      write: false,
      invite: false,
      permissionSetting: false,
    },
    customerData: { read: true, write: false },
    analytic: { read: false, export: false },
  },
};

// role: App Owner, Admin, Power User, Customer Support, Finance,

const Index = () => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<IProfile | null>(null);

  const tabItems: TabsProps["items"] = [
    {
      key: "AppConfig",
      label: "App Config",
      children: "App config",
    },
    {
      key: "emailTemplate",
      label: "Email Template",
      children: "email template",
    },
    {
      key: "invoiceTemplate",
      label: "Invoice Template",
      children: "invoice template",
    },
    {
      key: "permission",
      label: "Permission and Roles",
      children: <PermissionTab />,
    },
  ];
  const onTabChange = (key: string) => {
    // console.log(key);
  };

  const x: keyof TPermission = "appConfig";
  // const allPerm = Object.keys()

  console.log("key of : ", x);

  return (
    <div style={{ width: "100%" }}>
      <Tabs
        defaultActiveKey="AppConfig"
        items={tabItems}
        onChange={onTabChange}
      />
    </div>
  );
};

export default Index;

const PermissionTab = () => (
  <div style={{ width: "calc(100vw - 300px)", overflowX: "auto" }}>
    <Row
      // gutter={[32, 32]}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        textAlign: "center",
        margin: "24px 0",
      }}
    >
      <Col span={2} style={{ fontWeight: "bold" }}>
        Roles
      </Col>
      <Col span={2} style={{ fontWeight: "bold" }}>
        App Config
      </Col>
      <Col span={2} style={{ fontWeight: "bold" }}>
        Email template
      </Col>
      <Col span={2} style={{ fontWeight: "bold" }}>
        Invoice Template
      </Col>
      <Col span={2} style={{ fontWeight: "bold" }}>
        Plans
      </Col>
      <Col span={2} style={{ fontWeight: "bold" }}>
        Subscription
      </Col>
      <Col span={2} style={{ fontWeight: "bold" }}>
        Invoice
      </Col>
      <Col span={2} style={{ fontWeight: "bold" }}>
        Account
      </Col>
      <Col span={2} style={{ fontWeight: "bold" }}>
        Customer
      </Col>
      <Col span={2} style={{ fontWeight: "bold" }}>
        Analytics
      </Col>
    </Row>
    {roles.map((r) => (
      <div key={r}>
        <Row
          // gutter={[32, 128]}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignContent: "center",
          }}
        >
          <Col span={2}>{r}</Col>
          <Col span={2}>
            <Checkbox defaultChecked={role[r].appConfig.read}>Read</Checkbox>
            <Checkbox defaultChecked={role[r].appConfig.write}>Write</Checkbox>
          </Col>
          <Col span={2}>
            <Checkbox defaultChecked={role[r].emailTemplate.read}>
              Read
            </Checkbox>
            <Checkbox defaultChecked={role[r].emailTemplate.write}>
              Write
            </Checkbox>
          </Col>
          <Col span={2}>
            <Checkbox defaultChecked={role[r].invoiceTemplate.read}>
              Read
            </Checkbox>
            <Checkbox defaultChecked={role[r].invoiceTemplate.write}>
              Write
            </Checkbox>
          </Col>
          <Col span={2}>
            <Checkbox defaultChecked={role[r].plan.read}>Read</Checkbox>
            <Checkbox defaultChecked={role[r].plan.write}>Write</Checkbox>
          </Col>
          <Col span={2}>
            <Checkbox defaultChecked={role[r].subscription.read}>Read</Checkbox>
            <Checkbox defaultChecked={role[r].subscription.write}>
              Write
            </Checkbox>
          </Col>
          <Col span={2}>
            <Checkbox defaultChecked={role[r].invoice.read}>Read</Checkbox>
            <Checkbox defaultChecked={role[r].invoice.write}>Write</Checkbox>
            <Checkbox defaultChecked={role[r].invoice.generate}>
              Generate
            </Checkbox>
          </Col>
          <Col span={2}>
            <Checkbox defaultChecked={role[r].accountData.write}>Read</Checkbox>
            <Checkbox defaultChecked={role[r].accountData.read}>Write</Checkbox>
            <Checkbox defaultChecked={role[r].accountData.invite}>
              Invite
            </Checkbox>
            <Checkbox defaultChecked={role[r].accountData.permissionSetting}>
              set Permission
            </Checkbox>
          </Col>
          <Col span={2}>
            <Checkbox defaultChecked={role[r].customerData.read}>Read</Checkbox>
            <Checkbox defaultChecked={role[r].customerData.write}>
              Write
            </Checkbox>
          </Col>
          <Col span={2}>
            <Checkbox defaultChecked={role[r].analytic.read}>Read</Checkbox>
            <Checkbox defaultChecked={role[r].analytic.export}>Export</Checkbox>
          </Col>
        </Row>
        <Divider />
      </div>
    ))}
    <div style={{ display: "flex", justifyContent: "end", gap: "16px" }}>
      <Button>Add New Role</Button>
      <Button>Apply Change</Button>
      <Button>Reset to Default</Button>
    </div>
  </div>
);

/**
 *  appConfig: { read: boolean; write: boolean };
  emailTemplate: { read: boolean; write: boolean };
  invoiceTemplate: { read: boolean; write: boolean };
  plan: { read: boolean; write: boolean };
  subscription: { read: boolean; write: boolean };
  invoice: { read: boolean; write: boolean; generate: boolean };
  accountData: {
    read: boolean;
    write: boolean;
    invite: boolean;
    permissionSetting: boolean;
  };
  customerData: { read: boolean; write: boolean };
  analytic: { read: boolean; export: boolean };
 */
