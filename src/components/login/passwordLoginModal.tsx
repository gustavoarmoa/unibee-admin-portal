import { Button, Form, Input, Modal, message } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useAppConfigStore,
  useMerchantInfoStore,
  useProfileStore,
  useSessionStore,
} from '../../stores';
import LoginBox from './loginContainer';

const APP_PATH = import.meta.env.BASE_URL; // import.meta.env.VITE_APP_PATH;

const Index = ({ email }: { email: string }) => {
  const navigate = useNavigate();
  const profileStore = useProfileStore();

  if (profileStore.id <= 0) {
    // ??????????????????????????
    // new user which has no valid userId, redirect to /login
    navigate(`${APP_PATH}login`); // only existing user will be prompted with relogin Modal.
    return null;
  }

  return (
    <Modal
      title="Session expired"
      width={680}
      open={true}
      footer={false}
      closeIcon={null}
    >
      <LoginBox triggeredByExpired={true} initialEmail={email} />
    </Modal>
  );
};

export default Index;
