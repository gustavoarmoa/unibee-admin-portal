import {
  CheckCircleOutlined,
  LoadingOutlined,
  MinusOutlined,
} from '@ant-design/icons';
import { Button, Pagination, Space, Table, Tag, Tooltip, message } from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PLAN_STATUS } from '../../constants';
import { showAmount } from '../../helpers';
import { useRelogin } from '../../hooks';
import { getPlanList } from '../../requests';
import { IPlan } from '../../shared.types';
import { useAppConfigStore } from '../../stores';

import '../../shared.css';

const PAGE_SIZE = 10;
const APP_PATH = import.meta.env.BASE_URL;
const PLAN_STATUS_FILTER = Object.keys(PLAN_STATUS)
  .map((s) => ({
    text: PLAN_STATUS[Number(s)],
    value: Number(s),
  }))
  .sort((a, b) => (a.value < b.value ? -1 : 1));
console.log('plan fiiltr: ', PLAN_STATUS_FILTER);

const columns: ColumnsType<IPlan> = [
  {
    title: 'Name',
    dataIndex: 'planName',
    key: 'planName',
    // render: (text) => <a>{text}</a>,
  },
  {
    title: 'Description',
    dataIndex: 'description',
    key: 'description',
  },
  {
    title: 'Price',
    dataIndex: 'price',
    key: 'price',
    render: (_, p) => {
      return (
        <span>{` ${showAmount(p.amount, p.currency)} /${
          p.intervalCount == 1 ? '' : p.intervalCount
        }${p.intervalUnit} `}</span>
      );
    },
  },
  {
    title: 'Type',
    dataIndex: 'type',
    key: 'type',
    render: (_, plan) => {
      return plan.type == 1 ? <span>Main plan</span> : <span>Add-on</span>;
    },
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (_, plan) => <span>{PLAN_STATUS[plan.status]}</span>,
    filters: PLAN_STATUS_FILTER,
    onFilter: (value, record) => record.status == value,
  },
  {
    title: 'Published',
    dataIndex: 'publishStatus',
    key: 'publishStatus',
    render: (publishStatus, plan) =>
      publishStatus == 2 ? (
        <CheckCircleOutlined style={{ color: 'green' }} />
      ) : (
        <MinusOutlined style={{ color: 'red' }} />
      ),
  },
  {
    title: 'Action',
    key: 'action',
    render: (_, record) => (
      <Space size="middle">
        <a>Edit</a>
      </Space>
    ),
  },
];

const Index = () => {
  const navigate = useNavigate();
  const appConfigStore = useAppConfigStore();
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<IPlan[]>([]);
  const [page, setPage] = useState(0); // pagination props
  const onPageChange = (page: number, pageSize: number) => setPage(page - 1);
  const relogin = useRelogin();

  const fetchPlan = async () => {
    setLoading(true);
    try {
      const planListRes = await getPlanList({
        merchantId: appConfigStore.MerchantId,
        // type: undefined, // get main plan and addon
        // status: undefined, // active, inactive, expired, editing, all of them
        page,
        pageSize: PAGE_SIZE,
      });
      setLoading(false);
      console.log('plan list res: ', planListRes);
      const statusCode = planListRes.data.code;
      if (statusCode != 0) {
        statusCode == 61 && relogin();
        throw new Error(planListRes.data.message);
      }
      if (planListRes.data.data.Plans == null) {
        return;
      }
      setPlan(planListRes.data.data.Plans.map((p: any) => ({ ...p.plan })));
    } catch (err) {
      setLoading(false);
      if (err instanceof Error) {
        console.log('err getting planlist: ', err.message);
        message.error(err.message);
      } else {
        message.error('Unknown error');
      }
    }
  };

  const onTableChange: TableProps<IPlan>['onChange'] = (
    pagination,
    filters,
    sorter,
    extra,
  ) => {
    console.log('params', pagination, filters, sorter, extra);
    if (filters.status == null) {
      return;
    }
    // setStatusFilter(filters.status as number[]);
  };

  const onNewPlan = () => {
    setPage(0); // if user are on page 3, after creating new plan, they'll be redirected back to page 1,so the newly created plan will be shown on the top
    navigate(`${APP_PATH}plan/new`);
  };

  useEffect(() => {
    fetchPlan();
  }, []);

  useEffect(() => {
    fetchPlan();
  }, [page]);

  return (
    <>
      <div
        style={{ padding: '16px 0', display: 'flex', justifyContent: 'end' }}
      >
        <Button type="primary" onClick={onNewPlan}>
          New plan
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={plan}
        rowKey={'id'}
        rowClassName="clickable-tbl-row"
        pagination={false}
        loading={{
          spinning: loading,
          indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />,
        }}
        onChange={onTableChange}
        onRow={(record, rowIndex) => {
          return {
            onClick: (event) => {
              console.log('row click: ', record, '///', rowIndex);
              navigate(`${APP_PATH}plan/${record.id}`);
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
    </>
  );
};

export default Index;
