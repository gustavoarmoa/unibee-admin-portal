import { LoadingOutlined } from '@ant-design/icons';
import {
  Button,
  Col,
  Form,
  FormInstance,
  Input,
  Pagination,
  Row,
  Select,
  Spin,
  Table,
  message,
} from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CURRENCY, SUBSCRIPTION_STATUS } from '../../constants';
import { showAmount } from '../../helpers';
import { useRelogin } from '../../hooks';
import { getSublist } from '../../requests';
import '../../shared.css';
import { ISubscriptionType } from '../../shared.types';
import { useAppConfigStore } from '../../stores';

const APP_PATH = import.meta.env.BASE_URL;
const PAGE_SIZE = 10;
const SUB_STATUS_FILTER = Object.keys(SUBSCRIPTION_STATUS)
  .map((s) => ({
    text: SUBSCRIPTION_STATUS[Number(s)],
    value: Number(s),
  }))
  .sort((a, b) => (a.value < b.value ? -1 : 1));

const columns: ColumnsType<ISubscriptionType> = [
  {
    title: 'Plan Name',
    dataIndex: 'planName',
    key: 'planName',
    render: (_, sub) => <span>{sub.plan?.planName}</span>,
  },
  {
    title: 'Description',
    dataIndex: 'description',
    key: 'description',
    render: (_, sub) => <span>{sub.plan?.description}</span>,
  },
  {
    title: 'Amount',
    dataIndex: 'amount',
    key: 'amount',
    render: (_, s) => (
      <span>{` ${showAmount(
        s.plan!.amount +
          (s.addons == null
            ? 0
            : s.addons!.reduce(
                // total subscription amount = plan amount + all addons(an array): amount * quantity
                // this value might not be the value users are gonna pay on next billing cycle
                // because, users might downgrade their plan.
                (
                  sum,
                  { quantity, amount }: { quantity: number; amount: number }, // destructure the quantity and amount from addon obj
                ) => sum + quantity * amount,
                0,
              )),
        s.plan!.currency,
      )} /${s.plan!.intervalCount == 1 ? '' : s.plan!.intervalCount}${
        s.plan!.intervalUnit
      } `}</span>
    ),
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (_, sub) => <span>{SUBSCRIPTION_STATUS[sub.status]}</span>,
    filters: SUB_STATUS_FILTER,
    // onFilter: (value, record) => record.status == value,
  },
  {
    title: 'Start',
    dataIndex: 'currentPeriodStart',
    key: 'currentPeriodStart',
    render: (_, sub) =>
      dayjs(sub.currentPeriodStart * 1000).format('YYYY-MMM-DD HH:MM'),
  },
  {
    title: 'End',
    dataIndex: 'currentPeriodEnd',
    key: 'currentPeriodEnd',
    render: (_, sub) =>
      dayjs(sub.currentPeriodEnd * 1000).format('YYYY-MMM-DD HH:MM'),
  },
  {
    title: 'User',
    dataIndex: 'userId',
    key: 'userId',
    render: (_, sub) => (
      <span>{`${sub.user != null ? sub.user.firstName + ' ' + sub.user.lastName : ''}`}</span>
    ),
  },
];

const Index = () => {
  const [subList, setSubList] = useState<ISubscriptionType[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const relogin = useRelogin();
  // const appConfigStore = useAppConfigStore();
  const [page, setPage] = useState(0); // pagination props
  const onPageChange = (page: number, pageSize: number) => setPage(page - 1);
  const [statusFilter, setStatusFilter] = useState<number[]>([]);

  const fetchData = async () => {
    setLoading(true);
    let subListRes;
    try {
      subListRes = await getSublist({
        page,
        pageSize: PAGE_SIZE,
        status: statusFilter,
      });
      setLoading(false);
      console.log('sublist res: ', subListRes);
      const code = subListRes.data.code;
      code == 61 && relogin(); // TODO: redesign the relogin component(popped in current page), so users don't have to be taken to /login
      if (code != 0) {
        throw new Error(subListRes.data.message);
      }
    } catch (err) {
      setLoading(false);
      if (err instanceof Error) {
        console.log('err getting sub list: ', err.message);
        message.error(err.message);
      } else {
        message.error('Unknown error');
      }
      return;
    }
    const list: ISubscriptionType[] =
      subListRes.data.data.subscriptions == null
        ? []
        : subListRes.data.data.subscriptions.map((s: any) => {
            return {
              ...s.subscription,
              plan: s.plan,
              addons:
                s.addons == null
                  ? []
                  : s.addons.map((a: any) => ({
                      ...a.addonPlan,
                      quantity: a.quantity,
                    })),
              user: s.user,
            };
          });
    setSubList(list);
  };

  const onTableChange: TableProps<ISubscriptionType>['onChange'] = (
    pagination,
    filters,
    sorter,
    extra,
  ) => {
    // console.log('params', pagination, filters, sorter, extra);
    if (filters.status == null) {
      setStatusFilter([]);
      return;
    }
    setStatusFilter(filters.status as number[]);
  };

  useEffect(() => {
    // console.log('page/statusFilter chnaged: ', page, '//', statusFilter);
    fetchData();
  }, [page, statusFilter]);

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
      <Table
        columns={columns}
        dataSource={subList}
        rowKey={'id'}
        rowClassName="clickable-tbl-row"
        pagination={false}
        onChange={onTableChange}
        onRow={(record, rowIndex) => {
          return {
            onClick: (event) => {
              navigate(`${APP_PATH}subscription/${record.subscriptionId}`, {
                state: { subscriptionId: record.subscriptionId },
              });
            },
          };
        }}
      />
      <div className="mx-0 my-4 flex items-center justify-end">
        <Pagination
          current={page + 1} // back-end starts with 0, front-end starts with 1
          pageSize={PAGE_SIZE}
          total={500}
          size="small"
          onChange={onPageChange}
          disabled={loading}
          showSizeChanger={false}
        />
      </div>
    </div>
  );
};

export default Index;

/*
const DEFAULT_TERM = { currency: 'EUR', status: [] };
const Search = ({
  form,
  goSearch,
}: {
  form: FormInstance<any>;
  goSearch: () => void;
}) => {
  const statusOpt = Object.keys(SUBSCRIPTION_STATUS).map((s) => ({
    value: Number(s),
    label: SUBSCRIPTION_STATUS[Number(s)],
  }));
  const clear = () => form.resetFields();
  const watchCurrency = Form.useWatch('currency', form);
  useEffect(() => {
    // just to trigger rerender when currency changed
  }, [watchCurrency]);

  const currencySymbol =
    CURRENCY[form.getFieldValue('currency') || DEFAULT_TERM.currency].symbol;

  return (
    <div>
      <Form form={form} initialValues={DEFAULT_TERM}>
        <Row className="flex items-center" gutter={[8, 8]}>
          <Col span={4}>First/Last name</Col>
          <Col span={4}>
            <Form.Item name="firstName" noStyle={true}>
              <Input onPressEnter={goSearch} />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item name="lastName" noStyle={true}>
              <Input onPressEnter={goSearch} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Button onClick={clear}>Clear</Button>
            &nbsp;&nbsp;&nbsp;&nbsp;
            <Button onClick={goSearch} type="primary">
              Search
            </Button>
          </Col>
        </Row>

        <Row className="flex items-center" gutter={[8, 8]}>
          <Col span={4}>
            <div className="flex items-center">
              <span className="mr-2">Amount</span>
              <Form.Item name="currency" noStyle={true}>
                <Select
                  style={{ width: 80 }}
                  options={[
                    { value: 'EUR', label: 'EUR' },
                    { value: 'USD', label: 'USD' },
                    { value: 'JPY', label: 'JPY' },
                  ]}
                />
              </Form.Item>
            </div>
          </Col>
          <Col span={4}>
            <Form.Item name="amountStart" noStyle={true}>
              <Input
                prefix={`from ${currencySymbol}`}
                onPressEnter={goSearch}
              />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item name="amountEnd" noStyle={true}>
              <Input prefix={`to ${currencySymbol}`} onPressEnter={goSearch} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <span className="mr-2">Status</span>
            <Form.Item name="status" noStyle={true}>
              <Select
                mode="multiple"
                options={statusOpt}
                style={{ maxWidth: 420, minWidth: 100, margin: '8px 0' }}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </div>
  );
};
*/
