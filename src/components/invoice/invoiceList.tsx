import { LoadingOutlined } from '@ant-design/icons';
import {
  Button,
  Checkbox,
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
import { CURRENCY, INVOICE_STATUS, SUBSCRIPTION_STATUS } from '../../constants';
import { showAmount } from '../../helpers';
import { useRelogin } from '../../hooks';
import { getInvoiceList } from '../../requests';
import '../../shared.css';
import { IProfile, UserInvoice } from '../../shared.types';
import { useAppConfigStore } from '../../stores';

const PAGE_SIZE = 10;
const APP_PATH = import.meta.env.BASE_URL;

const Index = () => {
  const navigate = useNavigate();
  const appConfigStore = useAppConfigStore();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0); // pagination props
  const onPageChange = (page: number, pageSize: number) => setPage(page - 1);
  const [invoiceList, setInvoiceList] = useState<UserInvoice[]>([]);

  const relogin = useRelogin();

  const goToDetail = (invoiceId: string) => (evt: any) => {
    console.log('go to detail: ', evt.target);
    if (evt.target.closest('.unibee-user-id-wrapper')) {
      return;
    }
    navigate(`${APP_PATH}invoice/${invoiceId}`);
  };

  const goToUser = () => {
    console.log('got to user');
  };

  const columns: ColumnsType<UserInvoice> = [
    {
      title: 'Invoice Name',
      dataIndex: 'invoiceName',
      key: 'invoiceName',
      // render: (text) => <a>{text}</a>,
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amt, iv) => (
        <div>
          <span>{showAmount(amt, iv.currency)}</span>
          <span
            style={{ fontSize: '11px', color: '#757575' }}
          >{` (tax: ${showAmount(iv.taxAmount, iv.currency)})`}</span>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s, iv) => (
        <span>{INVOICE_STATUS[s as keyof typeof INVOICE_STATUS]}</span>
      ),
    },
    {
      title: 'Start',
      dataIndex: 'periodStart',
      key: 'periodStart',
      render: (d, plan) =>
        d == 0 ? '' : dayjs(d * 1000).format('YYYY-MMM-DD'),
    },
    {
      title: 'End',
      dataIndex: 'periodEnd',
      key: 'periodEnd',
      render: (d, plan) =>
        d == 0 ? '' : dayjs(d * 1000).format('YYYY-MMM-DD'), // new Date(d * 1000).toLocaleDateString(),
    },
    {
      title: 'User',
      dataIndex: 'userAccount',
      key: 'userAccount',
      render: (u, plan) => (
        <span>{`${plan.userAccount.firstName} ${plan.userAccount.lastName}`}</span>
      ),
    },
  ];

  const fetchData = async () => {
    const searchTerm = form.getFieldsValue();
    let amtFrom = searchTerm.amountStart,
      amtTo = searchTerm.amountEnd;
    if (amtFrom != '' && amtFrom != null) {
      amtFrom = Number(amtFrom) * CURRENCY[searchTerm.currency].stripe_factor;
    }
    if (amtTo != '' && amtTo != null) {
      amtTo = Number(amtTo) * CURRENCY[searchTerm.currency].stripe_factor;
    }
    if (isNaN(amtFrom) || amtFrom < 0) {
      message.error('Invalid amount-from value.');
      return;
    }
    if (isNaN(amtTo) || amtTo < 0) {
      message.error('Invalid amount-to value');
      return;
    }
    if (amtFrom > amtTo) {
      message.error('Amount-from must be less than or equal to amount-to');
      return;
    }
    searchTerm.amountStart = amtFrom;
    searchTerm.amountEnd = amtTo;

    try {
      setLoading(true);
      const res = await getInvoiceList({
        merchantId: appConfigStore.MerchantId,
        page,
        count: PAGE_SIZE,
        ...searchTerm,
      });
      setLoading(false);
      console.log('res getting invoice list: ', res);
      const code = res.data.code;
      if (code != 0) {
        code == 61 && relogin();
        throw new Error(res.data.message);
      }
      setInvoiceList(res.data.data.Invoices);
    } catch (err) {
      setLoading(false);
      if (err instanceof Error) {
        console.log(`err getting invoice: `, err.message);
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

  return (
    <div>
      <Search form={form} goSearch={fetchData} searching={loading} />
      <Table
        columns={columns}
        dataSource={invoiceList}
        rowKey={'id'}
        rowClassName="clickable-tbl-row"
        pagination={false}
        loading={{
          spinning: loading,
          indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />,
        }}
        onRow={(iv, rowIndex) => {
          return {
            onClick: goToDetail(iv.invoiceId),
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

const DEFAULT_TERM = {
  currency: 'EUR',
  status: [],
  amountStart: '',
  amountEnd: '',
  refunded: false,
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
  const statusOpt = Object.keys(INVOICE_STATUS).map((s) => ({
    value: Number(s),
    label: INVOICE_STATUS[Number(s)],
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
              <Input onPressEnter={goSearch} placeholder="first name" />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item name="lastName" noStyle={true}>
              <Input onPressEnter={goSearch} placeholder="last name" />
            </Form.Item>
          </Col>
          <Col span={4}>
            <span></span>
            <Form.Item name="refunded" noStyle={true} valuePropName="checked">
              <Checkbox>Refunded</Checkbox>
            </Form.Item>
          </Col>
          <Col span={8} className="flex justify-end">
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
