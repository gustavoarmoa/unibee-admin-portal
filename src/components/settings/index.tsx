import type { CheckboxProps, TabsProps } from 'antd';
import {
  Button,
  Checkbox,
  Col,
  Divider,
  Input,
  Modal,
  Row,
  Table,
  Tabs,
} from 'antd';
import { ColumnsType } from 'antd/es/table';
import React, { CSSProperties, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useNavigate } from 'react-router-dom';
import '../../shared.css';
import { IProfile } from '../../shared.types';
import WebhookList from './webhookList';

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
  'Owner',
  'Admin',
  'Power User',
  'Finance',
  'Customer Support',
] as const; // to mark it readonly
type TRoles = (typeof roles)[number]; // APP Owner | Admin | *** |

const role: Record<TRoles, TPermission> = {
  Owner: {
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
  'Power User': {
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
  'Customer Support': {
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

  const tabItems: TabsProps['items'] = [
    {
      key: 'AppConfig',
      label: 'App Config',
      children: <AppConfig />,
    },
    {
      key: 'emailTemplate',
      label: 'Email Template',
      children: <EmailTemplate />,
    },
    {
      key: 'invoiceTemplate',
      label: 'Invoice Template',
      children: 'invoice template',
    },
    {
      key: 'permission',
      label: 'Permission and Roles',
      children: <PermissionTab />,
    },
    {
      key: 'webhook',
      label: 'Webhook',
      children: <WebhookList />,
    },
  ];
  const onTabChange = (key: string) => {
    // console.log(key);
  };

  // const x: keyof TPermission = "appConfig";
  // const allPerm = Object.keys()

  // console.log("key of : ", x);

  return (
    <div style={{ width: '100%' }}>
      <Tabs
        defaultActiveKey="AppConfig"
        items={tabItems}
        onChange={onTabChange}
      />
    </div>
  );
};

export default Index;

const AppConfig = () => {
  return (
    <div style={{ margin: '32px 0' }}>
      <Row gutter={[16, 32]} style={{ marginBottom: '16px' }}>
        <Col span={4}>Stripe App Key</Col>
        <Col span={12}>
          <Input.Password
            defaultValue={'1234567890-abcdefghijklmnopq'}
            style={{ width: '80%' }}
          />
        </Col>
        <Col span={4}>
          <Button>Save</Button>
        </Col>
      </Row>
      <Row gutter={[16, 32]} style={{ marginBottom: '16px' }}>
        <Col span={4}>SendGrid Email Key</Col>
        <Col span={12}>
          <Input.Password
            defaultValue={'1234567890-abcdefghijklmnopq'}
            style={{ width: '80%' }}
          />
        </Col>
        <Col span={4}>
          <Button>Save</Button>
        </Col>
      </Row>
      <Row gutter={[16, 32]} style={{ marginBottom: '16px' }}>
        <Col span={4}>VAT Sense Key</Col>
        <Col span={12}>
          <Input.Password
            defaultValue={'1234567890-abcdefghijklmnopq'}
            style={{ width: '80%' }}
          />
        </Col>
        <Col span={4}>
          <Button>Save</Button>
        </Col>
      </Row>
    </div>
  );
};

type TEmailTmpl = {
  id: number;
  name: string;
  description: string;
  status: string;
  createdBy: string;
  updatedAt: string;
};

const RAW_TEXT2 = ' <ol><li>a</li><li>b</li><li>c</li></ol>';
const RAW_TEXT = `
<p>
Dear [customer.name]:
</p>
<p><br></p>
<p>
Congratulation on your successful subscription on our Premium plan. Your benefits include:
</p>
<p><br></p>
<p><br></p>
<ul>
<li>Local and cloud stored browser profiles</li>
<li>Mimic and Stealthfox privacy browsers</li>
<li>Custom browser fingerprint based on real-user data</li>
<li>Easy proxy integration and verification</li>
<li>Open API and knowledge center</li>
<li>Browser automation with Playwright (Mimic only), Selenium Hardened, and Puppeteer Hardened</li>
<li>10 Team member seats</li><li>Advanced team management</li>
<li>Profile sharing24/7 in-app live chat and email support</li>
</ul>
<p><br></p>
<p><br></p>
<p>Your subscription fee will be charged on every [intervalCount] [intervalUnit] with [subscription.currency] [subscription.amount].</p>
<p><br></p>
`;
const PreviewText = () => (
  <>
    <p>Dear [customer.name]:</p>
    <p>
      Congratulation on your successful subscription on our Premium plan. Your
      benefits include:
    </p>
    <ul>
      <li>Local and cloud stored browser profiles</li>
      <li>Mimic and Stealthfox privacy browsers</li>
      <li>Custom browser fingerprint based on real-user data</li>
      <li>Easy proxy integration and verification</li>
      <li>Open API and knowledge center</li>
      <li>
        Browser automation with Playwright (Mimic only), Selenium Hardened, and
        Puppeteer Hardened
      </li>
      <li>10 Team member seats</li>
      <li>Advanced team management</li>
      <li>Profile sharing</li>
      <li>24/7 in-app live chat and email support</li>
    </ul>
    <p>
      <br />
    </p>
    <p>
      Your subscription fee will be charged on every [intervalCount]
      [intervalUnit] with [subscription.amount].
    </p>
    <p>
      <br />
    </p>
  </>
);
const EditTemplate = () => {
  const [value, setValue] = useState(RAW_TEXT);
  const onTextChange = (content: string) => {
    setValue(content);
  };
  // console.log("txt: ", value);
  return (
    <div>
      <ReactQuill theme="snow" value={value} onChange={onTextChange} />
    </div>
  );
};

const PreviewTemplate = () => {
  return <PreviewText />;
};

const EmailTemplate = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [tabKey, setTabKey] = useState('Edit');
  const toggleModal = () => setModalOpen(!modalOpen);

  const tabItems: TabsProps['items'] = [
    {
      key: 'Edit',
      label: 'Edit',
      children: <EditTemplate />,
    },
    {
      key: 'Preview',
      label: 'Preview',
      children: <PreviewTemplate />,
    },
  ];
  const onTabChange = (key: string) => {
    setTabKey(key);
  };

  const columns: ColumnsType<TEmailTmpl> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      // render: (text) => <a>{text}</a>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Updated at',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (d, plan) => new Date(d).toLocaleDateString(),
    },
    {
      title: 'Created by',
      dataIndex: 'createdBy',
      key: 'createdBy',
    },
  ];
  const data: TEmailTmpl[] = [
    {
      id: 1,
      name: 'login via OTP',
      description: 'send OTP in email',
      status: 'Active',
      updatedAt: '2024-02-01',
      createdBy: 'Admin',
    },
    {
      id: 2,
      name: 'signup email confirm',
      description: 'signup email confirm',
      status: 'Active',
      updatedAt: '2024-02-01',
      createdBy: 'Admin',
    },
    {
      id: 3,
      name: 'reset password',
      description: 'reset password',
      status: 'Active',
      updatedAt: '2024-02-01',
      createdBy: 'Admin',
    },
    {
      id: 4,
      name: 'Successful subscription',
      description: 'Subscription with successful payment',
      status: 'Active',
      updatedAt: '2024-02-01',
      createdBy: 'Admin',
    },
    {
      id: 5,
      name: 'Reminder to charge subscription fee',
      description: 'Reminder to charge subscription fee',
      status: 'Active',
      updatedAt: '2024-02-01',
      createdBy: 'Admin',
    },
    {
      id: 6,
      name: 'Subscription with pending payment',
      description: 'Subscription with pending payment',
      status: 'Active',
      updatedAt: '2024-02-01',
      createdBy: 'Admin',
    },
    {
      id: 7,
      name: 'Subscription with failed payment',
      description: 'Subscription with failed payment',
      status: 'Active',
      updatedAt: '2024-02-01',
      createdBy: 'Admin',
    },
    {
      id: 8,
      name: 'Subscription fee charged successfully',
      description: 'Subscription fee charged successfully',
      status: 'Active',
      updatedAt: '2024-02-01',
      createdBy: 'Admin',
    },
    {
      id: 9,
      name: 'Fail to charge subscription fee',
      description: 'Fail to charge subscription fee',
      status: 'Active',
      updatedAt: '2024-02-01',
      createdBy: 'Admin',
    },
    {
      id: 10,
      name: 'Invoice delivered',
      description: 'Invoice delivered',
      status: 'Active',
      updatedAt: '2024-02-01',
      createdBy: 'Admin',
    },
    {
      id: 11,
      name: 'Subscription plan upgraded',
      description: 'Subscription plan upgraded',
      status: 'Active',
      updatedAt: '2024-02-01',
      createdBy: 'Admin',
    },
    {
      id: 12,
      name: 'Subscription plan downgraded',
      description: 'Subscription plan downgraded',
      status: 'Active',
      updatedAt: '2024-02-01',
      createdBy: 'Admin',
    },
    {
      id: 13,
      name: 'Subscription due date extended',
      description: 'Subscription due date extended by *** days to ****-**-**',
      status: 'Active',
      updatedAt: '2024-02-01',
      createdBy: 'Admin',
    },
    {
      id: 14,
      name: 'Subscription cancelled',
      description: 'Subscription cancelled',
      status: 'Active',
      updatedAt: '2024-02-01',
      createdBy: 'Admin',
    },
    {
      id: 15,
      name: 'Subscription resumed',
      description: 'Subscription resumed',
      status: 'Active',
      updatedAt: '2024-02-01',
      createdBy: 'Admin',
    },
  ];
  return (
    <div>
      <Modal
        title="Email Template"
        open={modalOpen}
        width={'720px'}
        footer={null}
        closeIcon={null}
      >
        <Tabs activeKey={tabKey} items={tabItems} onChange={onTabChange} />

        <div
          style={{
            display: 'flex',
            justifyContent: 'end',
            alignItems: 'center',
            gap: '18px',
            marginTop: '24px',
          }}
        >
          <Button onClick={toggleModal}>Close</Button>
          <Button onClick={toggleModal}>Make it Default</Button>
          <Button type="primary" onClick={toggleModal}>
            Save
          </Button>
        </div>
      </Modal>
      <Table
        columns={columns}
        dataSource={data}
        rowKey={'id'}
        rowClassName="clickable-tbl-row"
        pagination={false}
        onRow={(user, rowIndex) => {
          return {
            onClick: (event) => {
              // console.log("row click: ", user, "///", rowIndex);
              toggleModal();
            },
          };
        }}
      />
    </div>
  );
};

const PermissionTab = () => (
  <div style={{ width: 'calc(100vw - 300px)', overflowX: 'auto' }}>
    <Row
      // gutter={[32, 32]}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        textAlign: 'center',
        margin: '24px 0',
      }}
    >
      <Col span={2} style={{ fontWeight: 'bold' }}>
        Roles
      </Col>
      <Col span={2} style={{ fontWeight: 'bold' }}>
        App Config
      </Col>
      <Col span={2} style={{ fontWeight: 'bold' }}>
        Email template
      </Col>
      <Col span={2} style={{ fontWeight: 'bold' }}>
        Invoice Template
      </Col>
      <Col span={2} style={{ fontWeight: 'bold' }}>
        Plans
      </Col>
      <Col span={2} style={{ fontWeight: 'bold' }}>
        Subscription
      </Col>
      <Col span={2} style={{ fontWeight: 'bold' }}>
        Invoice
      </Col>
      <Col span={2} style={{ fontWeight: 'bold' }}>
        Account
      </Col>
      <Col span={2} style={{ fontWeight: 'bold' }}>
        Customer
      </Col>
      <Col span={2} style={{ fontWeight: 'bold' }}>
        Analytics
      </Col>
    </Row>
    <div
      style={{
        height: 'calc(100vh - 410px)',
        overflowY: 'auto',
        marginBottom: '16px',
      }}
    >
      {roles.map((r) => (
        <div key={r}>
          <Row
            // gutter={[32, 128]}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignContent: 'center',
            }}
          >
            <Col span={2}>{r}</Col>
            <Col span={2}>
              <Checkbox
                disabled={r == 'Owner'}
                defaultChecked={role[r].appConfig.read}
              >
                Read
              </Checkbox>
              <Checkbox
                disabled={r == 'Owner'}
                defaultChecked={role[r].appConfig.write}
              >
                Write
              </Checkbox>
            </Col>
            <Col span={2}>
              <Checkbox
                disabled={r == 'Owner'}
                defaultChecked={role[r].emailTemplate.read}
              >
                Read
              </Checkbox>
              <Checkbox
                disabled={r == 'Owner'}
                defaultChecked={role[r].emailTemplate.write}
              >
                Write
              </Checkbox>
            </Col>
            <Col span={2}>
              <Checkbox
                disabled={r == 'Owner'}
                defaultChecked={role[r].invoiceTemplate.read}
              >
                Read
              </Checkbox>
              <Checkbox
                disabled={r == 'Owner'}
                defaultChecked={role[r].invoiceTemplate.write}
              >
                Write
              </Checkbox>
            </Col>
            <Col span={2}>
              <Checkbox
                disabled={r == 'Owner'}
                defaultChecked={role[r].plan.read}
              >
                Read
              </Checkbox>
              <Checkbox
                disabled={r == 'Owner'}
                defaultChecked={role[r].plan.write}
              >
                Write
              </Checkbox>
            </Col>
            <Col span={2}>
              <Checkbox
                disabled={r == 'Owner'}
                defaultChecked={role[r].subscription.read}
              >
                Read
              </Checkbox>
              <Checkbox
                disabled={r == 'Owner'}
                defaultChecked={role[r].subscription.write}
              >
                Write
              </Checkbox>
            </Col>
            <Col span={2}>
              <Checkbox
                disabled={r == 'Owner'}
                defaultChecked={role[r].invoice.read}
              >
                Read
              </Checkbox>
              <Checkbox
                disabled={r == 'Owner'}
                defaultChecked={role[r].invoice.write}
              >
                Write
              </Checkbox>
              <Checkbox
                disabled={r == 'Owner'}
                defaultChecked={role[r].invoice.generate}
              >
                Generate
              </Checkbox>
            </Col>
            <Col span={2}>
              <Checkbox
                disabled={r == 'Owner'}
                defaultChecked={role[r].accountData.write}
              >
                Read
              </Checkbox>
              <Checkbox
                disabled={r == 'Owner'}
                defaultChecked={role[r].accountData.read}
              >
                Write
              </Checkbox>
              <Checkbox
                disabled={r == 'Owner'}
                defaultChecked={role[r].accountData.invite}
              >
                Invite
              </Checkbox>
              <Checkbox
                disabled={r == 'Owner'}
                defaultChecked={role[r].accountData.permissionSetting}
              >
                set Permission
              </Checkbox>
            </Col>
            <Col span={2}>
              <Checkbox
                disabled={r == 'Owner'}
                defaultChecked={role[r].customerData.read}
              >
                Read
              </Checkbox>
              <Checkbox
                disabled={r == 'Owner'}
                defaultChecked={role[r].customerData.write}
              >
                Write
              </Checkbox>
            </Col>
            <Col span={2}>
              <Checkbox
                disabled={r == 'Owner'}
                defaultChecked={role[r].analytic.read}
              >
                Read
              </Checkbox>
              <Checkbox
                disabled={r == 'Owner'}
                defaultChecked={role[r].analytic.export}
              >
                Export
              </Checkbox>
            </Col>
          </Row>
          <Divider />
        </div>
      ))}
    </div>
    <div style={{ display: 'flex', justifyContent: 'end', gap: '16px' }}>
      <Button>Add New Role</Button>
      <Button>Apply Change</Button>
      <Button>Reset to Default</Button>
    </div>
  </div>
);
