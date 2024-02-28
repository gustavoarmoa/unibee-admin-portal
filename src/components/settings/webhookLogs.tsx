import { LoadingOutlined } from '@ant-design/icons';
import { Button, Modal, Pagination, Popover, Table, message } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import prism from 'react-syntax-highlighter/dist/esm/styles/prism/prism';
import { getWebhookLogs } from '../../requests';
import { TWebhookLogs } from '../../shared.types';
SyntaxHighlighter.registerLanguage('json', json);

const PAGE_SIZE = 10;

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

  const [clicked, setClicked] = useState(false);
  const [hovered, setHovered] = useState(false);

  const hide = () => {
    setClicked(false);
    setHovered(false);
  };

  const handleHoverChange = (open: boolean) => {
    setHovered(open);
    setClicked(false);
  };

  const handleClickChange = (open: boolean) => {
    setHovered(false);
    setClicked(open);
  };

  const columns: ColumnsType<TWebhookLogs> = [
    {
      title: 'Url',
      dataIndex: 'webhookUrl',
      key: 'webhookUrl',
      width: 80,
      render: (text) => (
        <div
          style={{
            width: '80px',
            height: '80px',
            overflow: 'hidden',
            // whiteSpace: 'nowrap',
          }}
        >
          {text}
        </div>
      ),
    },
    {
      title: 'Event',
      dataIndex: 'webhookEvent',
      key: 'webhookEvent',
      width: 80,
      render: (text) => (
        <div
          style={{
            width: '80px',
            height: '80px',
            overflow: 'hidden',
            // whiteSpace: 'nowrap',
          }}
        >
          {text}
        </div>
      ),
    },
    {
      title: 'Request Id',
      dataIndex: 'requestId',
      key: 'requestId',
      width: 80,
      render: (text) => (
        <div
          style={{
            width: '80px',
            height: '80px',
            overflow: 'hidden',
            // whiteSpace: 'nowrap',
          }}
        >
          {text}
        </div>
      ),
    },
    {
      title: 'Request Body',
      dataIndex: 'body',
      key: 'body',
      width: 80,
      render: (text) => (
        <Popover
          placement="right"
          content={
            <div style={{ width: '360px', height: '360px', overflow: 'auto' }}>
              <SyntaxHighlighter language="json" style={prism}>
                {JSON.stringify(JSON.parse(text), null, 2)}
              </SyntaxHighlighter>
            </div>
          }
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              overflow: 'hidden',
            }}
          >
            {text}
          </div>
        </Popover>
      ),
    },
    {
      title: 'Response',
      dataIndex: 'response',
      key: 'response',
      width: 80,
      render: (text) => (
        <div
          style={{
            width: '80px',
            height: '80px',
            overflow: 'hidden',
            // whiteSpace: 'nowrap',
          }}
        >
          {text}
        </div>
      ),
    },
    {
      title: 'mamo',
      dataIndex: 'mamo',
      key: 'mamo',
      width: 80,
      render: (text) => (
        <Popover
          placement="right"
          content={
            <div style={{ width: '360px', height: '360px', overflow: 'auto' }}>
              <SyntaxHighlighter language="json" style={prism}>
                {JSON.stringify(JSON.parse(text), null, 2)}
              </SyntaxHighlighter>
            </div>
          }
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              overflow: 'hidden',
            }}
          >
            {text}
          </div>
        </Popover>
      ),
    },
    {
      title: 'Created at',
      dataIndex: 'gmtCreate',
      key: 'gmtCreate',
      width: 80,
      render: (text) => <span>{text}</span>,
    },
  ];

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
