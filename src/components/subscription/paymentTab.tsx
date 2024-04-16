import {
  Button,
  Checkbox,
  Col,
  Input,
  Pagination,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tooltip,
  message
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import React, { useEffect, useState } from 'react'
// import { ISubscriptionType } from "../../shared.types";
import {
  CloseOutlined,
  DownloadOutlined,
  EditOutlined,
  LoadingOutlined,
  MailOutlined,
  MoneyCollectOutlined
} from '@ant-design/icons'
import { CURRENCY, INVOICE_STATUS } from '../../constants'
import { showAmount } from '../../helpers'
import { downloadInvoice, getInvoiceListReq } from '../../requests'
import '../../shared.css'
import { IProfile, UserInvoice } from '../../shared.types.d'
import { normalizeAmt } from '../helpers'

const PAGE_SIZE = 10

const Index = ({ user }: { user: IProfile | null }) => {
  // const appConfigStore = useAppConfigStore();
  const [invoiceList, setInvoiceList] = useState<UserInvoice[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0) // pagination props
  const [newInvoiceModal, setNewInvoiceModal] = useState(false)

  const columns: ColumnsType<UserInvoice> = [
    {
      title: 'Invoice Id',
      dataIndex: 'invoiceId',
      key: 'invoiceId'
    },
    {
      title: 'Title',
      dataIndex: 'invoiceName',
      key: 'invoiceName',
      render: (title, invoice) => <a>{title}</a>
      // render: (_, sub) => <a>{sub.plan?.planName}</a>,
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amt, invoice) => showAmount(amt, invoice.currency, true)
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s) => INVOICE_STATUS[s as keyof typeof INVOICE_STATUS]
    },
    {
      title: 'Created by',
      dataIndex: 'subscriptionId',
      key: 'subscriptionId',
      render: (subscriptionId, invoice) =>
        subscriptionId == '' ? 'Admin' : 'System'
    },
    {
      title: 'Created at',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (d, invoice) => dayjs(d).format('YYYY-MMM-DD')
    }
  ]

  const onPageChange = (page: number, pageSize: number) => {
    setPage(page - 1)
  }

  const fetchData = async () => {
    if (user == null) {
      return
    }
    setLoading(true)
    const [invoices, err] = await getInvoiceListReq(
      {
        page,
        count: PAGE_SIZE,
        userId: user!.id as number
      },
      fetchData
    )
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }

    if (invoices != null) {
      normalizeAmt(invoices)
      setInvoiceList(invoices)
    } else {
      setInvoiceList([])
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    fetchData()
  }, [page])

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* <Searchbar refresh={fetchData} /> */}
        <Table
          columns={columns}
          dataSource={invoiceList}
          rowKey={'id'}
          rowClassName="clickable-tbl-row"
          pagination={false}
          onRow={(record, rowIndex) => {
            return {
              onClick: (event) => {
                // setInvoiceIdx(rowIndex as number)
                // toggleNewInvoiceModal()
              },
              // onDoubleClick: (event) => {}, // double click row
              onContextMenu: (event) => {
                console.log('r click evt: ', event)
              } // right button click row
              // onMouseEnter: (event) => {}, // mouse enter row
              // onMouseLeave: (event) => {}, // mouse leave row
            }
          }}
          loading={{
            spinning: loading,
            indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />
          }}
        />
        <span
          style={{ cursor: 'pointer', marginLeft: '8px' }}
          onClick={fetchData}
        ></span>
      </div>
      <div className="my-4 flex items-center justify-between">
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
  )
}

export default Index
