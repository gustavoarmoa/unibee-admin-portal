import { Button, Form, Input, Modal, message } from 'antd';
import { useEffect, useState } from 'react';
import { emailValidate } from '../../helpers';
import {
  getAppConfigReq,
  getMerchantInfoReq,
  loginWithPasswordReq,
} from '../../requests';
import {
  useAppConfigStore,
  useMerchantInfoStore,
  useProfileStore,
  useSessionStore,
} from '../../stores';

const Index = ({ email }: { email: string }) => {
  const profileStore = useProfileStore();
  const sessionStore = useSessionStore();
  const appConfigStore = useAppConfigStore();
  const merchantStore = useMerchantInfoStore();
  const [errMsg, setErrMsg] = useState('');
  const [submitting, setSubmitting] = useState(false); // login submit
  const [form] = Form.useForm();

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

    const [appConfig, err2] = await getAppConfigReq();
    setSubmitting(false);
    if (err2 != null) {
      setErrMsg(err.message);
      return;
    }

    const [merchantInfo, err3] = await getMerchantInfoReq();
    if (err3 != null) {
      message.error(err.message);
      return;
    }
    merchantStore.setMerchantInfo(merchantInfo);

    appConfigStore.setAppConfig(appConfig);
    sessionStore.refresh && sessionStore.refresh();
    sessionStore.setSession({ expired: false, refresh: null });
    message.success('Login succeeded');
  };

  return (
    <>
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
    </>
  );
};

export default Index;
