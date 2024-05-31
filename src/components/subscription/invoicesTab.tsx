import {
  Button,
  Checkbox,
  Col,
  Input,
  Pagination,
  Row,
  Select,
  Space,
  Table,
  Tooltip,
  message
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import React, { ReactElement, useEffect, useState } from 'react'
// import { ISubscriptionType } from "../../shared.types";
import {
  DollarOutlined,
  DownloadOutlined,
  EditOutlined,
  LoadingOutlined,
  MailOutlined,
  PlusOutlined
} from '@ant-design/icons'
import { CURRENCY, INVOICE_STATUS } from '../../constants'
import { showAmount } from '../../helpers'
import { downloadInvoice, getInvoiceListReq } from '../../requests'
import '../../shared.css'
import { IProfile, TInvoicePerm, UserInvoice } from '../../shared.types.d'
import { normalizeAmt } from '../helpers'
import { InvoiceStatus } from '../ui/statusTag'
import InvoiceDetailModal from './modals/invoiceDetail'
import NewInvoiceModal from './modals/newInvoice'

const PAGE_SIZE = 10

const Index = ({
  user,
  extraButton
}: {
  user: IProfile | null
  extraButton?: ReactElement
}) => {
  // const appConfigStore = useAppConfigStore();
  const [invoiceList, setInvoiceList] = useState<UserInvoice[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [newInvoiceModalOpen, setNewInvoiceModalOpen] = useState(false)
  const [invoiceDetailModalOpen, setInvoiceDetailModalOpen] = useState(false)
  const [invoiceIdx, setInvoiceIdx] = useState(-1) // -1: not selected, any action button: (delete, edit,refund) will set this value to the selected invoiceIdx
  const [deleteMode, setDeleteMode] = useState(false) // looks like I am not using it,
  const [refundMode, setRefundMode] = useState(false)

  const toggleNewInvoiceModal = () => {
    if (newInvoiceModalOpen) {
      setInvoiceIdx(-1)
      setDeleteMode(false)
      setRefundMode(false)
    }
    setNewInvoiceModalOpen(!newInvoiceModalOpen)
  }

  const toggleInvoiceDetailModal = () => {
    if (invoiceDetailModalOpen) {
      setInvoiceIdx(-1)
      setDeleteMode(false)
      setRefundMode(false)
    }
    setInvoiceDetailModalOpen(!invoiceDetailModalOpen)
  }
  /*
  0: "Initiating", // this status only exist for a very short period, users/admin won't even know it exist
  1: "Pending", // admin manually create an invoice, ready for edit, but not published yet, users won't see it, won't receive email
  // in pending, admin can also delete the invoice
  2: "Pocessing", // admin has published the invoice, user will receive a mail with payment link
  3: "Paid", // user paid the invoice
  4: "Failed", // user not pay the invoice before it get expired
  5: "Cancelled", // admin cancel the invoice after publishing, only if user hasn't paid yet. If user has paid, admin cannot cancel it.
    */

  const getPermission = (iv: UserInvoice | null): TInvoicePerm => {
    const p = {
      editable: false,
      creatable: false, // create a new invoice
      savable: false, // save it after creation
      deletable: false, // delete before publish as nothing happened
      publishable: false, // publish it, so user could receive it
      revokable: false,
      refundable: false,
      downloadable: false,
      sendable: false
    }
    if (iv == null) {
      // creating a new invoice
      console.log('create a new invoice...')
      p.creatable = true
      p.editable = true
      p.savable = true
      p.publishable = true
      return p
    }
    if (iv.subscriptionId == null || iv.subscriptionId == '') {
      // manually created invoice
      switch (iv.status) {
        case 1: // pending, aka edit mode
          p.editable = true
          p.creatable = true
          p.deletable = true
          p.publishable = true
          break
        case 2: // processing mode, user has received the invoice mail with payment link, but hasn't paid yet.
          p.revokable = true
          break
        case 3: // user has paid
          p.downloadable = true
          p.sendable = true
          p.refundable = true
          break
      }
      return p
    }

    if (iv.subscriptionId != '') {
      // system generated invoice, not admin manually generated
      p.sendable = true
      p.downloadable = true
      p.refundable = true
    }
    return p
  }

  const columns: ColumnsType<UserInvoice> = [
    {
      title: 'Invoice Id',
      dataIndex: 'invoiceId',
      key: 'invoiceId'
    },
    {
      title: 'Title',
      dataIndex: 'invoiceName',
      key: 'invoiceName'
      // render: (title, invoice) => <a>{title}</a>
      // render: (_, sub) => <a>{sub.plan?.planName}</a>,
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 100,
      render: (amt, invoice) => showAmount(amt, invoice.currency, true)
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s) => InvoiceStatus(s) // INVOICE_STATUS[s as keyof typeof INVOICE_STATUS]
    },
    {
      title: 'Paid date',
      dataIndex: 'payment',
      key: 'payment',
      render: (payment) =>
        payment == null || payment.paidTime == 0
          ? 'N/A'
          : dayjs(payment.paidTime * 1000).format('YYYY-MM-DD HH:MM:ss')
    },
    {
      title: 'Gateway',
      dataIndex: 'gateway',
      key: 'gateway',
      render: (g) => (g == null ? null : g.gatewayName)
    },
    {
      title: 'Is refund',
      dataIndex: 'refund',
      key: 'refund',
      width: 100,
      render: (refund, iv) => (refund == null ? 'No' : 'Yes')
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
    },
    {
      title: (
        <>
          <span>Action</span>
          <Tooltip title="New invoice">
            <Button
              size="small"
              style={{ marginLeft: '8px' }}
              onClick={() => {
                setInvoiceIdx(-1)
                toggleNewInvoiceModal()
              }}
              icon={<PlusOutlined />}
              disabled={user == null}
            />
          </Tooltip>
        </>
      ),
      key: 'action',
      // width: 180,
      render: (
        _,
        invoice // use fn to generate these icons, only show available ones.
      ) => (
        <Space
          size="middle"
          className="invoice-action-btn-wrapper"
          // style={{ width: '170px' }}
        >
          <Tooltip title="Edit">
            <Button
              onClick={toggleNewInvoiceModal}
              icon={<EditOutlined />}
              style={{ border: 'unset' }}
              disabled={!getPermission(invoice).editable}
            />
          </Tooltip>
          <Tooltip title="Send invoice">
            <Button
              onClick={toggleNewInvoiceModal}
              icon={<MailOutlined />}
              style={{ border: 'unset' }}
              disabled={!getPermission(invoice).sendable}
            />
          </Tooltip>
          <Tooltip title="Refund">
            <Button
              onClick={refund}
              icon={<DollarOutlined />}
              style={{ border: 'unset' }}
              disabled={!getPermission(invoice).refundable}
            />
          </Tooltip>
          <Tooltip title="Download Invoice">
            <Button
              onClick={toggleNewInvoiceModal}
              icon={<DownloadOutlined />}
              style={{ border: 'unset' }}
              disabled={!getPermission(invoice).downloadable}
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  const refund = () => {
    setRefundMode(true)
    toggleNewInvoiceModal()
  }

  const onPageChange = (page: number, pageSize: number) => {
    setPage(page - 1)
  }

  const fetchData = async () => {
    if (user == null) {
      return
    }
    setLoading(true)
    const [res, err] = await getInvoiceListReq(
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
    const { invoices, total } = res
    if (invoices != null) {
      normalizeAmt(invoices)
      setInvoiceList(invoices)
    } else {
      setInvoiceList([])
    }
    setTotal(total)
  }

  useEffect(() => {
    fetchData()
  }, [page, user])

  return (
    <div>
      {newInvoiceModalOpen && (
        <NewInvoiceModal
          isOpen={true}
          refundMode={refundMode}
          detail={invoiceIdx == -1 ? null : invoiceList[invoiceIdx]}
          permission={getPermission(
            invoiceIdx == -1 ? null : invoiceList[invoiceIdx]
          )}
          user={user}
          closeModal={toggleNewInvoiceModal}
          refresh={fetchData}
        />
      )}
      {invoiceDetailModalOpen && (
        <InvoiceDetailModal
          detail={invoiceList[invoiceIdx]}
          user={user}
          closeModal={toggleInvoiceDetailModal}
        />
      )}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* <Searchbar refresh={fetchData} /> */}
        {/* <div className="my-4 flex justify-end">
          <Button
            icon={<PlusOutlined />}
            type="primary"
            onClick={() => {
              setInvoiceIdx(-1)
              toggleNewInvoiceModal()
            }}
            disabled={user == null}
          >
            New Invoice
          </Button>
          </div> */}
        <Table
          columns={columns}
          dataSource={invoiceList}
          rowKey={'id'}
          rowClassName="clickable-tbl-row"
          pagination={false}
          scroll={{ x: 'max-content', y: 640 }}
          onRow={(record, rowIndex) => {
            return {
              onClick: (event) => {
                setInvoiceIdx(rowIndex as number)
                if (
                  event.target instanceof Element &&
                  event.target.closest('.invoice-action-btn-wrapper') == null
                ) {
                  toggleInvoiceDetailModal()
                  return
                }
              }
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
        <div className="flex items-center justify-center">{extraButton}</div>
        <Pagination
          current={page + 1} // back-end starts with 0, front-end starts with 1
          pageSize={PAGE_SIZE}
          total={total}
          size="small"
          onChange={onPageChange}
          disabled={loading}
          showSizeChanger={false}
          showTotal={(total, range) =>
            `${range[0]}-${range[1]} of ${total} items`
          }
        />
      </div>
    </div>
  )
}

export default Index

interface ISearchBarProp {
  refresh: () => void
}
const Searchbar = ({ refresh }: ISearchBarProp) => {
  // Object.keys(INVOICE_STATUS).map(s => ({value: s, label: INVOICE_STATUS[Number(s)] }))
  return (
    <div>
      <Row className="flex justify-between">
        <Col span={6}>Title</Col>
        <Col span={3}>Amt</Col>
        <Col span={4}>Status</Col>
        <Col span={2}>Refunded</Col>
        <Col span={4}>Action</Col>
      </Row>
      <Row
        className="flex justify-between"
        style={{
          marginBottom: '12px'
        }}
      >
        <Col span={6}>
          <Input />
        </Col>
        <Col span={3} style={{ display: 'flex', gap: '4px' }}>
          <Input placeholder="from" /> <Input placeholder="to" />
        </Col>
        <Col span={4}>
          {' '}
          <Select
            style={{ width: 120 }}
            options={[
              { label: INVOICE_STATUS[0], value: 0 },
              { label: INVOICE_STATUS[1], value: 1 },
              { label: INVOICE_STATUS[2], value: 2 },
              { label: INVOICE_STATUS[3], value: 3 },
              { label: INVOICE_STATUS[4], value: 4 },
              { label: INVOICE_STATUS[5], value: 5 }
            ]}
          />
        </Col>
        <Col span={2}>
          {' '}
          <Checkbox></Checkbox>
        </Col>
        <Col span={4}>
          <div style={{ display: 'flex' }}>
            <Button type="link" size="small">
              Search
            </Button>{' '}
            <Button onClick={refresh} type="link" size="small">
              Clear
            </Button>
          </div>
        </Col>
      </Row>
    </div>
  )
}
