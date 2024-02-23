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
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { CURRENCY, PLAN_STATUS } from '../../constants';
import { useRelogin } from '../../hooks';
import {
  createMetricsReq,
  getMetricDetailReq,
  updateMetricsReq,
} from '../../requests';
import { useAppConfigStore } from '../../stores';

const { TextArea } = Input;

const APP_PATH = import.meta.env.BASE_URL;

const Index = () => {
  const params = useParams();
  const metricsId = params.metricsId;
  const isNew = metricsId == null;

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [aggrePropDisabled, setAggrePropDisabled] = useState(true);
  const watchAggreType = Form.useWatch('aggregationType', form);
  const relogin = useRelogin();
  useEffect(() => {
    setAggrePropDisabled(watchAggreType == 0);
  }, [watchAggreType]);

  const onSave = async () => {
    console.log('form values: ', form.getFieldsValue());
    let m;
    if (isNew) {
      m = JSON.parse(JSON.stringify(form.getFieldsValue()));
      if (m.watchAggreType == 0) {
        delete m.aggregationProperty;
      }
    } else {
      m = {
        metricId: Number(metricsId),
        metricName: form.getFieldValue('metricName'),
        metricDescription: form.getFieldValue('metricDescription'),
      };
    }

    const actionMethod = isNew ? createMetricsReq : updateMetricsReq;
    setLoading(true);
    try {
      const res = await actionMethod(m);
      setLoading(false);
      const statusCode = res.data.code;
      if (statusCode != 0) {
        statusCode == 61 && relogin();
        throw new Error(res.data.message);
      }
      message.success(`Metrics ${isNew ? 'created' : 'updated'}.`);
      navigate(`${APP_PATH}billable-metrics/list`);
    } catch (err) {
      setLoading(false);
      if (err instanceof Error) {
        console.log('err in creatign/updating metrics: ', err.message);
        message.error(err.message);
      } else {
        message.error('Unknown error');
      }
    }
  };

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await getMetricDetailReq(Number(metricsId));
      setLoading(false);
      console.log('fetch metrics detail: ', res);
      const statusCode = res.data.code;
      if (statusCode != 0) {
        statusCode == 61 && relogin();
        throw new Error(res.data.message);
      }
      form.setFieldsValue(res.data.data.merchantMetric);
    } catch (err) {
      setLoading(false);
      if (err instanceof Error) {
        console.log('err in fetching metrics detail: ', err.message);
        message.error(err.message);
      } else {
        message.error('Unknown error');
      }
    }
  };

  useEffect(() => {
    if (!isNew) {
      fetchMetrics();
    }
  }, []);

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
                  name="metricName"
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
                  <Input disabled={!isNew} />
                </Form.Item>
              </Col>
            </Row>
            <Row className="my-4"></Row>
            <Row gutter={[16, 16]}>
              <Col span={10}>Description</Col>
            </Row>
            <Row gutter={[16, 16]}>
              <Col span={20}>
                <Form.Item name="metricDescription" noStyle={true}>
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
                  <Radio.Group disabled={!isNew}>
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
                    style={{ width: 160 }}
                    options={[
                      { value: 0, label: 'Count', disabled: !isNew },
                      { value: 1, label: 'Count unique', disabled: !isNew },
                      { value: 2, label: 'Latest', disabled: !isNew },
                      { value: 3, label: 'Max', disabled: !isNew },
                      { value: 4, label: 'Sum', disabled: !isNew },
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
                    <Input disabled={aggrePropDisabled || !isNew} />
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
