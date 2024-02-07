import { LoadingOutlined } from '@ant-design/icons';
import { Spin, Table, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SUBSCRIPTION_STATUS } from '../constants';
import { showAmount } from '../helpers';
import { useRelogin } from '../hooks';
import { getSublist } from '../requests';
import '../shared.css';
import { ISubscriptionType } from '../shared.types';

const APP_PATH = import.meta.env.BASE_URL;

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
      <span>{`${sub.user != null ? sub.user.email : ''}`}</span>
    ),
  },
];

const Index = () => {
  const [subList, setSubList] = useState<ISubscriptionType[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const relogin = useRelogin();

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      let subListRes;
      try {
        subListRes = await getSublist();
        console.log('sublist res: ', subListRes);
        const code = subListRes.data.code;
        code == 61 && relogin(); // TODO: redesign the relogin component(popped in current page), so users don't have to be taken to /login
        if (code != 0) {
          // TODO: save all the code as ENUM in constant,
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
      setLoading(false);
      setSubList(list);
    };

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
    </div>
  );
};

export default Index;
