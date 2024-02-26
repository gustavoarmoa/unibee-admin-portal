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
  Table,
  message,
} from 'antd';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SUBSCRIPTION_STATUS } from '../../constants';
import { useRelogin } from '../../hooks';
import { getUserListReq } from '../../requests';
import '../../shared.css';
import { IProfile } from '../../shared.types';
import { useAppConfigStore } from '../../stores';

const APP_PATH = import.meta.env.BASE_URL;
const PAGE_SIZE = 10;

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
    dataIndex: 'gmtCreate',
    key: 'gmtCreate',
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
  const appConfigStore = useAppConfigStore();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<IProfile[]>([]);
  const [page, setPage] = useState(0); // pagination props
  const onPageChange = (page: number, pageSize: number) => setPage(page - 1);
  const [form] = Form.useForm();
  const relogin = useRelogin();

  const fetchData = async () => {
    const searchTerm = form.getFieldsValue();
    try {
      setLoading(true);
      const res = await getUserListReq({
        merchantId: appConfigStore.MerchantId,
        page,
        count: PAGE_SIZE,
        ...searchTerm,
      });
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

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchData();
  }, [page]);

  // console.log("users: ", users);
  return (
    <div>
      <Search form={form} goSearch={fetchData} searching={loading} />
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
const DEFAULT_SEARCH_TERM = {
  firstName: '',
  lastName: '',
  email: '',
};
const Search = ({
  form,
  searching,
  goSearch,
}: {
  form: FormInstance<any>;
  searching: boolean;
  goSearch: () => void;
}) => {
  const clear = () => form.resetFields();

  return (
    <div>
      <Form form={form} initialValues={DEFAULT_SEARCH_TERM}>
        <Row className="flex items-center" gutter={[8, 8]}>
          <Col span={3}>First/Last name</Col>
          <Col span={4}>
            <Form.Item name="firstName" noStyle={true}>
              <Input onPressEnter={goSearch} placeholder="first name" />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item name="lastName" noStyle={true}>
              <Input onPressEnter={goSearch} placeholder="last name" />
            </Form.Item>
          </Col>

          <Col span={6} className="flex justify-end">
            <Button onClick={clear} disabled={searching}>
              Clear
            </Button>
            &nbsp;&nbsp;&nbsp;&nbsp;
            <Button
              onClick={goSearch}
              type="primary"
              loading={searching}
              disabled={searching}
            >
              Search
            </Button>
          </Col>
        </Row>
        <Row className="my-3 flex items-center" gutter={[8, 8]}>
          <Col span={3}>Email</Col>
          <Col span={4}>
            <Form.Item name="email" noStyle={true}>
              <Input onPressEnter={goSearch} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </div>
  );
};