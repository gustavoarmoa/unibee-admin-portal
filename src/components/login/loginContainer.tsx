import type { RadioChangeEvent } from 'antd';
import { Button, Radio, message } from 'antd';
import React, { ChangeEvent, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import OTPLogin from './otpLogin';
import PasswordLogin from './passwordLogin';

const APP_PATH = import.meta.env.BASE_URL;

const Index = ({
  triggeredByExpired,
  initialEmail,
}: {
  triggeredByExpired: boolean;
  initialEmail: string;
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(initialEmail); // email need to be shared on passwordLogin and OtpLogin, so it has to be defined in parent.
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
    <div className="flex h-full items-center justify-center ">
      <div className="flex flex-col items-center justify-center">
        <h1 style={{ marginBottom: '36px' }}>Billing Admin Login</h1>
        <Radio.Group
          options={[
            { label: 'Password', value: 'password' },
            { label: 'OTP', value: 'OTP' },
          ]}
          onChange={onLoginTypeChange}
          value={loginType}
        />
        <div
          className="mb-3 mt-6 flex flex-col items-center justify-center rounded-lg  bg-white"
          style={{
            width: '620px',
            height: '300px',
            border: '1px solid #e0e0e0',
          }}
        >
          {loginType == 'password' ? (
            <PasswordLogin
              email={email}
              onEmailChange={onEmailChange}
              triggeredByExpired={triggeredByExpired}
            />
          ) : (
            <OTPLogin
              email={email}
              onEmailChange={onEmailChange}
              triggeredByExpired={triggeredByExpired}
            />
          )}
        </div>
        <div className="flex flex-col items-center justify-center text-gray-500">
          <div>Don't have an account?</div>
          <div className="flex items-center">
            <div>
              <Button type="link" onClick={goSignup}>
                Sign up
              </Button>
            </div>
            <div style={{ marginLeft: '-8px' }}>
              for a UniBee cloud-based billing admin account for free.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
