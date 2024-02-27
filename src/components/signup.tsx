import { Button, Checkbox, Divider, Form, Input, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import { request } from "../api/axios2";
// import { login } from "../api/auth";
import axios from 'axios';
import OtpInput from 'react-otp-input';
import { emailValidate } from '../helpers';
import { getAppConfigReq } from '../requests';
import { useAppConfigStore } from '../stores';
import AppFooter from './appFooter';
import AppHeader from './appHeader';

const APP_PATH = import.meta.env.BASE_URL;
const API_URL = import.meta.env.VITE_API_URL;

const passwordRegx =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@.#$!%*?&])[A-Za-z\d@.#$!%*?&]{8,15}$/;

const Index = () => {
  const navigate = useNavigate();
  const appConfigStore = useAppConfigStore();
  const [form] = Form.useForm();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  // const [verificationCode, setVerificationCode] = useState("");
  const [currentStep, setCurrentStep] = useState(0); // [0, 1]
  const [errMsg, setErrMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // const onEmailChange = (evt: ChangeEvent<HTMLInputElement>) =>
  //     setEmail(evt.target.value);
  const onFirstNameChange = (evt: React.ChangeEvent<HTMLInputElement>) =>
    setFirstName(evt.target.value);
  const onLastNameChange = (evt: React.ChangeEvent<HTMLInputElement>) =>
    setLastName(evt.target.value);
  const onEmailChange = (evt: React.ChangeEvent<HTMLInputElement>) =>
    setEmail(evt.target.value);
  const onPhoneChange = (evt: React.ChangeEvent<HTMLInputElement>) =>
    setPhone(evt.target.value);
  const onAdderssChange = (evt: React.ChangeEvent<HTMLInputElement>) =>
    setAddress(evt.target.value);
  const onPasswordChange = (evt: React.ChangeEvent<HTMLInputElement>) =>
    setPassword(evt.target.value);
  const onPassword2Change = (evt: React.ChangeEvent<HTMLInputElement>) =>
    setPassword2(evt.target.value);
  // const onCodeChange = (evt) => setVerificationCode(evt.target.value);
  const [otp, setOtp] = useState('');
  const onOTPchange = (value: string) => {
    setOtp(value.toUpperCase());
  };

  const goLogin = () => navigate(`${APP_PATH}login`);

  const onSubmit = () => {
    if (appConfigStore.MerchantId < 0) {
      return;
    }
    if (
      firstName == '' ||
      lastName == '' ||
      email == '' ||
      password == '' ||
      password2 == '' ||
      password != password2 ||
      !passwordRegx.test(password)
    ) {
      return;
    }

    setErrMsg('');
    setSubmitting(true);
    const user_name = 'ewo' + Math.random(); // TO BE Deleted
    axios
      .post(`${API_URL}/merchant/auth/sso/register`, {
        email,
        firstName,
        lastName,
        password,
        phone,
        address,
        user_name,
        merchantId: appConfigStore.MerchantId,
      })
      .then((res) => {
        setErrMsg(res.data.message);
        setSubmitting(false);
        if (res.data.code != 0) {
          throw new Error(res.data.message);
        }
        setCurrentStep(1);
        console.log('reg res: ', res);
      })
      .catch((err) => {
        setSubmitting(false);
        console.log('reg err: ', err);
      });
  };

  const onSubmit2 = () => {
    setErrMsg('');
    setSubmitting(true);
    // const user_name = "ewo" + Math.random();
    axios
      .post(`${API_URL}/merchant/auth/sso/registerVerify`, {
        email,
        verificationCode: otp,
      })
      .then((res) => {
        setSubmitting(false);
        console.log('reg res: ', res);
        if (res.data.code != 0) {
          throw new Error(res.data.message);
        }
        navigate(`${APP_PATH}login`, {
          state: { msg: 'Thanks for your sign-up on UniBee' },
        });
      })
      .catch((err) => {
        setSubmitting(false);
        console.log('reg err: ', err);
        setErrMsg(err.message);
      });
  };

  useEffect(() => {
    const fetchAppConfig = async () => {
      setSubmitting(true);
      const [appConfig, err] = await getAppConfigReq();
      setSubmitting(false);
      if (err != null) {
        message.error(err.message);
        return;
      }
      appConfigStore.setAppConfig(appConfig);
    };

    fetchAppConfig();
  }, []);

  return (
    <div
      style={{
        height: 'calc(100vh - 164px)',
        overflowY: 'auto',
      }}
    >
      {' '}
      <AppHeader />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: '100px',
        }}
      >
        <h1 style={{ marginBottom: '24px', marginTop: '36px' }}>
          Merchant Signup
        </h1>
        {currentStep == 0 ? (
          <>
            <div
              style={{
                width: '640px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                background: '#FFF',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                paddingTop: '24px',
              }}
            >
              <Form
                name="basic"
                form={form}
                onFinish={onSubmit}
                labelCol={{
                  span: 10,
                }}
                wrapperCol={{
                  span: 18,
                }}
                style={{
                  maxWidth: 600,
                }}
                initialValues={{
                  remember: true,
                }}
                autoComplete="off"
              >
                <Form.Item
                  label="First Name"
                  name="firstName"
                  rules={[
                    {
                      required: true,
                      message: 'Please input your first name!',
                    },
                  ]}
                >
                  <Input value={firstName} onChange={onFirstNameChange} />
                </Form.Item>

                <Form.Item
                  label="Last Name"
                  name="lastName"
                  rules={[
                    {
                      required: true,
                      message: 'Please input yourn last name!',
                    },
                  ]}
                >
                  <Input value={lastName} onChange={onLastNameChange} />
                </Form.Item>

                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    {
                      required: true,
                      message: 'Please input your Email!',
                    },
                    ({ getFieldValue }) => ({
                      validator(rule, value) {
                        if (emailValidate(value)) {
                          return Promise.resolve();
                        }
                        return Promise.reject('Invalid email address');
                      },
                    }),
                  ]}
                >
                  <Input value={email} onChange={onEmailChange} />
                </Form.Item>

                <Form.Item
                  label="Phone"
                  name="phone"
                  rules={[
                    {
                      required: false,
                      // message: "Please input your Email!",
                    },
                  ]}
                >
                  <Input value={phone} onChange={onPhoneChange} />
                </Form.Item>

                {/* <Form.Item
                label="Physical address"
                name="address"
                rules={[
                  {
                    required: false,
                    // message: "Please input your Email!",
                  },
                ]}
              >
                <Input value={address} onChange={onAdderssChange} />
              </Form.Item> */}

                <Form.Item
                  label="Password"
                  name="password"
                  rules={[
                    {
                      required: true,
                      message: 'Please input your password!',
                    },
                    ({ getFieldValue }) => ({
                      validator(rule, value) {
                        if (passwordRegx.test(password) && value == password2) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          '8-15 characters with lowercase, uppercase, numeric and special character(@ $ # ! % ? * &  ^)',
                        );
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    value={password}
                    onChange={onPasswordChange}
                  />
                </Form.Item>

                <Form.Item
                  label="Password Confirm"
                  name="password2"
                  rules={[
                    {
                      required: true,
                      message: 'Please retype your password!',
                    },
                    ({ getFieldValue }) => ({
                      validator(rule, value) {
                        if (value == password) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          'please retype the same password',
                        );
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    value={password2}
                    onChange={onPassword2Change}
                  />
                </Form.Item>

                <Form.Item
                  name="errMsg"
                  wrapperCol={{
                    offset: 8,
                    span: 16,
                  }}
                >
                  <span style={{ color: 'red' }}>{errMsg}</span>
                </Form.Item>

                {/* <Form.Item
                name="remember"
                valuePropName="checked"
                wrapperCol={{
                  offset: 8,
                  span: 16,
                }}
              >
                <Checkbox>Remember me</Checkbox>
              </Form.Item> */}

                <Form.Item
                  wrapperCol={{
                    offset: 11,
                    span: 8,
                  }}
                >
                  <Button
                    type="primary"
                    htmlType="submit"
                    onClick={onSubmit}
                    loading={submitting}
                    disabled={submitting}
                  >
                    Submit
                  </Button>
                </Form.Item>
              </Form>
              <div
                style={{
                  display: 'flex',
                  color: '#757575',
                  justifyContent: 'center',
                  alignItems: 'center',
                  margin: '-12px 0 18px 0',
                }}
              >
                Already have an account?
                <Button type="link" onClick={goLogin}>
                  Login
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '78px',
              }}
            >
              <h3>Enter verification code for {email}</h3>
            </div>
            <OtpInput
              value={otp}
              onChange={onOTPchange}
              numInputs={6}
              shouldAutoFocus={true}
              skipDefaultStyles={true}
              inputStyle={{
                height: '80px',
                width: '60px',
                border: '1px solid gray',
                borderRadius: '6px',
                textAlign: 'center',
                fontSize: '36px',
              }}
              renderSeparator={<span style={{ width: '36px' }}></span>}
              renderInput={(props) => <input {...props} />}
            />
            <div
              style={{
                height: '64px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: 'red',
              }}
            >
              {errMsg}
            </div>
            <div>
              <Button
                type="primary"
                block
                onClick={onSubmit2}
                loading={submitting}
              >
                Submit
              </Button>
              <Button type="link" block onClick={onSubmit} loading={submitting}>
                Resend
              </Button>
              {/* <Button
              type="link"
              block
              onClick={() => {
                setCurrentStep(0);
                setOtp("");
                setErrMsg("");
              }}
            >
              Go back
            </Button>*/}
            </div>
          </div>
        )}
      </div>
      <AppFooter />
    </div>
  );
};

export default Index;
