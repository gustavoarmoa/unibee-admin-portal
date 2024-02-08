import { Button, Form, Input, Select, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CURRENCY } from '../../constants';
import { useRelogin } from '../../hooks';
import { createPlan } from '../../requests';

const DEFAULT_FORM_VALUES = {
  currency: 'EUR',
  intervalUnit: 'month',
  type: 1, // 1: main, 2: add-on
  imageUrl: 'http://www.google.com',
  homeUrl: 'http://www.google.com',
};

// new plan: 之后就是old plan了, 需要edit了, default form value 也不能用了.
// this component has the similar structure with planDetail.tsx, try to refactor them into one.
const Index = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const relogin = useRelogin();
  const watchCurrency = Form.useWatch('currency', form);
  useEffect(() => {
    // just to make the page rerender when currency changed, so the currency symbol (the prefix in amount's <Input />) will also change
  }, [watchCurrency]);

  const onCreatePlan = async (values: any) => {
    const f = JSON.parse(JSON.stringify(values));
    f.amount = Number(f.amount);
    f.amount *= CURRENCY[f.currency].stripe_factor;
    f.intervalCount = Number(f.intervalCount);
    f.addonIds = [];
    console.log('saving form: ', f);

    try {
      setLoading(true);
      const createPlanRes = await createPlan(f);
      setLoading(false);
      console.log('create plan res: ', createPlanRes);
      const statusCode = createPlanRes.data.code;
      if (statusCode != 0) {
        statusCode == 61 && relogin();
        throw new Error(createPlanRes.data.message);
      }
      message.success('Plan created');
      setTimeout(() => {
        navigate(-1);
      }, 1500);
    } catch (err) {
      setLoading(false);
      if (err instanceof Error) {
        console.log('err in creatign plan: ', err.message);
        message.error(err.message);
      } else {
        message.error('Unknown error');
      }
    }
  };

  return (
    <div>
      <Form
        form={form}
        onFinish={onCreatePlan}
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 24 }}
        layout="horizontal"
        // disabled={componentDisabled}
        style={{ maxWidth: 600 }}
        initialValues={DEFAULT_FORM_VALUES}
      >
        <Form.Item
          label="merchantId"
          name="merchantId"
          hidden
          initialValue={15621}
        >
          <Input disabled />
        </Form.Item>

        <Form.Item
          label="Plan Name"
          name="planName"
          rules={[
            {
              required: true,
              message: 'Please input your plan name!',
            },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item label="Plan Description" name="description">
          <Input />
        </Form.Item>

        <Form.Item
          label="Currency"
          name="currency"
          rules={[
            {
              required: true,
              message: 'Please select your plan currency!',
            },
          ]}
        >
          <Select
            style={{ width: 120 }}
            options={[
              { value: 'EUR', label: 'EUR' },
              { value: 'USD', label: 'USD' },
              { value: 'JPY', label: 'JPY' },
            ]}
          />
        </Form.Item>

        <Form.Item
          label="Price"
          name="amount"
          rules={[
            {
              required: true,
              message: 'Please input your plan price!',
            },
          ]}
        >
          <Input
            prefix={
              CURRENCY[
                form.getFieldValue('currency') ?? DEFAULT_FORM_VALUES.currency
              ].symbol
            }
          />
        </Form.Item>

        <Form.Item
          label="Interval Unit"
          name="intervalUnit"
          rules={[
            {
              required: true,
              message: 'Please select interval unit!',
            },
          ]}
        >
          <Select
            style={{ width: 120 }}
            options={[
              { value: 'day', label: 'day' },
              { value: 'week', label: 'week' },
              { value: 'month', label: 'month' },
              { value: 'year', label: 'year' },
            ]}
          />
        </Form.Item>

        <Form.Item
          label="Interval Count"
          name="intervalCount"
          rules={[
            {
              required: true,
              message: 'Please input interval count!',
            },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item label="Plan Type" name="type">
          <Select
            style={{ width: 120 }}
            options={[
              { value: 1, label: 'Main plan' },
              { value: 2, label: 'Addon' },
            ]}
          />
        </Form.Item>

        <Form.Item label="Product Name" name="productName">
          <Input />
        </Form.Item>

        <Form.Item label="Product Description" name="productDescription">
          <Input />
        </Form.Item>

        <Form.Item label="imageUrl" name="imageUrl">
          <Input disabled />
        </Form.Item>

        <Form.Item label="homeUrl" name="homeUrl">
          <Input disabled />
        </Form.Item>

        <div className="flex justify-center gap-5">
          <Button onClick={() => navigate(-1)} disabled={loading}>
            Go Back
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            disabled={loading}
            loading={loading}
          >
            Create
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default Index;
