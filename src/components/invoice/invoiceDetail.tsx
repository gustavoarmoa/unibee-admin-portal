import { LoadingOutlined } from '@ant-design/icons';
import type { RadioChangeEvent, TabsProps } from 'antd';
import {
  Button,
  Checkbox,
  Col,
  Form,
  Input,
  Radio,
  Row,
  Spin,
  Tabs,
  message,
} from 'antd';
import React, { CSSProperties, ChangeEvent, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { INVOICE_STATUS } from '../../constants';
import { showAmount } from '../../helpers';
import { useRelogin } from '../../hooks';
import { getInvoiceDetailReq } from '../../requests';
import { IProfile, UserInvoice } from '../../shared.types';
import UserInfo from '../shared/userInfo';
import UserAccount from '../subscription/userAccountTab';

const APP_PATH = import.meta.env.BASE_URL; // if not specified in build command, default is /
const API_URL = import.meta.env.VITE_API_URL;
const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  height: '32px',
};
const colStyle: CSSProperties = { fontWeight: 'bold' };

const Index = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [invoiceDetail, setInvoiceDetail] = useState<UserInvoice | null>(null);
  const [userProfile, setUserProfile] = useState<IProfile | null>(null);

  const goBack = () => navigate(`${APP_PATH}invoice/list`);
  const goToUser = (userId: number) => () =>
    navigate(`${APP_PATH}customer/${userId}`);
  const goToSub = (subId: string) => () =>
    navigate(`${APP_PATH}subscription/${subId}`);
  const relogin = useRelogin();

  const tabItems: TabsProps['items'] = [
    {
      key: 'detail',
      label: 'Detail',
      children: 'subscription detail',
      // <SubscriptionTab setUserId={setUserId} />,
    },
    {
      key: 'subscription',
      label: 'Subscription',
      children: 'invoice detail',
      // <InvoiceTab user={userProfile} />,
    },
    {
      key: 'Account',
      label: 'User Account',
      children: (
        <UserAccount user={userProfile} setUserProfile={setUserProfile} />
      ),
    },
    {
      key: 'Payment',
      label: 'Payment',
      children: 'content of payment',
    },
  ];
  const onTabChange = (key: string) => {};

  const fetchData = async () => {
    // const subId = location.state && location.state.subscriptionId;
    const pathName = window.location.pathname.split('/');
    console.log('path name: ', pathName);
    const ivId = pathName.pop();
    if (ivId == null) {
      // TODO: show page not exist, OR invalid subscription
      return;
    }
    setLoading(true);
    try {
      const res = await getInvoiceDetailReq(ivId);
      setLoading(false);
      console.log('iv detail of ', ivId, ': ', res);
      const code = res.data.code;
      code == 61 && relogin();
      if (code != 0) {
        throw new Error(res.data.message);
      }
      setInvoiceDetail(res.data.data.Invoice);
      setUserProfile(res.data.data.userAccount);
    } catch (err) {
      setLoading(false);
      if (err instanceof Error) {
        console.log('get invoice detail err: ', err.message);
        message.error(err.message);
      } else {
        message.error('Unknown error');
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      <Spin
        spinning={loading}
        indicator={
          <LoadingOutlined style={{ fontSize: 32, color: '#FFF' }} spin />
        }
        fullscreen
      />
      <Row style={rowStyle} gutter={[16, 16]}>
        <Col span={4} style={colStyle}>
          Invoice Id
        </Col>
        <Col span={6}>{invoiceDetail?.invoiceId}</Col>
        <Col span={4} style={colStyle}>
          Invoice Name
        </Col>
        <Col span={6}>{invoiceDetail?.invoiceName}</Col>
      </Row>
      <Row style={rowStyle} gutter={[16, 16]}>
        <Col span={4} style={colStyle}>
          Invoice Amount
        </Col>
        <Col span={6}>
          {invoiceDetail == null
            ? ''
            : showAmount(invoiceDetail?.totalAmount, invoiceDetail?.currency)}
          <span>
            {invoiceDetail == null
              ? ''
              : ` (${invoiceDetail.taxScale / 100}% tax incl)`}
          </span>
        </Col>
        <Col span={4} style={colStyle}>
          Status
        </Col>
        <Col span={6}>
          {invoiceDetail == null ? '' : INVOICE_STATUS[invoiceDetail.status]}
        </Col>
      </Row>
      <Row style={rowStyle} gutter={[16, 16]}>
        <Col span={4} style={colStyle}>
          User Id
        </Col>
        <Col span={6}>
          <span
            className="cursor-pointer text-blue-600"
            onClick={goToUser(invoiceDetail?.userId as number)}
          >
            {invoiceDetail?.userId}
          </span>
        </Col>
        <Col span={4} style={colStyle}>
          Subscription Id
        </Col>
        <Col span={6}>
          {' '}
          {invoiceDetail == null ||
          invoiceDetail.subscriptionId == null ||
          invoiceDetail.subscriptionId == '' ? null : (
            <span
              className="cursor-pointer text-blue-600"
              onClick={goToSub(invoiceDetail.subscriptionId)}
            >
              {' '}
              {invoiceDetail?.subscriptionId}
            </span>
          )}
        </Col>
      </Row>
      {/* <UserInfo user={userProfile} /> */}
      {/* <Tabs defaultActiveKey="1" items={tabItems} onChange={onTabChange} /> */}

      {invoiceDetail == null ||
      invoiceDetail.sendPdf == null ||
      invoiceDetail.sendPdf == '' ? null : (
        <object
          data={invoiceDetail.sendPdf}
          type="application/pdf"
          width="100%"
          height="100%"
        >
          <p>
            <a href={invoiceDetail.sendPdf}>Download invoice</a>
          </p>
        </object>
      )}
      <div>
        <Button onClick={goBack}>Go Back</Button>
      </div>
    </div>
  );
};

export default Index;

/**

import type { TabsProps } from 'antd';
import { Button, Col, Divider, Row, Tabs, message } from 'antd';
import React, { CSSProperties, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRelogin } from '../../hooks';
import { getUserProfile } from '../../requests';
import { IProfile } from '../../shared.types';
import AdminNote from './adminNote';
import InvoiceTab from './invoicesTab';
import SubscriptionTab from './subscriptionTab';
import UserAccount from './userAccountTab';

// const APP_PATH = import.meta.env.BASE_URL;

const Index = () => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<IProfile | null>(null);
  const [userId, setUserId] = useState<number | null>(null); // subscription obj has user profile data, but admin can update user profile in AccountTab.
  // so the data on subscription obj might be obsolete,
  // so I just use userId from subscription Obj, use this userId to run getUserProfile(userId), even after admin update the user info AccontTab, re-call getUserProfile

  const relogin = useRelogin();

  const tabItems: TabsProps['items'] = [
    {
      key: 'Subscription',
      label: 'Subscription',
      children: <SubscriptionTab setUserId={setUserId} />,
    },
    {
      key: 'Account',
      label: 'Account',
      children: (
        <UserAccount user={userProfile} setUserProfile={setUserProfile} />
      ),
    },
    {
      key: 'Invoices',
      label: 'Invoices',
      children: <InvoiceTab user={userProfile} />,
    },
    {
      key: 'Payment',
      label: 'Payment',
      children: 'content of payment',
    },
  ];
  const onTabChange = (key: string) => {};

  const fetchUserProfile = async () => {
    try {
      const res = await getUserProfile(userId as number);
      console.log('res getting user profile: ', res);
      const code = res.data.code;
      code == 61 && relogin(); // TODO: redesign the relogin component(popped in current page), so users don't have to be taken to /login
      if (code != 0) {
        throw new Error(res.data.message);
      }
      setUserProfile(res.data.data.User);
    } catch (err) {
      // setLoading(false);
      if (err instanceof Error) {
        console.log('profile update err: ', err.message);
        message.error(err.message);
      } else {
        message.error('Unknown error');
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
    <div style={{ display: 'flex' }}>
      <div style={{ width: '80%' }}>
        <UserInfoSection user={userProfile} />
        <Tabs defaultActiveKey="1" items={tabItems} onChange={onTabChange} />
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: '64px',
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

useEffect(() => {}, []);

return (
  <div style={{ marginBottom: '24px' }}>
    <Divider orientation="left" style={{ margin: '16px 0' }}>
      User Info
    </Divider>
    <Row style={rowStyle}>
      <Col span={4}>
        <span style={{ fontWeight: 'bold' }}>First Name</span>
      </Col>
      <Col span={6}>{user?.firstName}</Col>
      <Col span={4}>
        <span style={{ fontWeight: 'bold' }}>Last Name</span>
      </Col>
      <Col span={6}>{user?.lastName}</Col>
    </Row>
    <Row style={rowStyle}>
      <Col span={4}>
        <span style={{ fontWeight: 'bold' }}>Email</span>
      </Col>
      <Col span={6}>
        <a href={user?.email}>{user?.email} </a>
      </Col>
      <Col span={4}>
        <span style={{ fontWeight: 'bold' }}>Phone</span>
      </Col>
      <Col span={6}>{user?.mobile}</Col>
    </Row>
    <Row style={rowStyle}>
      <Col span={4}>
        <span style={{ fontWeight: 'bold' }}>Country</span>
      </Col>
      <Col span={6}>{user?.countryName}</Col>
      <Col span={4}>
        <span style={{ fontWeight: 'bold' }}>Billing Address</span>
      </Col>
      <Col span={6}>{user?.address}</Col>
    </Row>
    <Row style={rowStyle}>
      <Col span={4}>
        <span style={{ fontWeight: 'bold' }}>Payment Method</span>
      </Col>
      <Col span={6}>{user?.paymentMethod}</Col>
      <Col span={4}>
        <span style={{ fontWeight: 'bold' }}>VAT Number</span>
      </Col>
      <Col span={6}>{user?.vATNumber}</Col>
    </Row>
  </div>
);
};


 */
