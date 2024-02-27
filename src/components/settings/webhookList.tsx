import {
  DeleteOutlined,
  LoadingOutlined,
  MinusOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  Button,
  Col,
  Form,
  FormInstance,
  Input,
  Modal,
  Popover,
  Row,
  Select,
  Space,
  Table,
  Tag,
  message,
} from 'antd';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ramdonString, urlRegx } from '../../helpers';
import { useRelogin } from '../../hooks';
import {
  deleteWebhookReq,
  getEventListReq,
  getWebhookListReq,
  saveWebhookReq,
} from '../../requests';
import '../../shared.css';
import { IProfile, TWebhook } from '../../shared.types';
import { useAppConfigStore } from '../../stores';

const Index = () => {
  // const navigate = useNavigate();
  // const appConfigStore = useAppConfigStore();
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0); // pagination props
  const onPageChange = (page: number, pageSize: number) => setPage(page - 1);
  const [webhookList, setWebhookList] = useState<TWebhook[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const toggleModal = () => setModalOpen(!modalOpen);
  const [currentWebhookIdx, setCurrentWebhookIdx] = useState(-1);

  // const relogin = useRelogin();

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
      render: (evt, webhook) => (
        <Popover
          placement="top"
          // title="Addon breakdown"
          content={
            <Space size={[0, 8]} wrap style={{ width: '380px' }}>
              {evt.map((e: string) => (
                <Tag key={e}>{e}</Tag>
              ))}
            </Space>
          }
        >
          <span style={{ marginLeft: '8px', cursor: 'pointer' }}>
            {evt.length}
          </span>
        </Popover>
      ),
    },

    {
      title: 'Modified at',
      dataIndex: 'gmtModify',
      key: 'gmtModify',
      render: (d, plan) => (
        <span>{dayjs(new Date(d * 1000)).format('YYYY-MMM-DD')}</span>
      ),
    },
    {
      title: 'Created at',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (d, plan) => dayjs(new Date(d * 1000)).format('YYYY-MMM-DD'),
    },
  ];

  const onNewWebhook = () => {
    toggleModal();
  };

  const fetchData = async () => {
    setLoading(true);
    const [endpointList, err] = await getWebhookListReq(fetchData);
    setLoading(false);
    if (err != null) {
      message.error(err.message);
      return;
    }
    console.log('getting webhooks res: ', endpointList);
    setWebhookList(endpointList);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    !modalOpen && setCurrentWebhookIdx(-1);
  }, [modalOpen]);

  return (
    <div>
      {modalOpen && (
        <WebhookDetail
          detail={webhookList[currentWebhookIdx]}
          closeModal={toggleModal}
          refresh={fetchData}
        />
      )}
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
      <div className="my-4 flex justify-end">
        <Button type="primary" onClick={onNewWebhook}>
          New
        </Button>
      </div>
    </div>
  );
};

export default Index;

const WebhookDetail = ({
  closeModal,
  detail,
  refresh,
}: {
  closeModal: () => void;
  detail: TWebhook | null;
  refresh: () => void;
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [eventList, setEventList] = useState<string[]>([]); // this is to populate the event <Select />, not used for update.

  const onConfirm = async () => {
    console.log('form v: ', form.getFieldsValue());
    setSubmitting(true);
    const [res, err] = await saveWebhookReq(form.getFieldsValue());
    console.log('save webhook res: ', res, '//', err);
    if (err != null) {
      setSubmitting(false);
      message.error(err.message);
      return;
    }
    message.success('Webhook saved');
    refresh();
    setTimeout(closeModal, 1500);
  };

  const onDelete = async () => {
    if (detail == null) {
      return;
    }
    setSubmitting(true);
    const [res, err] = await deleteWebhookReq(detail?.id);
    console.log('delete webhook res: ', res, '//', err);
    if (err != null) {
      setSubmitting(false);
      message.error(err.message);
      return;
    }
    message.success('Webhook deleted');
    refresh();
    setTimeout(closeModal, 1500);
  };

  const fetchEventList = async () => {
    setSubmitting(true);
    const [eventList, err] = await getEventListReq();
    setSubmitting(false);
    if (err != null) {
      message.error(err.message);
      return;
    }
    setEventList(eventList);
  };

  const isEvtSelected = (evt: string) =>
    form.getFieldValue('events').findIndex((e: string) => e == evt) != -1;

  useEffect(() => {
    fetchEventList();
  }, []);

  console.log('webhook detail: ', detail);

  return (
    <Modal open={true} footer={null} title="Webhook Detail" closeIcon={null}>
      <Form
        form={form}
        onFinish={onConfirm}
        initialValues={{
          endpointId: detail == null ? null : detail.id,
          url: detail == null ? '' : detail.webhookUrl,
          events: detail == null ? [''] : detail.webhookEvents,
        }}
        name="web-hook-detail"
        style={{ maxWidth: 640, width: 480 }}
      >
        {detail != null && (
          <Form.Item name="endpointId" hidden>
            <Input />
          </Form.Item>
        )}
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
                ({ getFieldValue }) => ({
                  validator(rule, value) {
                    if (urlRegx.test(value)) {
                      return Promise.resolve();
                    }
                    return Promise.reject('Please input a valid URL');
                  },
                }),
              ]}
            >
              <Input placeholder="Starts with http:// or https://" />
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
                    {fields &&
                      fields.map((field, index) => {
                        return (
                          <div
                            key={ramdonString(8)}
                            className="flex items-center"
                            style={{ marginBottom: '12px' }}
                          >
                            <Form.Item
                              name={field.name}
                              label={`Event - ${index + 1}`}
                              noStyle={true}
                              rules={[{ required: true }]}
                            >
                              <Select
                                style={{ width: 200, margin: '8px 0' }}
                                options={eventList.map((e) => ({
                                  label: e,
                                  value: e,
                                  disabled: isEvtSelected(e),
                                }))}
                              />
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
      <div className="my-6 flex items-center justify-between">
        {detail == null ? (
          <span></span>
        ) : (
          <Button danger onClick={onDelete} disabled={submitting}>
            Delete
          </Button>
        )}
        <div>
          <Button onClick={closeModal} disabled={submitting}>
            Cancel
          </Button>
          &nbsp;&nbsp;&nbsp;&nbsp;
          <Button
            type="primary"
            onClick={form.submit}
            loading={submitting}
            disabled={submitting}
          >
            OK
          </Button>
        </div>
      </div>
    </Modal>
  );
};
