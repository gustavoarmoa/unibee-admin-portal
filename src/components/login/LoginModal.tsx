import { Button, Form, Input, Modal, message } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useAppConfigStore,
  useMerchantInfoStore,
  useProfileStore,
  useSessionStore,
} from '../../stores';
import LoginContainer from './loginContainer';

const Index = ({ email }: { email: string }) => {
  return (
    <Modal
      title="Session expired"
      width={680}
      open={true}
      footer={false}
      closeIcon={null}
    >
      <LoginContainer triggeredByExpired={true} initialEmail={email} />
    </Modal>
  );
};

export default Index;
