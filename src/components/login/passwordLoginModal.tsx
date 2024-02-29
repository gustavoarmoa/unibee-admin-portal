import { Button, Form, Input, Modal, message } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { emailValidate } from '../../helpers';
import {
  getAppConfigReq,
  getMerchantInfoReq,
  initializeReq,
  loginWithPasswordReq,
} from '../../requests';
import {
  useAppConfigStore,
  useMerchantInfoStore,
  useProfileStore,
  useSessionStore,
} from '../../stores';

const APP_PATH = import.meta.env.BASE_URL; // import.meta.env.VITE_APP_PATH;

const Index = ({ email }: { email: string }) => {
  const navigate = useNavigate();
  const profileStore = useProfileStore();
  const sessionStore = useSessionStore();
  const appConfigStore = useAppConfigStore();
  const merchantStore = useMerchantInfoStore();
  const [errMsg, setErrMsg] = useState('');
  const [submitting, setSubmitting] = useState(false); // login submit
  const [form] = Form.useForm();

  if (profileStore.id <= 0) {
    // new user which has no valid userId, redirect to /login
    navigate(`${APP_PATH}login`); // only existing user will be prompted with relogin Modal.
    return null;
  }

  const onSubmit = async () => {
    setErrMsg('');
    setSubmitting(true);
    const [loginRes, err] = await loginWithPasswordReq(form.getFieldsValue());
    if (err != null) {
      setSubmitting(false);
      setErrMsg(err.message);
      return;
    }

    const { MerchantUser, Token } = loginRes;
    localStorage.setItem('merchantToken', Token);
    MerchantUser.token = Token;
    profileStore.setProfile(MerchantUser);
    sessionStore.setSession({ expired: false, refresh: null });

    const [initRes, errInit] = await initializeReq();
    setSubmitting(false);
    if (null != errInit) {
      setErrMsg(errInit.message);
      return;
    }
    const { appConfig, gateways, merchantInfo } = initRes;
    appConfigStore.setAppConfig(appConfig);
    appConfigStore.setGateway(gateways);
    merchantStore.setMerchantInfo(merchantInfo);

    sessionStore.refresh && sessionStore.refresh();
    message.success('Login succeeded');
  };

  return (
    <Modal title="Session expired" open={true} footer={false} closeIcon={null}>
      <Form
        form={form}
        onFinish={onSubmit}
        name="login-password"
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
        style={{ maxWidth: 640, width: 360, position: 'relative' }}
        initialValues={{ email }}
      >
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
                if (value != null && value != '' && emailValidate(value)) {
                  return Promise.resolve();
                }
                return Promise.reject('Please input valid email address.');
              },
            }),
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[
            {
              required: true,
              message: 'Please input your password!',
            },
          ]}
        >
          <Input.Password onPressEnter={form.submit} />
        </Form.Item>

        <div className="mb-4 flex justify-center text-red-500">{errMsg}</div>

        <Form.Item
          wrapperCol={{
            offset: 8,
            span: 16,
          }}
        >
          <Button
            type="primary"
            onClick={form.submit}
            loading={submitting}
            disabled={submitting}
          >
            Submit
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default Index;
