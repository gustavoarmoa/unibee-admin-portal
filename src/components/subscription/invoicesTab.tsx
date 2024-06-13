import {
  Button,
  Col,
  Form,
  FormInstance,
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
  CheckCircleOutlined,
  DollarOutlined,
  DownloadOutlined,
  EditOutlined,
  LoadingOutlined,
  MailOutlined,
  PlusOutlined,
  SyncOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import RefundIcon from '../../assets/refund.svg?react'
import { CURRENCY, INVOICE_STATUS } from '../../constants'
import { formatDate, getInvoicePermission, showAmount } from '../../helpers'
import { usePagination } from '../../hooks'
import { getInvoiceListReq } from '../../requests'
import '../../shared.css'
import { IProfile, TInvoicePerm, UserInvoice } from '../../shared.types.d'
import { normalizeAmt } from '../helpers'
import MarkAsPaidModal from '../invoice/markAsPaidModal'
import MarkAsRefundedModal from '../invoice/markAsRefundedModal'
import RefundInfoModal from '../payment/refundModal'
import { InvoiceStatus } from '../ui/statusTag'
import InvoiceDetailModal from './modals/invoiceDetail'
import NewInvoiceModal from './modals/newInvoice'

const PAGE_SIZE = 10
const APP_PATH = import.meta.env.BASE_URL

const Index = ({
  user,
  extraButton,
  embeddingMode,
  enableSearch
}: {
  user?: IProfile | undefined
  extraButton?: ReactElement
  embeddingMode: boolean // invoiceList can be embedded as part of a page, or be the page itself.
  enableSearch: boolean
}) => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [invoiceList, setInvoiceList] = useState<UserInvoice[]>([])
  const [loading, setLoading] = useState(false)
  const { page, onPageChange, onPageChangeNoParams } = usePagination()
  const pageChange = embeddingMode ? onPageChangeNoParams : onPageChange

  const [total, setTotal] = useState(0)
  const [newInvoiceModalOpen, setNewInvoiceModalOpen] = useState(false)
  const [invoiceDetailModalOpen, setInvoiceDetailModalOpen] = useState(false)
  const [invoiceIdx, setInvoiceIdx] = useState(-1) // -1: not selected, any action button: (delete, edit,refund) will set this value to the selected invoiceIdx
  const [refundMode, setRefundMode] = useState(false) // create invoice and create refund invoice share a modal, I need this to check which one is used.

  // refund invoice Modal, showing refund info
  const [refundInfoModalOpen, setRefundInfoModalOpen] = useState(false)
  const toggleRefundInfoModal = () => {
    if (refundInfoModalOpen) {
      setInvoiceIdx(-1)
    }
    setRefundInfoModalOpen(!refundInfoModalOpen)
  }

  const [markPaidModalOpen, setMarkPaidModalOpen] = useState(false)
  const toggleMarkPaidModal = () => {
    if (markPaidModalOpen) {
      setInvoiceIdx(-1)
    }
    setMarkPaidModalOpen(!markPaidModalOpen)
  }
  const [markRefundedModalOpen, setMarkRefundedModalOpen] = useState(false)
  const toggleMarkRefundedModal = () => {
    if (markRefundedModalOpen) {
      setInvoiceIdx(-1)
    }
    setMarkRefundedModalOpen(!markRefundedModalOpen)
  }

  const toggleNewInvoiceModal = () => {
    if (newInvoiceModalOpen) {
      setInvoiceIdx(-1)
      setRefundMode(false)
    }
    setNewInvoiceModalOpen(!newInvoiceModalOpen)
  }

  const toggleInvoiceDetailModal = () => {
    if (invoiceDetailModalOpen) {
      setInvoiceIdx(-1)
      setRefundMode(false)
    }
    setInvoiceDetailModalOpen(!invoiceDetailModalOpen)
  }

  const fetchData = async () => {
    let searchTerm: any = {}
    if (enableSearch) {
      searchTerm = form.getFieldsValue()
      let amtFrom = searchTerm.amountStart,
        amtTo = searchTerm.amountEnd
      if (amtFrom != '' && amtFrom != null) {
        amtFrom = Number(amtFrom) * CURRENCY[searchTerm.currency].stripe_factor
      }
      if (amtTo != '' && amtTo != null) {
        amtTo = Number(amtTo) * CURRENCY[searchTerm.currency].stripe_factor
      }
      if (isNaN(amtFrom) || amtFrom < 0) {
        message.error('Invalid amount-from value.')
        return
      }
      if (isNaN(amtTo) || amtTo < 0) {
        message.error('Invalid amount-to value')
        return
      }
      if (amtFrom > amtTo) {
        message.error('Amount-from must be less than or equal to amount-to')
        return
      }
      searchTerm.amountStart = amtFrom
      searchTerm.amountEnd = amtTo
    }
    searchTerm.page = page
    searchTerm.count = PAGE_SIZE
    if (user != null) {
      searchTerm.userId = user.id as number
    }

    setLoading(true)
    const [res, err] = await getInvoiceListReq(searchTerm, fetchData)
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

  const goSearch = () => {
    if (page == 0) {
      fetchData()
    } else {
      pageChange(1, PAGE_SIZE)
    }
  }

  const columns: ColumnsType<UserInvoice> = [
    {
      title: 'Invoice Id',
      dataIndex: 'invoiceId',
      key: 'invoiceId',
      render: (ivId) => (
        <Button
          onClick={() => navigate(`${APP_PATH}invoice/${ivId}`)}
          type="link"
          style={{ padding: 0 }}
          className="btn-invoiceid-wrapper"
        >
          {ivId}
        </Button>
      )
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      render: (amt, iv) => (
        <div className=" flex items-center">
          <div className={iv.refund == null ? '' : ' text-red-500'}>
            {showAmount(amt, iv.currency, true)}
          </div>
          {iv.refund == null && (
            <div className=" text-xs text-gray-500">{` (tax: ${showAmount(iv.taxAmount, iv.currency)})`}</div>
          )}
          {iv.refund != null && (
            <Tooltip title="Refund info">
              <div className="btn-refund-info-modal-wrapper ml-1 flex">
                <RefundIcon />
              </div>
            </Tooltip>
          )}
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s, iv) => InvoiceStatus(s, iv.refund != null) // INVOICE_STATUS[s as keyof typeof INVOICE_STATUS]
    },
    {
      title: 'Paid date',
      dataIndex: 'payment',
      key: 'payment',
      render: (payment, iv) =>
        iv.refund == null
          ? payment == null || payment.paidTime == 0
            ? '―'
            : formatDate(payment.paidTime, true)
          : iv.refund.refundTime == 0
            ? '―'
            : formatDate(iv.refund.refundTime, true)
    },
    {
      title: 'Gateway',
      dataIndex: 'gateway',
      key: 'gateway',
      render: (g) => (g == null ? null : g.displayName)
    },
    {
      title: 'Type',
      dataIndex: 'refund',
      key: 'refund',
      width: 100,
      render: (refund, iv) => (refund == null ? 'Invoice' : 'Credit Note')
    },
    {
      title: 'Created by',
      dataIndex: 'createFrom',
      key: 'createFrom',
      render: (by, _) => (by != 'Admin' ? 'System' : 'Admin')
    },
    {
      title: 'User',
      dataIndex: 'userAccount',
      key: 'userName',
      // hidden: embeddingMode,
      // "hidden" is supported in higher version of antd, but that version broke many other things,
      // like <DatePicker />
      render: (u, iv) => (
        <span>{`${iv.userAccount.firstName} ${iv.userAccount.lastName}`}</span>
      )
    },
    {
      title: 'Email',
      dataIndex: 'userAccount',
      key: 'userEmail',
      // hidden: embeddingMode,
      render: (u, iv) =>
        iv.userAccount == null ? null : (
          <a href={`mailto:${iv.userAccount.email}`}> {iv.userAccount.email}</a>
        )
    },
    {
      title: 'Title',
      dataIndex: 'invoiceName',
      key: 'invoiceName'
    },
    {
      title: (
        <>
          <span>Actions</span>
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
          <Tooltip title="Refresh">
            <Button
              size="small"
              style={{ marginLeft: '8px' }}
              disabled={loading}
              onClick={fetchData}
              icon={<SyncOutlined />}
            ></Button>
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
          size="small"
          className="invoice-action-btn-wrapper"
          // style={{ width: '170px' }}
        >
          <Tooltip title="Edit">
            <Button
              onClick={toggleNewInvoiceModal}
              icon={<EditOutlined />}
              style={{ border: 'unset' }}
              disabled={!getInvoicePermission(invoice).editable}
            />
          </Tooltip>
          <Tooltip title="Create Refund Invoice">
            <Button
              onClick={refund}
              icon={<DollarOutlined />}
              style={{ border: 'unset' }}
              disabled={!getInvoicePermission(invoice).refundable}
            />
          </Tooltip>
          {getInvoicePermission(invoice).asPaidMarkable ? (
            <Tooltip title="Mark invoice as PAID">
              <Button
                onClick={toggleMarkPaidModal}
                icon={<CheckCircleOutlined />}
                style={{ border: 'unset' }}
              />
            </Tooltip>
          ) : null}

          {getInvoicePermission(invoice).asRefundedMarkable ? (
            <Tooltip title="Mark invoice as Refunded">
              <Button
                onClick={toggleMarkRefundedModal}
                icon={<CheckCircleOutlined />}
                style={{ border: 'unset' }}
              />
            </Tooltip>
          ) : null}

          <Tooltip title="Send invoice">
            <Button
              onClick={toggleNewInvoiceModal}
              icon={<MailOutlined />}
              style={{ border: 'unset' }}
              disabled={!getInvoicePermission(invoice).sendable}
            />
          </Tooltip>
          <Tooltip title="Download Invoice">
            <Button
              // onClick={toggleNewInvoiceModal}
              icon={<DownloadOutlined />}
              style={{ border: 'unset' }}
              disabled={!getInvoicePermission(invoice).downloadable}
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

  useEffect(() => {
    fetchData()
  }, [page, user])

  return (
    <div>
      {refundInfoModalOpen && invoiceList[invoiceIdx].refund != null && (
        <RefundInfoModal
          detail={invoiceList[invoiceIdx].refund!}
          closeModal={toggleRefundInfoModal}
          ignoreAmtFactor={true}
        />
      )}
      {markPaidModalOpen && (
        <MarkAsPaidModal
          closeModal={toggleMarkPaidModal}
          refresh={fetchData}
          invoiceId={invoiceList[invoiceIdx].invoiceId}
        />
      )}

      {markRefundedModalOpen && (
        <MarkAsRefundedModal
          closeModal={toggleMarkRefundedModal}
          refresh={fetchData}
          invoiceId={invoiceList[invoiceIdx].invoiceId}
        />
      )}
      {newInvoiceModalOpen && (
        <NewInvoiceModal
          isOpen={true}
          refundMode={refundMode}
          detail={invoiceIdx == -1 ? null : invoiceList[invoiceIdx]}
          permission={getInvoicePermission(
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
      {enableSearch && (
        <Search
          form={form}
          goSearch={goSearch}
          searching={loading}
          onPageChange={pageChange}
        />
      )}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Table
          columns={
            !embeddingMode
              ? columns
              : columns.filter(
                  (c) => c.key != 'userName' && c.key != 'userEmail'
                )
          }
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
                  event.target.closest('.btn-refund-info-modal-wrapper') != null
                ) {
                  toggleRefundInfoModal()
                  return
                }
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
          onChange={pageChange}
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

const DEFAULT_TERM = {
  currency: 'EUR',
  status: [],
  amountStart: '',
  amountEnd: ''
  // refunded: false,
}
const Search = ({
  form,
  searching,
  goSearch,
  onPageChange
}: {
  form: FormInstance<any>
  searching: boolean
  goSearch: () => void
  onPageChange: (page: number, pageSize: number) => void
}) => {
  const statusOpt = Object.keys(INVOICE_STATUS).map((s) => ({
    value: Number(s),
    label: INVOICE_STATUS[Number(s)]
  }))
  const clear = () => {
    form.resetFields()
    onPageChange(1, PAGE_SIZE)
    goSearch()
  }
  const watchCurrency = Form.useWatch('currency', form)
  useEffect(() => {
    // just to trigger rerender when currency changed
  }, [watchCurrency])

  const currencySymbol =
    CURRENCY[form.getFieldValue('currency') || DEFAULT_TERM.currency].symbol

  return (
    <div>
      <Form form={form} initialValues={DEFAULT_TERM} disabled={searching}>
        <Row className="flex items-center" gutter={[8, 8]}>
          <Col span={4}>First/Last name</Col>
          <Col span={4}>
            <Form.Item name="firstName" noStyle={true}>
              <Input onPressEnter={goSearch} placeholder="first name" />
            </Form.Item>
          </Col>
          /
          <Col span={4}>
            <Form.Item name="lastName" noStyle={true}>
              <Input onPressEnter={goSearch} placeholder="last name" />
            </Form.Item>
          </Col>
          <Col span={3}>
            <span></span>
            {/* <Form.Item name="refunded" noStyle={true} valuePropName="checked">
              <Checkbox>Refunded</Checkbox>
  </Form.Item> */}
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
                    { value: 'JPY', label: 'JPY' }
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
          &nbsp;
          <Col span={4}>
            <Form.Item name="amountEnd" noStyle={true}>
              <Input prefix={`to ${currencySymbol}`} onPressEnter={goSearch} />
            </Form.Item>
          </Col>
          <Col span={11}>
            <span className="mr-2">Status</span>
            <Form.Item name="status" noStyle={true}>
              <Select
                mode="multiple"
                options={statusOpt}
                style={{ maxWidth: 420, minWidth: 120, margin: '8px 0' }}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </div>
  )
}
