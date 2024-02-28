import { Button, Form, Input, Modal, message } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { emailValidate, passwordRegx } from '../../helpers';
import { useCountdown } from '../../hooks';
import {
  forgetPassReq,
  forgetPassVerifyReq,
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

const APP_PATH = import.meta.env.BASE_URL;

const Index = ({
  email,
  onEmailChange,
}: {
  email: string;
  onEmailChange: (value: string) => void;
}) => {
  const profileStore = useProfileStore();
  const appConfigStore = useAppConfigStore();
  const sessionStore = useSessionStore();
  const merchantStore = useMerchantInfoStore();
  const [errMsg, setErrMsg] = useState('');
  const [countVal, counting, startCount, stopCounter] = useCountdown(60);
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false); // login submit
  const [submittingForgetPass, setSubmittingForgetPass] = useState(false); // click 'forget password'
  const [forgetPassModalOpen, setForgetPassModalOpen] = useState(false);
  const toggleForgetPassModal = () =>
    setForgetPassModalOpen(!forgetPassModalOpen);
  const [form] = Form.useForm();
  const watchEmail = Form.useWatch('email', form);

  const onForgetPass = async () => {
    const isValid = form.getFieldError('email').length == 0;
    if (!isValid) {
      return;
    }

    stopCounter();
    startCount();
    setSubmittingForgetPass(true);
    const [_, err] = await forgetPassReq(form.getFieldValue('email'));
    setSubmittingForgetPass(false);
    if (err != null) {
      message.error(err.message);
      return;
    }
    setForgetPassModalOpen(true);
    message.success('Code sent, please check your email!');
  };

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

    const [merchantInfo, err3] = await getMerchantInfoReq();
    if (err3 != null) {
      message.error(err.message);
      return;
    }
    merchantStore.setMerchantInfo(merchantInfo);

    const [appConfig, err2] = await getAppConfigReq();
    setSubmitting(false);
    if (err2 != null) {
      setErrMsg(err2.message);
      return;
    }

    appConfigStore.setAppConfig(appConfig);
    navigate(`${APP_PATH}subscription/list`);
  };

  useEffect(() => {
    if (watchEmail != null) {
      onEmailChange(watchEmail); // pass the email value to parent
    }
  }, [watchEmail]);

  return (
    <>
      {forgetPassModalOpen && (
        <ForgetPasswordModal
          email={form.getFieldValue('email')}
          closeModal={toggleForgetPassModal}
          resend={onForgetPass}
          countVal={countVal}
          counting={counting}
        />
      )}

      <Form
        form={form}
        onFinish={onSubmit}
        name="login-password"
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
        style={{ maxWidth: 640, width: 360, position: 'relative' }}
        initialValues={{ email, password: '' }}
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
          <Input onPressEnter={form.submit} />
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

        <div style={{ position: 'absolute', right: '-130px', top: '56px' }}>
          <Button
            onClick={onForgetPass}
            loading={submittingForgetPass}
            disabled={submittingForgetPass}
            type="link"
            style={{ fontSize: '11px' }}
          >
            Forgot Password?
          </Button>
        </div>

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

const ForgetPasswordModal = ({
  email,
  closeModal,
  resend,
  countVal,
  counting,
}: {
  email: string;
  closeModal: () => void;
  resend: () => void;
  countVal: number;
  counting: boolean;
}) => {
  const [form2] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onConfirm = async () => {
    setLoading(true);
    const [_, err] = await forgetPassVerifyReq(
      form2.getFieldValue('email'),
      form2.getFieldValue('verificationCode'),
      form2.getFieldValue('newPassword'),
    );
    setLoading(false);
    if (err != null) {
      message.error(err.message);
      return;
    }
    message.success('Password reset succeeded, please relogin');
    closeModal();
  };

  return (
    <Modal
      title="Forgot Password"
      open={true}
      width={'640px'}
      footer={null}
      closeIcon={null}
    >
      <Form
        form={form2}
        onFinish={onConfirm}
        name="forget-password"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        // style={{ maxWidth: 640, width: 360 }}
        className="my-6"
        initialValues={{
          email,
          verificationCode: '',
          newPassword: '',
          newPassword2: '',
        }}
      >
        <Form.Item
          label="Email"
          name="email"
          rules={[
            {
              required: true,
              message: 'Please input your old password!',
            },
          ]}
        >
          <Input disabled />
        </Form.Item>

        <Form.Item
          label="Verification Code"
          name="verificationCode"
          rules={[
            {
              required: true,
              message: 'Please input your old password!',
            },
          ]}
        >
          <Input />
        </Form.Item>

        {/* <div className="mb-4 flex justify-center text-red-500">{errMsg}</div> */}

        <Form.Item
          label="New Password"
          name="newPassword"
          rules={[
            {
              required: true,
              message: 'Please input your new password!',
            },
            ({ getFieldValue }) => ({
              validator(rule, value) {
                if (passwordRegx.test(value)) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  '8-15 characters with lowercase, uppercase, numeric and special character(@ $ # ! % ? * &  ^)',
                );
              },
            }),
          ]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item
          label="New Password Confirm"
          name="newPassword2"
          rules={[
            {
              required: true,
              message: 'Please retype your new password!',
            },
            ({ getFieldValue }) => ({
              validator(rule, value) {
                if (value == getFieldValue('newPassword')) {
                  return Promise.resolve();
                }
                return Promise.reject('please retype the same password');
              },
            }),
          ]}
        >
          <Input.Password onPressEnter={onConfirm} />
        </Form.Item>
      </Form>

      <div className="my-6 flex items-center justify-between">
        <div className="flex max-w-48 items-center justify-center">
          <Button onClick={resend} disabled={counting}>
            Resend
          </Button>
          {counting && (
            <span style={{ marginLeft: '6px' }}>in {countVal} seconds</span>
          )}
        </div>
        <div>
          <Button onClick={closeModal} disabled={loading}>
            Cancel
          </Button>
          &nbsp;&nbsp;&nbsp;&nbsp;
          <Button
            type="primary"
            onClick={form2.submit}
            loading={loading}
            disabled={loading}
          >
            OK
          </Button>
        </div>
      </div>
    </Modal>
  );
};
