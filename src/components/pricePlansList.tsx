import {
  CheckCircleOutlined,
  LoadingOutlined,
  MinusOutlined,
} from '@ant-design/icons';
import { Button, Space, Table, Tag, Tooltip, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PLAN_STATUS } from '../constants';
import { showAmount } from '../helpers';
import { useRelogin } from '../hooks';
import { getPlanList } from '../requests';
import '../shared.css';
import { IPlan } from '../shared.types';

const APP_PATH = import.meta.env.BASE_URL;
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
    render: (_, plan) => {
      return <span>{PLAN_STATUS[plan.status]}</span>;
    },
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
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<IPlan[]>([]);
  const relogin = useRelogin();

  useEffect(() => {
    const fetchPlan = async () => {
      setLoading(true);
      try {
        const planListRes = await getPlanList({
          type: undefined, // get main plan and addon
          status: undefined, // active, inactive, expired, editing, all of them
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
    fetchPlan();
  }, []);

  return (
    <>
      <div
        style={{ padding: '16px 0', display: 'flex', justifyContent: 'end' }}
      >
        <Button
          type="primary"
          onClick={() => {
            navigate(`${APP_PATH}plan/new`);
          }}
        >
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
        onRow={(record, rowIndex) => {
          return {
            onClick: (event) => {
              console.log('row click: ', record, '///', rowIndex);
              navigate(`${APP_PATH}plan/${record.id}`);
            }, // click row
            // onDoubleClick: (event) => {}, // double click row
            // onContextMenu: (event) => {}, // right button click row
            // onMouseEnter: (event) => {}, // mouse enter row
            // onMouseLeave: (event) => {}, // mouse leave row
          };
        }}
      />
    </>
  );
};

export default Index;
