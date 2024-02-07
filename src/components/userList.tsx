import { LoadingOutlined } from '@ant-design/icons';
import { Table, message } from 'antd';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SUBSCRIPTION_STATUS } from '../constants';
import { useRelogin } from '../hooks';
import { searchUserReq } from '../requests';
import '../shared.css';
import { IProfile } from '../shared.types';
const APP_PATH = import.meta.env.BASE_URL;

const columns: ColumnsType<IProfile> = [
  {
    title: 'First Name',
    dataIndex: 'firstName',
    key: 'firstName',
    // render: (text) => <a>{text}</a>,
  },
  {
    title: 'Last Name',
    dataIndex: 'lastName',
    key: 'lastName',
  },
  {
    title: 'Email',
    dataIndex: 'email',
    key: 'email',
  },
  {
    title: 'Created at',
    dataIndex: 'createTime',
    key: 'createTime',
    render: (d, plan) => dayjs(d).format('YYYY-MMM-DD'), // new Date(d).toLocaleDateString(),
  },
  {
    title: 'Subscription',
    dataIndex: 'subscriptionName',
    key: 'subscriptionName',
  },
  {
    title: 'Sub Status',
    dataIndex: 'subscriptionStatus',
    key: 'subscriptionStatus',
    render: (status, plan) => SUBSCRIPTION_STATUS[status],
  },
  {
    title: 'Sub Amt',
    key: 'recurringAmount',
    // render: (amt, record) => <span>{amt}</span>,
  },
];

const Index = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<IProfile[]>([]);
  const relogin = useRelogin();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await searchUserReq();
        setLoading(false);
        console.log('res getting user: ', res);
        const code = res.data.code;
        if (code != 0) {
          code == 61 && relogin();
          throw new Error(res.data.message);
        }
        setUsers(res.data.data.userAccounts);
      } catch (err) {
        setLoading(false);
        if (err instanceof Error) {
          console.log(`err getting user: `, err.message);
          message.error(err.message);
        } else {
          message.error('Unknown error');
        }
      }
    };
    fetchData();
  }, []);

  // console.log("users: ", users);
  return (
    <div>
      <Search />
      <Table
        columns={columns}
        dataSource={users}
        rowKey={'id'}
        rowClassName="clickable-tbl-row"
        pagination={false}
        loading={{
          spinning: loading,
          indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />,
        }}
        onRow={(user, rowIndex) => {
          return {
            onClick: (event) => {
              console.log('row click: ', user, '///', rowIndex);
              navigate(`${APP_PATH}customer/${user.id}`);
            },
          };
        }}
      />
    </div>
  );
};

export default Index;

const Search = () => {
  return (
    <div>
      <div>payment method dropdown</div>
      <div>subscription plan dropdown</div>
      <div>subscription amt from/to Input</div>
    </div>
  );
};
