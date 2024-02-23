import {
  CheckCircleOutlined,
  LoadingOutlined,
  MinusOutlined,
} from '@ant-design/icons';
import type { SelectProps } from 'antd';
import { Button, Form, Input, Select, Spin, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CURRENCY, PLAN_STATUS } from '../../constants';
import { useRelogin } from '../../hooks';
import {
  activatePlan,
  getMetricsListReq,
  getPlanDetail,
  getPlanList,
  savePlan,
  togglePublishReq,
} from '../../requests';
import { IPlan } from '../../shared.types';
import { useAppConfigStore } from '../../stores';

// const APP_PATH = import.meta.env.BASE_URL;

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
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const relogin = useRelogin();

  const itvCountValue = Form.useWatch('intervalCount', form);
  const itvCountUnit = Form.useWatch('intervalUnit', form);
  const addonCurrency = Form.useWatch('currency', form);
  // The selector is static and does not support closures.
  // const customValue = Form.useWatch((values) => `name: ${values.itvCountValue || ''}`, form);

  useEffect(() => {
    if (plan?.status != 1) {
      // 1: editing, 2: active
      return;
    }
    if (plan.type == 2) {
      // 1: main plan, 2: addon
      return;
    }
    // main plan's currency/intervalUnit-Count must match its addons currency/*** */
    const newAddons = addons.filter(
      (a) =>
        a.intervalCount == itvCountValue &&
        a.intervalUnit == itvCountUnit &&
        a.currency == addonCurrency,
    );
    setSelectAddons(newAddons);
    // when editing addon, don't do anything in this effect.
    // once changed, I'm gonna clear the selected addons,
  }, [itvCountUnit, itvCountValue, addonCurrency]);

  const onSave = async (values: any) => {
    const f = JSON.parse(JSON.stringify(values));
    f.amount = Number(f.amount);
    f.amount *= CURRENCY[f.currency].stripe_factor;

    f.intervalCount = Number(f.intervalCount);
    f.planId = values.id;
    console.log('saving plan form: ', f);

    try {
      setLoading(true);
      const savePlanRes = await savePlan(f);
      setLoading(false);
      const statuCode = savePlanRes.data.code;
      if (statuCode != 0) {
        statuCode == 61 && relogin();
        throw new Error(savePlanRes.data.message);
      }
      message.success('Plan saved');
    } catch (err) {
      setLoading(false);
      if (err instanceof Error) {
        console.log('plan saving err: ', err.message);
        message.error(err.message);
      } else {
        message.error('Unknown error');
      }
      return;
    }
  };

  const onActivate = async () => {
    const planId = Number(params.planId);
    if (isNaN(planId)) {
      message.error('Invalid planId');
      return;
    }
    try {
      setActivating(true);
      const activateRes = await activatePlan(planId);
      setActivating(false);
      console.log('activate plan res: ', activateRes);
      const statuCode = activateRes.data.code;
      if (statuCode != 0) {
        statuCode == 61 && relogin();
        throw new Error(activateRes.data.message);
      }
      message.success('Plan activated');
      setTimeout(() => {
        navigate(-1);
      }, 2000);
    } catch (err) {
      setActivating(false);
      if (err instanceof Error) {
        console.log('plan activate err: ', err.message);
        message.error(err.message);
      } else {
        message.error('Unknown error');
      }
      return;
    }
  };

  const fetchData = async () => {
    const planId = Number(params.planId);
    if (isNaN(planId)) {
      return;
    }
    let addonListRes: any, planDetailRes: any, metricsListRes: any;
    try {
      setLoading(true);
      const res = ([addonListRes, planDetailRes, metricsListRes] =
        await Promise.all([
          getPlanList({
            type: 2, // addon
            status: 2, // active
            page: 0,
            pageSize: 100,
          }), // let's assume there are at most 100 addons.
          getPlanDetail(planId), // plan detail page need to show a list of addons to attach.
          getMetricsListReq(),
        ]));
      setLoading(false);
      console.log(
        '[addonListRes, planDetailRes, metricsListRes]',
        addonListRes,
        '///',
        planDetailRes,
        '///',
        metricsListRes,
      );

      res.forEach((r) => {
        const code = r.data.code;
        code == 61 && relogin(); // TODO: redesign the relogin component(popped in current page), so users don't have to be taken to /login
        if (code != 0) {
          throw new Error(r.data.message);
        }
      });
    } catch (err) {
      setLoading(false);
      if (err instanceof Error) {
        console.log('err in detail page: ', err.message);
        message.error(err.message);
      } else {
        message.error('Unknown error');
      }
      return;
    }

    // plan obj and addon obj are at the same level in planDetailRes.data.data obj
    // but I want to put addonIds obj as a props of the local plan obj.
    planDetailRes.data.data.Plan.plan.amount = getAmount(
      planDetailRes.data.data.Plan.plan.amount,
      planDetailRes.data.data.Plan.plan.currency,
    ); // /= 100; // TODO: addon also need to do the same, use a fn to do this

    planDetailRes.data.data.Plan.plan.addonIds =
      planDetailRes.data.data.Plan.addonIds == null
        ? []
        : planDetailRes.data.data.Plan.addonIds;

    setPlan(planDetailRes.data.data.Plan.plan);

    const addons = addonListRes.data.data.Plans.map((p: any) => p.plan);
    setAddons(addons);
    setSelectAddons(
      addons.filter(
        (a: any) =>
          a.intervalCount == planDetailRes.data.data.Plan.plan.intervalCount &&
          a.intervalUnit == planDetailRes.data.data.Plan.plan.intervalUnit &&
          a.currency == planDetailRes.data.data.Plan.plan.currency,
      ),
    );
  };

  const togglePublish = async () => {
    setPublishing(true);
    try {
      const publishRes = await togglePublishReq({
        planId: plan!.id,
        publishAction: plan!.publishStatus == 1 ? 'PUBLISH' : 'UNPUBLISH',
      });
      setPublishing(false);
      console.log('toggle publish res: ', publishRes);
      const statusCode = publishRes.data.code;
      if (statusCode != 0) {
        statusCode == 61 && relogin();
        throw new Error(publishRes.data.message);
      }
      fetchData();
    } catch (err) {
      setPublishing(false);
      if (err instanceof Error) {
        console.log('err toggleing publish status: ', err.message);
        message.error(err.message);
      } else {
        message.error('Unknown error');
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      <Spin
        spinning={loading}
        indicator={
          <LoadingOutlined style={{ fontSize: 32, color: '#FFF' }} spin />
        }
        fullscreen
      />
      {plan && (
        <Form
          form={form}
          onFinish={onSave}
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 24 }}
          layout="horizontal"
          // disabled={componentDisabled}
          style={{ maxWidth: 600 }}
          initialValues={plan}
        >
          <Form.Item label="ID" name="id" hidden>
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

          <Form.Item label="Status" name="status">
            <span>{PLAN_STATUS[plan.status]}</span>
          </Form.Item>

          <Form.Item label="Is Published" name="publishStatus">
            <div>
              <span>
                {plan.publishStatus == 2 ? (
                  <CheckCircleOutlined
                    style={{ color: 'green', fontSize: '18px' }}
                  />
                ) : (
                  <MinusOutlined style={{ color: 'red', fontSize: '18px' }} />
                )}{' '}
              </span>
              <Button
                style={{ marginLeft: '12px' }}
                onClick={togglePublish}
                loading={publishing || loading}
                disabled={plan.status != 2 || publishing || loading}
              >
                {/* 2: active, you can only publish/unpublish an active plan */}
                {plan.publishStatus == 2 ? 'Unpublish' : 'Publish'}
              </Button>
            </div>
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
                CURRENCY[form.getFieldValue('currency') ?? plan.currency].symbol
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
              disabled
              options={[
                { value: 1, label: 'Main plan' },
                { value: 2, label: 'Addon' },
              ]}
            />
          </Form.Item>

          {plan.type == 1 && (
            <Form.Item label="Add-ons" name="addonIds">
              <Select
                mode="multiple"
                allowClear
                style={{ width: '100%' }}
                options={selectAddons.map((a) => ({
                  label: a.planName,
                  value: a.id,
                }))}
              />
            </Form.Item>
          )}

          <Form.Item label="Product Name" name="productName" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            label="Product Description"
            name="productDescription"
            hidden
          >
            <Input />
          </Form.Item>

          <Form.Item label="imageUrl" name="imageUrl" hidden>
            <Input disabled />
          </Form.Item>

          <Form.Item label="homeUrl" name="homeUrl" hidden>
            <Input disabled />
          </Form.Item>

          <div className="flex justify-center gap-5">
            <Button
              onClick={() => navigate(-1)}
              disabled={loading || activating}
            >
              Go Back
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              disabled={plan.status != 1 || loading || activating}
            >
              Save
            </Button>
            <Button
              onClick={onActivate}
              loading={activating}
              disabled={plan.status != 1 || activating || loading}
            >
              Activate
            </Button>
          </div>
        </Form>
      )}
    </div>
  );
};

export default Index;
