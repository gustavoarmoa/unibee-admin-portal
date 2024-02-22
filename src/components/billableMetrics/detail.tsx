import {
  CheckCircleOutlined,
  LoadingOutlined,
  MinusOutlined,
} from '@ant-design/icons';
import type { SelectProps } from 'antd';
import {
  Button,
  Col,
  Form,
  Input,
  Radio,
  Row,
  Select,
  Spin,
  message,
} from 'antd';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CURRENCY, PLAN_STATUS } from '../../constants';
import { useRelogin } from '../../hooks';
import {
  activatePlan,
  createMetricsReq,
  getPlanDetail,
  getPlanList,
  savePlan,
  togglePublishReq,
} from '../../requests';
import { IPlan } from '../../shared.types';
import { useAppConfigStore } from '../../stores';

const { TextArea } = Input;

const APP_PATH = import.meta.env.BASE_URL;

const getAmount = (amt: number, currency: string) =>
  amt / CURRENCY[currency].stripe_factor;

// this component has the similar structure with newPlan.tsx, try to refactor them into one.
const Index = () => {
  const params = useParams();
  const appConfigStore = useAppConfigStore();
  const [loading, setLoading] = useState(false);
  const [activating, setActivating] = useState(false);
  const [publishing, setPublishing] = useState(false); // when toggling publish/unpublish
  const [plan, setPlan] = useState<IPlan | null>(null);
  const [addons, setAddons] = useState<IPlan[]>([]); // all the active addons we have
  const [selectAddons, setSelectAddons] = useState<IPlan[]>([]); // addon list in <Select /> for the current main plan, this list will change based on different plan props(interval count/unit/currency)
  const [selectedAddon, setSelectedAddon] = useState<number[]>([]); // from the above selectAddons, which are selected(addon Id array)
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [aggrePropDisabled, setAggrePropDisabled] = useState(true);
  const watchAggreType = Form.useWatch('aggregationType', form);
  const relogin = useRelogin();
  useEffect(() => {
    setAggrePropDisabled(watchAggreType == 0);
  }, [watchAggreType]);

  // const onTypeChange =

  const onSave = async () => {
    // TODO: remove aggreProps if aggrType == 0
    console.log('form values: ', form.getFieldsValue());
    const m = JSON.parse(JSON.stringify(form.getFieldsValue()));
    if (m.watchAggreType == 0) {
      delete m.aggregationProperty;
    }
    setLoading(true);
    try {
      const res = await createMetricsReq(m);
      setLoading(false);
      const statusCode = res.data.code;
      if (statusCode != 0) {
        statusCode == 61 && relogin();
        throw new Error(res.data.message);
      }
      message.success('Metrics created'); // TODO: redirect to /billable-metrics/:id
    } catch (err) {
      setLoading(false);
      if (err instanceof Error) {
        console.log('err in creatign metrics: ', err.message);
        message.error(err.message);
      } else {
        message.error('Unknown error');
      }
    }
  };

  useEffect(() => {}, []);

  return (
    <div className="h-full">
      <Spin
        spinning={loading}
        indicator={
          <LoadingOutlined style={{ fontSize: 32, color: '#FFF' }} spin />
        }
        fullscreen
      />
      <div className="flex">
        <div className="w-4/6">
          <Form
            form={form}
            onFinish={onSave}
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 24 }}
            layout="horizontal"
            // disabled={componentDisabled}
            style={{ maxWidth: 600 }}
            initialValues={{ type: 1 }}
          >
            <Row gutter={[16, 16]}>
              <Col span={10}>Name</Col>
              <Col span={10}>Code</Col>
            </Row>
            <Row gutter={[16, 16]}>
              <Col span={10}>
                <Form.Item
                  name="name"
                  noStyle={true}
                  rules={[
                    {
                      required: true,
                      message: 'Please input your metrics name!',
                    },
                  ]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={10}>
                <Form.Item
                  name="code"
                  noStyle={true}
                  rules={[
                    {
                      required: true,
                      message: 'Please input your metrics code!',
                    },
                  ]}
                >
                  <Input />
                </Form.Item>
              </Col>
            </Row>
            <Row className="my-4"></Row>
            <Row gutter={[16, 16]}>
              <Col span={10}>Description</Col>
            </Row>
            <Row gutter={[16, 16]}>
              <Col span={20}>
                <Form.Item name="description" noStyle={true}>
                  <TextArea rows={6} />
                </Form.Item>
              </Col>
            </Row>

            <Row className="my-4"></Row>
            <Row gutter={[16, 16]}>
              <Col span={10}>Type</Col>
            </Row>
            <Row>
              <Col>
                <Form.Item name="type">
                  <Radio.Group>
                    <Radio.Button value={1}>Limit metered</Radio.Button>
                    <Radio.Button value={2} disabled>
                      Charge metered
                    </Radio.Button>
                    <Radio.Button value={3} disabled>
                      Charge recurring
                    </Radio.Button>
                  </Radio.Group>
                </Form.Item>
              </Col>
            </Row>

            <Row className="my-4"></Row>
            <Row gutter={[16, 16]}>
              <Col span={10}>Aggregation Type</Col>
              {!aggrePropDisabled && <Col span={10}>Property to aggregate</Col>}
            </Row>
            <Row gutter={[16, 16]}>
              <Col span={10}>
                <Form.Item
                  name="aggregationType"
                  rules={[
                    {
                      required: true,
                      message: 'Please select your aggregation type',
                    },
                  ]}
                >
                  <Select
                    // defaultValue="lucy"
                    style={{ width: 160 }}
                    // onChange={handleChange}
                    options={[
                      { value: 0, label: 'Count' },
                      { value: 1, label: 'Count unique' },
                      { value: 2, label: 'Latest' },
                      { value: 3, label: 'Max' },
                      { value: 4, label: 'Sum' },
                    ]}
                  />
                </Form.Item>
              </Col>
              {!aggrePropDisabled && (
                <Col span={10}>
                  <Form.Item
                    name="aggregationProperty"
                    rules={[
                      {
                        required: true,
                        message: 'Please input your property to aggregate !',
                      },
                    ]}
                  >
                    <Input disabled={aggrePropDisabled} />
                  </Form.Item>
                </Col>
              )}
            </Row>

            <div className="my-12 flex justify-center gap-5">
              <Button
                onClick={() => navigate(`${APP_PATH}billable-metrics/list`)}
                disabled={loading}
              >
                Go Back
              </Button>
              <Button
                onClick={form.submit}
                type="primary"
                htmlType="submit"
                loading={loading}
                disabled={loading}
              >
                Save
              </Button>
            </div>
          </Form>
        </div>
        <div className="w-2/6">
          <pre style={{ background: '#f3f4f6', height: '100%' }}>{`
curl --location --request POST "http://18.179.30.245:3000/api/v1/events" \
  --header "Authorization: Bearer $__YOUR_API_KEY__" \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "event": { 
    "transaction_id": "__UNIQUE_ID__", 
    "external_subscription_id": "__EXTERNAL_SUBSCRIPTION_ID__",
    "external_customer_id": "__EXTERNAL_CUSTOMER_ID__", 
    "code": "code-001",
    "timestamp": $(date +%s), 
    "properties":  { 
      "user_id": 12
    }
  }
}'
# To use the snippet, don’t forget to edit your __YOUR_API_KEY__, __UNIQUE_ID__, __EXTERNAL_SUBSCRIPTION_ID__ and __EXTERNAL_CUSTOMER_ID__
          `}</pre>
        </div>
      </div>
    </div>
  );
};

export default Index;
