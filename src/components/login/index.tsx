import type { RadioChangeEvent } from 'antd';
import { Button, Radio, message } from 'antd';
import React, { ChangeEvent, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppFooter from '../appFooter';
import AppHeader from '../appHeader';
import LoginBox from './loginContainer';

const APP_PATH = import.meta.env.BASE_URL;

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(''); // email need to be shared on passwordLogin and OtpLogin, so it has to be defined in parent.
  const onEmailChange = (evt: ChangeEvent<HTMLInputElement> | string) => {
    typeof evt == 'string' ? setEmail(evt) : setEmail(evt.target.value);
  };

  const [loginType, setLoginType] = useState<'password' | 'OTP'>('password');

  const onLoginTypeChange = (e: RadioChangeEvent) =>
    setLoginType(e.target.value);
  const goSignup = () => navigate(`${APP_PATH}signup`);

  useEffect(() => {
    if (location.state && location.state.msg) {
      message.info(location.state.msg);
    }
  }, []);

  return (
    <div
      style={{
        height: 'calc(100vh - 142px)',
        overflowY: 'auto',
      }}
    >
      <AppHeader />
      <LoginBox triggeredByExpired={false} initialEmail="" />
      <AppFooter />
    </div>
  );
};

export default Index;
