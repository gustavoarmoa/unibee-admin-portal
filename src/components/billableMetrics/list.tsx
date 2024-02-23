import {
  CheckCircleOutlined,
  LoadingOutlined,
  MinusOutlined,
} from '@ant-design/icons';
import { Button, Pagination, Space, Table, Tag, Tooltip, message } from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  METRICS_AGGREGATE_TYPE,
  METRICS_TYPE,
  PLAN_STATUS,
} from '../../constants';
import { useRelogin } from '../../hooks';
import { getMetricsListReq } from '../../requests';
import { IBillableMetrics } from '../../shared.types';
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

const columns: ColumnsType<IBillableMetrics> = [
  {
    title: 'Name',
    dataIndex: 'metricName',
    key: 'metricName',
    // render: (text) => <a>{text}</a>,
  },

  {
    title: 'Code',
    dataIndex: 'code',
    key: 'code',
  },
  {
    title: 'Description',
    dataIndex: 'metricDescription',
    key: 'metricDescription',
  },
  {
    title: 'Type',
    dataIndex: 'type',
    key: 'type',
    render: (t, metrics) => {
      return <span>{METRICS_TYPE[t]}</span>;
    },
  },
  {
    title: 'Aggregation Type',
    dataIndex: 'aggregationType',
    key: 'aggregationType',
    render: (aggreType, metrics) => {
      return <span>{METRICS_AGGREGATE_TYPE[aggreType]}</span>;
    },
  },
  {
    title: 'Aggregation Property',
    dataIndex: 'aggregationProperty',
    key: 'aggregationProperty',
    render: (prop, metrics) => <span>{prop}</span>,
    // filters: PLAN_STATUS_FILTER,
    // onFilter: (value, record) => record.status == value,
  },
  {
    title: 'Updated at',
    dataIndex: 'gmtModify',
    key: 'gmtModify',
    render: (d, metrics) => dayjs(d * 1000).format('YYYY-MMM-DD'),
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
  // const appConfigStore = useAppConfigStore();
  const [loading, setLoading] = useState(false);
  const [metricsList, setMetricsList] = useState<IBillableMetrics[]>([]);
  const [page, setPage] = useState(0); // pagination props
  const onPageChange = (page: number, pageSize: number) => setPage(page - 1);
  const relogin = useRelogin();

  const fetchMetricsList = async () => {
    setLoading(true);
    try {
      const metricsListRes = await getMetricsListReq();
      setLoading(false);
      console.log('metrics list res: ', metricsListRes);
      const statusCode = metricsListRes.data.code;
      if (statusCode != 0) {
        statusCode == 61 && relogin();
        throw new Error(metricsListRes.data.message);
      }
      setMetricsList(metricsListRes.data.data.merchantMetrics);
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

  const onTableChange: TableProps<IBillableMetrics>['onChange'] = (
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

  const onNewMetrics = () => {
    setPage(0); // if user are on page 3, after creating new plan, they'll be redirected back to page 1,so the newly created plan will be shown on the top
    navigate(`${APP_PATH}billable-metrics/new`);
  };

  useEffect(() => {
    // fetchPlan();
    fetchMetricsList();
  }, []);

  /*
  useEffect(() => {
    // fetchPlan();
  }, [page]);
  */

  return (
    <>
      <div
        style={{ padding: '16px 0', display: 'flex', justifyContent: 'end' }}
      >
        <Button type="primary" onClick={onNewMetrics}>
          New Billable Metrics
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={metricsList}
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
              navigate(`${APP_PATH}billable-metrics/${record.id}`);
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
/*
  navigate(`${APP_PATH}profile/subscription`, {
        state: { from: 'login' },
      });
*/
