import {
  CheckCircleOutlined,
  LoadingOutlined,
  MinusOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { SelectProps } from 'antd';
import { Button, Col, Form, Input, Row, Select, Spin, message } from 'antd';
import update from 'immutability-helper';
import React, { ReactElement, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CURRENCY, PLAN_STATUS } from '../../constants';
import { ramdonString } from '../../helpers';
import { useRelogin } from '../../hooks';
import {
  activatePlan,
  createPlan,
  getMetricsListReq,
  getPlanDetail,
  getPlanList,
  savePlan,
  togglePublishReq,
} from '../../requests';
import { IBillableMetrics, IPlan } from '../../shared.types';
import { useAppConfigStore } from '../../stores';

const APP_PATH = import.meta.env.BASE_URL;
const getAmount = (amt: number, currency: string) =>
  amt / CURRENCY[currency].stripe_factor;

type TMetricsItem = {
  localId: string;
  metricId?: number;
  metricLimit?: number | string;
};
type TNewPlan = {
  currency: string;
  intervalUnit: string;
  intervalCount: number;
  status: number;
  publishStatus: number;
  type: number; // 1: main, 2: add-on
  imageUrl: string;
  homeUrl: string;
  addonIds: number[];
  metricLimits: TMetricsItem[];
};
const NEW_PLAN: TNewPlan = {
  currency: 'EUR',
  intervalUnit: 'month',
  intervalCount: 1,
  status: 1, // 1: editing，2: active, 3: inactive，4: expired
  publishStatus: 1, //  // 1: unpublished(not visible to users), 2: published(users could see and choose this plan)
  type: 1, // 1: main, 2: add-on
  imageUrl: 'http://www.google.com',
  homeUrl: 'http://www.google.com',
  addonIds: [],
  metricLimits: [],
};

// this component has the similar structure with newPlan.tsx, try to refactor them into one.
const Index = () => {
  const params = useParams();
  const planId = params.planId;
  const isNew = planId == null;
  console.log('planId , isNew: ', planId, '//', isNew);

  // const appConfigStore = useAppConfigStore();
  const [loading, setLoading] = useState(false);
  const [activating, setActivating] = useState(false);
  const [publishing, setPublishing] = useState(false); // when toggling publish/unpublish
  const [plan, setPlan] = useState<IPlan | TNewPlan | null>(
    isNew ? NEW_PLAN : null,
  ); // plan obj is used for Form's initialValue, any changes is handled by Form itself, not updated here.
  const [addons, setAddons] = useState<IPlan[]>([]); // all the active addons we have (addon has the same structure as Plan).
  const [selectAddons, setSelectAddons] = useState<IPlan[]>([]); // addon list in <Select /> for the current main plan, this list will change based on different plan props(interval count/unit/currency)
  const [metricsList, setMetricsList] = useState<IBillableMetrics[]>([]); // all the billable metrics, not used for edit, but used in <Select /> for user to choose.
  const [selectedMetrics, setSelectedMetrics] = useState<TMetricsItem[]>([]);
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const relogin = useRelogin();

  const itvCountValue = Form.useWatch('intervalCount', form);
  const itvCountUnit = Form.useWatch('intervalUnit', form);
  const addonCurrency = Form.useWatch('currency', form);
  const planTypeWatch = Form.useWatch('type', form);
  // The selector is static and does not support closures.
  // const customValue = Form.useWatch((values) => `name: ${values.itvCountValue || ''}`, form);

  useEffect(() => {
    if (!isNew && plan?.status != 1) {
      // 1: editing, 2: active
      return;
    }
    if (!isNew && plan?.type == 2) {
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

    if (!isNew) {
      f.planId = f.id;
      delete f.id;
      delete f.status;
      delete f.publishStatus;
      delete f.type; // once plan created, you cannot change its type(main plan, addon)
    }
    let m = JSON.parse(JSON.stringify(selectedMetrics)); // selectedMetrics.map(metric => ({metricLimit: Number(metric.metricLimit)}))
    m = m.map((metrics: any) => ({
      metricId: metrics.metricId,
      metricLimit: Number(metrics.metricLimit),
    }));
    m = m.filter((metric: any) => !isNaN(metric.metricLimit));
    f.metricLimits = m;

    console.log('saving plan form: ', f);

    // return;
    const actionMethod = isNew ? createPlan : savePlan;
    try {
      setLoading(true);
      const res = await actionMethod(f);
      setLoading(false);
      const statusCode = res.data.code;
      if (statusCode != 0) {
        statusCode == 61 && relogin();
        throw new Error(res.data.message);
      }
      message.success(`Plan ${isNew ? 'created' : 'saved'}`);
      setTimeout(() => {
        navigate(`${APP_PATH}plan/list`);
      }, 1500);
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
        navigate(`${APP_PATH}plan/list`);
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

    let addonList: any, planDetail: any, metricsList: any;
    let errAddonList: Error, errPlanDetail: Error, errMetricList: Error;

    setLoading(true);
    const res = ([
      [addonList, errAddonList],
      [planDetail, errPlanDetail],
      [metricsList, errMetricList],
    ] = await Promise.all([
      getPlanList({
        type: 2, // addon
        status: 2, // active
        page: 0,
        count: 100,
      }), // let's assume there are at most 100 addons.
      isNew
        ? Promise.resolve([{ data: { data: null, code: 0 } }, null])
        : getPlanDetail(planId), // plan detail page need to show a list of addons to attach.
      getMetricsListReq(fetchData),
    ]));
    setLoading(false);
    console.log(
      '[addonListRes, planDetailRes, metricsListRes]',
      addonList,
      '///',
      planDetail,
      '///',
      metricsList,
    );

    if (errAddonList != null) {
      message.error(errAddonList.message);
      return;
    } else if (errPlanDetail != null) {
      message.error(errPlanDetail.message);
      return;
    } else if (errMetricList != null) {
      message.error(errMetricList.message);
      return;
    }

    const addons = addonList.map((p: any) => p.plan);
    setAddons(addons);
    setMetricsList(metricsList);
    if (isNew) {
      return;
    }
    // for editing existing plan, we continue with planDetailRes

    // plan obj and addon obj are at the same level in planDetailRes.data.data obj
    // but I want to put addonIds obj as a props of the local plan obj.
    planDetail.plan.amount = getAmount(
      planDetail.plan.amount,
      planDetail.plan.currency,
    ); // /= 100; // TODO: addon also need to do the same, use a fn to do this

    planDetail.plan.addonIds =
      planDetail.addonIds == null ? [] : planDetail.addonIds;

    // todo: planDetailRes.data.data.Plan.plan, add localId

    setPlan(planDetail.plan);
    form.setFieldsValue(planDetail.plan);

    if (!isNew) {
      const metrics = planDetail.metricPlanLimits.map((m: any) => ({
        localId: ramdonString(8),
        metricId: m.metricId,
        metricLimit: m.metricLimit,
      }));
      setSelectedMetrics(metrics);
    }

    setSelectAddons(
      addons.filter(
        (a: any) =>
          a.intervalCount == planDetail.plan.intervalCount &&
          a.intervalUnit == planDetail.plan.intervalUnit &&
          a.currency == planDetail.plan.currency,
      ),
    );
  };

  // used only in editing an existing plan
  const togglePublish = async () => {
    setPublishing(true);
    try {
      const publishRes = await togglePublishReq({
        planId: (plan as IPlan).id,
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

  // it just adds an empty metrics item
  const addMetrics = () => {
    const m: TMetricsItem = { localId: ramdonString(8) };
    setSelectedMetrics(update(selectedMetrics, { $push: [m] }));
  };

  const removeMetrics = (localId: string) => {
    const idx = selectedMetrics.findIndex((m) => m.localId == localId);
    if (idx != -1) {
      setSelectedMetrics(update(selectedMetrics, { $splice: [[idx, 1]] }));
    }
  };

  const updateMetrics =
    (localId: string) => (evt: React.ChangeEvent<HTMLInputElement>) => {
      const idx = selectedMetrics.findIndex((m) => m.localId == localId);
      console.log('localId: ', localId);
      if (idx != -1) {
        setSelectedMetrics(
          update(selectedMetrics, {
            [idx]: { metricLimit: { $set: evt.target.value } },
          }),
        );
      }
    };

  const onMetricSelectChange = (localId: string) => (val: number) => {
    const idx = selectedMetrics.findIndex((m) => m.localId == localId);
    if (idx != -1) {
      let newMetrics = update(selectedMetrics, {
        [idx]: { metricId: { $set: val } },
      });
      setSelectedMetrics(newMetrics);
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
          labelCol={{ span: 3 }}
          wrapperCol={{ span: 24 }}
          layout="horizontal"
          // disabled={componentDisabled}
          // style={{ maxWidth: 1024 }}
          initialValues={plan}
        >
          {!isNew && (
            <Form.Item label="ID" name="id" hidden>
              <Input disabled />
            </Form.Item>
          )}

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
              disabled={!isNew || plan.status != 1}
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
                disabled={planTypeWatch == 2} // you cannot add addon to another addon
                style={{ width: '100%' }}
                options={selectAddons.map((a) => ({
                  label: a.planName,
                  value: a.id,
                }))}
              />
            </Form.Item>
          )}

          <Form.Item label="Billable Metrics">
            <Row
              gutter={[8, 8]}
              style={{ marginBottom: '0' }}
              className=" font-bold text-gray-500"
            >
              <Col span={5}>Name</Col>
              <Col span={3}>Code</Col>
              <Col span={6}>Description</Col>
              <Col span={5}>Aggregation Property</Col>
              <Col span={3}>Limit Value</Col>
              <Col span={2}>
                <div
                  onClick={addMetrics}
                  className="w-16 cursor-pointer font-bold"
                >
                  <PlusOutlined />
                </div>
              </Col>
            </Row>
            {selectedMetrics.map((m) => (
              <Row key={m.localId} gutter={[8, 8]} className="my-4">
                <Col span={5}>
                  <Select
                    value={m.metricId}
                    onChange={onMetricSelectChange(m.localId)}
                    style={{ width: 180 }}
                    options={metricsList.map((m) => ({
                      label: m.metricName,
                      value: m.id,
                    }))}
                  />
                </Col>
                <Col span={3}>
                  {' '}
                  {metricsList.find((metric) => metric.id == m.metricId)?.code}
                </Col>
                <Col span={6}>
                  {
                    metricsList.find((metric) => metric.id == m.metricId)
                      ?.metricDescription
                  }
                </Col>
                <Col span={5}>
                  {' '}
                  {
                    metricsList.find((metric) => metric.id == m.metricId)
                      ?.aggregationProperty
                  }
                </Col>
                <Col span={3}>
                  <Input
                    value={m.metricLimit}
                    onChange={updateMetrics(m.localId)}
                  />
                </Col>
                <Col span={2}>
                  <div
                    onClick={() => removeMetrics(m.localId)}
                    className="w-16 cursor-pointer font-bold"
                  >
                    <MinusOutlined />
                  </div>
                </Col>
              </Row>
            ))}
          </Form.Item>

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
              onClick={() => navigate(`${APP_PATH}plan/list`)}
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
            {!isNew && (
              <Button
                onClick={onActivate}
                loading={activating}
                disabled={isNew || plan.status != 1 || activating || loading}
              >
                Activate
              </Button>
            )}
          </div>
        </Form>
      )}
    </div>
  );
};

export default Index;
