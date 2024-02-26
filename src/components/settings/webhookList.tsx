import {
  DeleteOutlined,
  LoadingOutlined,
  MinusOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  Button,
  Checkbox,
  Col,
  Form,
  FormInstance,
  Input,
  Modal,
  Pagination,
  Row,
  Select,
  Space,
  Table,
  message,
} from 'antd';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CURRENCY, INVOICE_STATUS, SUBSCRIPTION_STATUS } from '../../constants';
import { useRelogin } from '../../hooks';
import { getInvoiceList, getWebhookListReq } from '../../requests';
import '../../shared.css';
import { IProfile, TWebhook, UserInvoice } from '../../shared.types';
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
  const [webhookList, setWebhookList] = useState<TWebhook[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const toggleModal = () => setModalOpen(!modalOpen);
  const [currentWebhookIdx, setCurrentWebhookIdx] = useState(-1);

  const relogin = useRelogin();

  const goToDetail = (invoiceId: string) => (evt: any) => {
    console.log('go to detail: ', evt.target);
    if (evt.target.closest('.unibee-user-id-wrapper')) {
      return;
    }
    navigate(`${APP_PATH}invoice/${invoiceId}`);
  };

  const columns: ColumnsType<TWebhook> = [
    {
      title: 'id',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Merchant Id',
      dataIndex: 'merchantId',
      key: 'merchantId',
    },
    {
      title: 'Url',
      dataIndex: 'webhookUrl',
      key: 'webhookUrl',
    },
    {
      title: 'Events',
      dataIndex: 'webhookEvents',
      key: 'webhookEvents',
      render: (d, webhook) => 'aa',
    },
    {
      title: 'End',
      dataIndex: 'periodEnd',
      key: 'periodEnd',
      render: (d, plan) =>
        d == 0 ? '' : dayjs(d * 1000).format('YYYY-MMM-DD'), // new Date(d * 1000).toLocaleDateString(),
    },
    {
      title: 'Modified at',
      dataIndex: 'gmtModify',
      key: 'gmtModify',
      render: (d, plan) => (
        <span>{dayjs(new Date(d * 1000)).format('YYYY-MMM-DD')}</span>
      ),
    },
  ];

  const onNewWebhook = () => {
    toggleModal();
  };

  const fetchData = async () => {
    setLoading(true);
    const [res, err] = await getWebhookListReq();
    setLoading(false);
    if (err != null) {
      message.error(err.message);
      return;
    }
    const { endpointList } = res;
    console.log('res getting webhooks: ', endpointList);
    //  setInvoiceList(res.data.data.Invoices);
    setWebhookList(endpointList);
  };

  useEffect(() => {
    fetchData();
  }, []);
  /*
  useEffect(() => {
    fetchData();
  }, [page]);
  */

  useEffect(() => {
    !modalOpen && setCurrentWebhookIdx(-1);
  }, [modalOpen]);

  //  detail={webhookList[currentWebhookIdx]}
  return (
    <div>
      {modalOpen && (
        <WebhookDetail
          detail={webhookList[currentWebhookIdx]}
          closeModal={toggleModal}
        />
      )}
      <div className="my-4 flex justify-end">
        <Button type="primary" onClick={onNewWebhook}>
          New
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={webhookList}
        rowKey={'id'}
        rowClassName="clickable-tbl-row"
        pagination={false}
        loading={{
          spinning: loading,
          indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />,
        }}
        onRow={(iv, rowIndex) => {
          return {
            onClick: () => {
              setCurrentWebhookIdx(rowIndex as number);
              toggleModal();
            },
          };
        }}
      />
      {/*       <div className="mx-0 my-4 flex items-center justify-end">
       <Pagination
          current={page + 1} // back-end starts with 0, front-end starts with 1
          pageSize={PAGE_SIZE}
          total={500}
          size="small"
          onChange={onPageChange}
          disabled={loading}
          showSizeChanger={false}
      />
      </div>*/}
    </div>
  );
};

export default Index;

const WebhookDetail = ({
  closeModal,
  detail,
}: {
  closeModal: () => void;
  detail: TWebhook | null;
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const onConfirm = () => {
    console.log('form v: ', form.getFieldsValue());
    // closeModal();
  };

  console.log('webhook detail: ', detail);

  useEffect(() => {
    form.setFieldValue('events', ['abc', 'xyz']);
  }, []);
  return (
    <Modal open={true} footer={null} title="Webhook Detail">
      <Form
        form={form}
        initialValues={{ ur: 'http://www.google.com', events: ['abc', 'xyz'] }}
        name="web-hook-detail"
        // labelCol={{ span: 6 }}
        // wrapperCol={{ span: 18 }}
        style={{ maxWidth: 640, width: 480 }}
      >
        <Row style={{ marginTop: '32px' }}>
          <Col span={4}>URL</Col>
          <Col span={18}>
            <Form.Item
              // label="Url"
              name="url"
              rules={[
                {
                  required: true,
                  message: 'Please input your endpoint URL!',
                },
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={2}></Col>
        </Row>

        <Row>
          <Col span={4}>Events</Col>
          <Col span={18}>
            <Form.List name="events">
              {(fields, { add, remove }) => {
                return (
                  <>
                    {fields.map((field, index) => {
                      return (
                        <div
                          className="flex items-center"
                          style={{ marginBottom: '12px' }}
                        >
                          <Form.Item
                            name={field.name}
                            //label={`skill - ${index + 1}`}
                            //  style={{ width: '400px' }}
                            noStyle={true}
                            rules={[{ required: true }]}
                          >
                            <Input style={{ width: '80%' }} />
                          </Form.Item>
                          &nbsp;&nbsp;&nbsp;&nbsp;
                          <div
                            onClick={() => {
                              if (fields.length == 1) {
                                return;
                              }
                              remove(field.name);
                            }}
                            style={{
                              fontWeight: 'bold',
                              width: '32px',
                              cursor: `${fields.length == 1 ? 'not-allowed' : 'pointer'}`,
                            }}
                          >
                            <MinusOutlined />
                          </div>
                        </div>
                      );
                    })}
                    <Form.Item>
                      <Button
                        type="dashed"
                        block
                        style={{ width: '80%' }}
                        icon={<PlusOutlined />}
                        onClick={() => add()}
                      >
                        Add an event
                      </Button>
                    </Form.Item>
                  </>
                );
              }}
            </Form.List>
          </Col>
        </Row>
      </Form>
      <div className="my-6 flex items-center justify-end">
        <Button onClick={closeModal} disabled={submitting}>
          Cancel
        </Button>
        &nbsp;&nbsp;&nbsp;&nbsp;
        <Button
          type="primary"
          onClick={onConfirm}
          loading={submitting}
          disabled={submitting}
        >
          OK
        </Button>
      </div>
    </Modal>
  );
};
