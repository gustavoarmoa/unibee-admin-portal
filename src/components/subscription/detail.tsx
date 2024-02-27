import type { DatePickerProps, TabsProps } from 'antd';
import {
  Button,
  Col,
  DatePicker,
  Divider,
  Row,
  Space,
  Tabs,
  message,
} from 'antd';
import type { Dayjs } from 'dayjs';
import React, { CSSProperties, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRelogin } from '../../hooks';
import { getUserProfile, getUserProfile2 } from '../../requests';
import { IProfile } from '../../shared.types';
import UserInfoSection from '../shared/userInfo';
import AdminNote from './adminNote';
import InvoiceTab from './invoicesTab';
import SubscriptionTab from './subscriptionTab';
import UserAccount from './userAccountTab';

const APP_PATH = import.meta.env.BASE_URL; // import.meta.env.VITE_APP_PATH;

const Index = () => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<IProfile | null>(null);
  const [userId, setUserId] = useState<number | null>(null); // subscription obj has user account data, and admin can update it in AccountTab.
  // so the user data on subscription obj might be obsolete,
  // so I use userId from subscription Obj, use this userId to run getUserProfile(userId), even after admin update the user info in AccontTab, re-call getUserProfile

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
    const [user, err] = await getUserProfile2(
      userId as number,
      fetchUserProfile,
    );
    if (err != null) {
      message.error(err.message);
      return;
    }
    setUserProfile(user);
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
          <Button onClick={() => navigate(`${APP_PATH}subscription/list`)}>
            Go Back
          </Button>
        </div>
      </div>
      <AdminNote />
    </div>
  );
};

export default Index;
