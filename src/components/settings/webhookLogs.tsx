import { LoadingOutlined } from '@ant-design/icons';
import { Button, Modal, Pagination, Table, message } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import { getWebhookLogs } from '../../requests';
import { TWebhookLogs } from '../../shared.types';

const PAGE_SIZE = 10;

const columns: ColumnsType<TWebhookLogs> = [
  {
    title: 'Url',
    dataIndex: 'webhookUrl',
    key: 'webhookUrl',
    // render: (text) => <a>{text}</a>,
  },
  {
    title: 'Event',
    dataIndex: 'webhookEvent',
    key: 'webhookEvent',
  },
  {
    title: 'Request Id',
    dataIndex: 'requestId',
    key: 'requestId',
  },
  {
    title: 'Request Body',
    dataIndex: 'body',
    key: 'body',
  },
  {
    title: 'Response',
    dataIndex: 'response',
    key: 'response',
  },
  {
    title: 'mamo',
    dataIndex: 'mamo',
    key: 'mamo',
  },
  {
    title: 'Created at',
    dataIndex: 'gmtCreate',
    key: 'gmtCreate',
  },
];

const Index = ({
  closeModal,
  endpointId,
}: {
  closeModal: () => void;
  endpointId: number;
}) => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<TWebhookLogs[]>([]);
  const [page, setPage] = useState(0);
  const onPageChange = (page: number, pageSize: number) => setPage(page - 1);

  const fetchData = async () => {
    setLoading(true);
    const [endpointLogList, err] = await getWebhookLogs(
      { endpointId, page, count: PAGE_SIZE },
      fetchData,
    );
    setLoading(false);
    if (err != null) {
      message.error(err.message);
      return;
    }
    setLogs(endpointLogList);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchData();
  }, [page]);

  return (
    <Modal
      open={true}
      footer={null}
      title="Webhook Logs"
      closeIcon={null}
      width={1024}
    >
      <Table
        columns={columns}
        dataSource={logs}
        rowKey={'id'}
        rowClassName="clickable-tbl-row"
        pagination={false}
        loading={{
          spinning: loading,
          indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />,
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
      <div className="my-6 flex items-center justify-end">
        <div>
          <Button onClick={closeModal} type="primary">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default Index;
