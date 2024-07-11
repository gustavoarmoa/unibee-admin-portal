import {
  DownloadOutlined,
  ExportOutlined,
  ImportOutlined,
  LoadingOutlined,
  MoreOutlined,
  ProfileOutlined,
  SyncOutlined,
  UploadOutlined
} from '@ant-design/icons'
import {
  Button,
  Col,
  DatePicker,
  Dropdown,
  Form,
  FormInstance,
  Input,
  MenuProps,
  Modal,
  Pagination,
  Row,
  Select,
  Space,
  Spin,
  Steps,
  Table,
  Tooltip,
  message
} from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'
import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CURRENCY, SUBSCRIPTION_STATUS } from '../../constants'
import {
  downloadStaticFile,
  formatBytes,
  formatDate,
  formatPlanInterval,
  showAmount
} from '../../helpers'
import { usePagination } from '../../hooks'
import {
  exportDataReq,
  getPlanList,
  getSublist,
  importDataReq
} from '../../requests'
import '../../shared.css'
import { IPlan, ISubscriptionType, TImportDataType } from '../../shared.types.d'
import { useAppConfigStore } from '../../stores'
import { SubscriptionStatus } from '../ui/statusTag'

const APP_PATH = import.meta.env.BASE_URL
const PAGE_SIZE = 10
const SUB_STATUS_FILTER = Object.keys(SUBSCRIPTION_STATUS)
  .map((s) => ({
    text: SUBSCRIPTION_STATUS[Number(s)],
    value: Number(s)
  }))
  .sort((a, b) => (a.value < b.value ? -1 : 1))

type TFilters = {
  status: number[] | null
  planIds: number[] | null
}

const Index = () => {
  const navigate = useNavigate()
  const appConfigStore = useAppConfigStore()
  const [form] = Form.useForm()
  const { page, onPageChange } = usePagination()
  const [total, setTotal] = useState(0)
  const [subList, setSubList] = useState<ISubscriptionType[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingPlans, setLoadingPlans] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState<
    TImportDataType | false
  >(false) // false: modal is close, other values will trigger it open. TImportDataType has 2 values in this component: ActiveSubscriptionImport | HistorySubscriptionImport

  const [filters, setFilters] = useState<TFilters>({
    status: null,
    planIds: null
  })
  const planFilterRef = useRef<{ value: number; text: string }[]>([])

  const exportData = async () => {
    let payload = normalizeSearchTerms()
    if (null == payload) {
      return
    }
    payload = { ...payload, ...filters }
    console.log('export tx params: ', payload)
    // return
    setExporting(true)
    const [res, err] = await exportDataReq({
      task: 'SubscriptionExport',
      payload
    })
    setExporting(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    message.success(
      'Subscription list is being exported, please check task list for progress.'
    )
    appConfigStore.setTaskListOpen(true)
  }

  const extraActions: { [key: string]: () => void } = {
    exportData: exportData,
    importActiveSub: () => setImportModalOpen('ActiveSubscriptionImport'),
    importSubHistory: () => setImportModalOpen('HistorySubscriptionImport')
  }

  const extraButtons = [
    {
      key: 'exportData',
      label: 'Export',
      icon: <ExportOutlined />
    },
    {
      key: 'importActiveSub',
      label: 'Import active subscription',
      icon: <ImportOutlined />
    },
    {
      key: 'importSubHistory',
      label: 'Import subscription history',
      icon: <ImportOutlined />
    }
    /* {
      key: 'downloadImportTemplate',
      label: 'Download import template',
      icon: <DownloadOutlined />
    } */
  ]
  const onMenuClick: MenuProps['onClick'] = (e) => {
    extraActions[e.key]()
  }

  const getColumns = (): ColumnsType<ISubscriptionType> => [
    {
      title: 'Plan Name',
      dataIndex: 'planName',
      key: 'planIds',
      filters: planFilterRef.current,
      filteredValue: filters.planIds,
      render: (_, sub) => (
        <span>
          {`${sub.plan?.planName}`}{' '}
          <span className=" text-xs text-gray-400">
            (
            {`${showAmount(sub.plan?.amount, sub.plan?.currency)}/${formatPlanInterval(sub.plan)}`}
            )
          </span>
        </span>
      )
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (_, sub) => <span>{sub.plan?.description}</span>
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amt, s) =>
        `${showAmount(amt, s.currency)}/${formatPlanInterval(s.plan)}`
    },
    /* {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (_, s) => (
        <span>{` ${showAmount(
          s.plan!.amount +
            (s.addons == null
              ? 0
              : s.addons!.reduce(
                  // total subscription amount = plan amount + all addons(an array): amount * quantity
                  // this value might not be the value users are gonna pay on next billing cycle
                  // because, users might downgrade their plan.
                  (
                    sum,
                    { quantity, amount }: { quantity: number; amount: number } // destructure the quantity and amount from addon obj
                  ) => sum + quantity * amount,
                  0
                )),
          s.plan!.currency
        )}/${formatPlanInterval(s.plan)}
        `}</span>
      )
    }, */
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (_, sub) => SubscriptionStatus(sub.status),
      filters: SUB_STATUS_FILTER,
      filteredValue: filters.status
    },
    {
      title: 'Start',
      dataIndex: 'currentPeriodStart',
      key: 'currentPeriodStart',
      render: (_, sub) =>
        // (sub.currentPeriodStart * 1000).format('YYYY-MMM-DD HH:MM')
        formatDate(sub.currentPeriodStart, true)
    },
    {
      title: 'End',
      dataIndex: 'currentPeriodEnd',
      key: 'currentPeriodEnd',
      render: (_, sub) =>
        // dayjs(sub.currentPeriodEnd * 1000).format('YYYY-MMM-DD HH:MM')
        formatDate(sub.currentPeriodEnd, true)
    },
    {
      title: 'User',
      dataIndex: 'userId',
      key: 'userId',
      render: (_, sub) => (
        <span>{`${sub.user != null ? sub.user.firstName + ' ' + sub.user.lastName : ''}`}</span>
      )
    },
    {
      title: 'Email',
      dataIndex: 'userEmail',
      key: 'userEmail',
      render: (_, sub) =>
        sub.user != null ? (
          <a href={`mailto:${sub.user.email}`}>{sub.user.email}</a>
        ) : null
    },
    {
      title: (
        <>
          <span>Actions</span>
          <Tooltip title="Refresh">
            <Button
              size="small"
              style={{ marginLeft: '8px' }}
              disabled={loading}
              onClick={fetchData}
              icon={<SyncOutlined />}
            ></Button>
          </Tooltip>
          <Dropdown menu={{ items: extraButtons, onClick: onMenuClick }}>
            <Button
              icon={<MoreOutlined />}
              size="small"
              style={{ marginLeft: '8px' }}
            ></Button>
          </Dropdown>
          {/* <Tooltip title="Export">
            <Button
              size="small"
              style={{ marginLeft: '8px' }}
              disabled={loading || exporting}
              onClick={exportData}
              loading={exporting}
              icon={<ExportOutlined />}
            ></Button>
          </Tooltip> */}
        </>
      ),
      key: 'action',
      width: 160,
      // fixed: 'right',
      render: (_) => (
        <Space
          size="small"
          className="invoice-action-btn-wrapper"
          // style={{ width: '170px' }}
        >
          <Tooltip title="Detail">
            <Button
              // onClick={toggleNewInvoiceModal}
              icon={<ProfileOutlined />}
              style={{ border: 'unset' }}
              // disabled={!getInvoicePermission(invoice).editable}
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  const fetchData = async () => {
    const searchTerm = normalizeSearchTerms()
    if (null == searchTerm) {
      return
    }
    setLoading(true)
    const [res, err] = await getSublist(
      {
        page: page as number,
        count: PAGE_SIZE,
        ...filters,
        ...searchTerm
      },
      fetchData
    )
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    const { subscriptions, total } = res
    if (subscriptions == null) {
      setSubList([])
      setTotal(0)
      return
    }

    const list: ISubscriptionType[] = subscriptions.map((s: any) => {
      return {
        ...s.subscription,
        plan: s.plan,
        addons:
          s.addons == null
            ? []
            : s.addons.map((a: any) => ({
                ...a.addonPlan,
                quantity: a.quantity
              })),
        user: s.user
      }
    })
    setSubList(list)
    setTotal(total)
  }

  const fetchPlan = async () => {
    setLoadingPlans(true)
    const [planList, err] = await getPlanList(
      {
        type: [1], // 'main plan' only
        status: [2], // 'active' only
        page: page,
        count: 100
      },
      fetchPlan
    )
    setLoadingPlans(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    const { plans, total } = planList
    planFilterRef.current =
      plans == null
        ? []
        : plans.map((p: any) => ({
            value: p.plan.id,
            text: p.plan.planName
          }))
  }

  const onTableChange: TableProps<ISubscriptionType>['onChange'] = (
    pagination,
    filters,
    sorter,
    extra
  ) => {
    // console.log('params', pagination, filters, sorter, extra);
    // onPageChange(1, PAGE_SIZE)
    setFilters(filters as TFilters)
  }

  const normalizeSearchTerms = () => {
    const searchTerm = JSON.parse(JSON.stringify(form.getFieldsValue()))
    Object.keys(searchTerm).forEach(
      (k) =>
        (searchTerm[k] == undefined ||
          (typeof searchTerm[k] == 'string' && searchTerm[k].trim() == '')) &&
        delete searchTerm[k]
    )
    const start = form.getFieldValue('createTimeStart')
    const end = form.getFieldValue('createTimeEnd')
    if (start != null) {
      searchTerm.createTimeStart = start.hour(0).minute(0).second(0).unix()
    }
    if (end != null) {
      searchTerm.createTimeEnd = end.hour(23).minute(59).second(59).unix()
    }

    let amtFrom = searchTerm.amountStart,
      amtTo = searchTerm.amountEnd
    if (amtFrom != '' && amtFrom != null) {
      amtFrom = Number(amtFrom) * CURRENCY[searchTerm.currency].stripe_factor
      if (isNaN(amtFrom) || amtFrom < 0) {
        message.error('Invalid amount-from value.')
        return null
      }
    }
    if (amtTo != '' && amtTo != null) {
      amtTo = Number(amtTo) * CURRENCY[searchTerm.currency].stripe_factor
      if (isNaN(amtTo) || amtTo < 0) {
        message.error('Invalid amount-to value')
        return null
      }
    }

    if (
      typeof amtFrom == 'number' &&
      typeof amtTo == 'number' &&
      amtFrom > amtTo
    ) {
      message.error('Amount-from must be less than or equal to amount-to')
      return null
    }
    searchTerm.amountStart = amtFrom
    searchTerm.amountEnd = amtTo
    console.log('search term:  ', searchTerm)
    return searchTerm
  }

  const clearFilters = () => setFilters({ status: null, planIds: null })

  const goSearch = () => {
    if (page == 0) {
      fetchData()
    } else {
      onPageChange(1, PAGE_SIZE)
    }
  }

  useEffect(() => {
    fetchData()
  }, [page, filters])

  useEffect(() => {
    fetchPlan()
  }, [])

  return (
    <div>
      {importModalOpen !== false && (
        <ImportModal
          closeModal={() => setImportModalOpen(false)}
          importType={importModalOpen}
        />
      )}
      <Search
        form={form}
        goSearch={goSearch}
        searching={loading || loadingPlans}
        exporting={exporting}
        onPageChange={onPageChange}
        clearFilters={clearFilters}
      />
      <div className=" mb-3"></div>
      {loadingPlans ? (
        <Spin
          indicator={<LoadingOutlined spin />}
          size="large"
          style={{
            width: '100%',
            height: '320px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        />
      ) : (
        <Table
          columns={getColumns()}
          dataSource={subList}
          rowKey={'id'}
          rowClassName="clickable-tbl-row"
          pagination={false}
          onChange={onTableChange}
          onRow={(record, rowIndex) => {
            return {
              onClick: (event) => {
                navigate(`${APP_PATH}subscription/${record.subscriptionId}`, {
                  state: { subscriptionId: record.subscriptionId }
                })
              }
            }
          }}
          loading={{
            spinning: loading,
            indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />
          }}
        />
      )}

      <div className="mx-0 my-4 flex items-center justify-end">
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

const DEFAULT_TERM = {
  currency: 'EUR'
  // status: [],
  // amountStart: '',
  // amountEnd: ''
  // refunded: false,
}
const Search = ({
  form,
  searching,
  exporting,
  goSearch,
  onPageChange,
  clearFilters
}: {
  form: FormInstance<any>
  searching: boolean
  exporting: boolean
  goSearch: () => void
  onPageChange: (page: number, pageSize: number) => void
  clearFilters: () => void
}) => {
  const clear = () => {
    form.resetFields()
    onPageChange(1, PAGE_SIZE)
    clearFilters()
  }

  const currencySymbol =
    CURRENCY[form.getFieldValue('currency') || DEFAULT_TERM.currency].symbol

  return (
    <div>
      <Form
        form={form}
        onFinish={goSearch}
        initialValues={DEFAULT_TERM}
        disabled={searching || exporting}
      >
        <Row className=" mb-3 flex items-center" gutter={[8, 8]}>
          <Col span={4} className=" font-bold text-gray-500">
            Subscription created
          </Col>
          <Col span={4}>
            <Form.Item name="createTimeStart" noStyle={true}>
              <DatePicker
                style={{ width: '100%' }}
                placeholder="From"
                format="YYYY-MMM-DD"
                disabledDate={(d) => d.isAfter(new Date())}
              />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item
              name="createTimeEnd"
              noStyle={true}
              rules={[
                {
                  required: false,
                  message: 'Must be later than start date.'
                },
                ({ getFieldValue }) => ({
                  validator(rule, value) {
                    const start = getFieldValue('createTimeStart')
                    if (null == start || value == null) {
                      return Promise.resolve()
                    }
                    return value.isAfter(start)
                      ? Promise.resolve()
                      : Promise.reject('Must be later than start date')
                  }
                })
              ]}
            >
              <DatePicker
                style={{ width: '100%' }}
                placeholder="To"
                format="YYYY-MMM-DD"
                disabledDate={(d) => d.isAfter(new Date())}
              />
            </Form.Item>
          </Col>
          <Col span={12} className="flex justify-end">
            <Space>
              <Button onClick={clear} disabled={searching || exporting}>
                Clear
              </Button>
              <Button
                onClick={form.submit}
                type="primary"
                loading={searching}
                disabled={searching || exporting}
              >
                Search
              </Button>
              {/* <Button
                onClick={exportData}
                loading={exporting}
                disabled={searching || exporting}
              >
                Export
              </Button> */}
            </Space>
          </Col>
        </Row>
        <Row className="flex items-center" gutter={[8, 8]}>
          <Col span={4} className="font-bold text-gray-500">
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
                onPressEnter={form.submit}
              />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item name="amountEnd" noStyle={true}>
              <Input
                prefix={`to ${currencySymbol}`}
                onPressEnter={form.submit}
              />
            </Form.Item>
          </Col>
          {/* <Col span={11} className=" ml-4 font-bold text-gray-500">
            <span className="mr-2">Status</span>
            <Form.Item name="status" noStyle={true}>
              <Select
                mode="multiple"
                options={statusOpt}
                style={{ maxWidth: 420, minWidth: 120, margin: '8px 0' }}
              />
            </Form.Item>
          </Col> */}
        </Row>
      </Form>
    </div>
  )
}

const ImportModal = ({
  closeModal,
  importType
}: {
  closeModal: () => void
  importType: TImportDataType
}) => {
  const appConfig = useAppConfigStore()
  const [importing, setImporting] = useState(false)
  const [fileStat, setFileStat] = useState({ name: '', size: 0 })

  const title: { [key in TImportDataType]: string } = {
    UserImport: 'User import',
    ActiveSubscriptionImport: 'Active subscription import',
    HistorySubscriptionImport: 'Subscription history import'
  }

  const downloadTemplate: { [key in TImportDataType]: () => void } = {
    UserImport: () => {},
    ActiveSubscriptionImport: () => {
      console.log('active sub import')
      downloadStaticFile(
        'https://api.unibee.top/import/template/active_subscription_import',
        'active_subscription_import_template.xlsx'
      )
    },
    HistorySubscriptionImport: () => {
      console.log('history sub import')
      downloadStaticFile(
        'https://api.unibee.top/import/template/history_subscription_import',
        'subscription_history_import_template.xlsx'
      )
    }
  }

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = async (
    evt
  ) => {
    console.log('file change: ', evt)
    if (evt.target.files == null) {
      return
    }
    const f = evt.target.files[0]
    if (f.size > 1024 * 1024 * 20) {
      message.error('Max file size is 20M')
      return
    }
    setFileStat({ name: f.name, size: f.size })
    // evt.preventDefault()
    // console.log('importing: ', importType, '///', f)
    // return
    setImporting(true)
    const [res, err] = await importDataReq(f, importType)
    setImporting(false)
    evt.target.value = ''
    if (null != err) {
      message.error(`File upload failed: ${err.message}`)
      return
    }
    message.success(
      'Data is being imported, please check task list for progress'
    )
    closeModal()
    appConfig.setTaskListOpen(true)
  }

  return (
    <Modal
      title={title[importType]}
      width={'620px'}
      open={true}
      footer={null}
      closeIcon={null}
    >
      <div className=" my-6">
        <Steps
          direction="vertical"
          size="small"
          // progressDot={true}
          current={1}
          items={[
            {
              title: (
                <Button
                  onClick={downloadTemplate[importType]}
                  size="small"
                  icon={<DownloadOutlined />}
                >
                  Download template file
                </Button>
              ),
              description: (
                <span className=" text-xs text-gray-500">
                  To-be-imported data must comply to the structure in this
                  template file.
                </span>
              ),
              status: 'process'
            },
            {
              title: (
                <span className=" text-lg text-gray-900">
                  Populate template file with your data
                </span>
              ),
              description: (
                <span className=" text-xs text-gray-500">
                  You cannot remove/modify column name in this file.
                </span>
              ),
              status: 'process'
            },
            {
              title: (
                <div className="items-c flex">
                  <label htmlFor="input-user-data-file">
                    <div
                      className={`user-data-file-upload flex items-center ${importing ? 'disabled' : ''}`}
                    >
                      {importing ? <LoadingOutlined /> : <UploadOutlined />}{' '}
                      <span className=" ml-2">Upload and import</span>
                    </div>
                  </label>
                  <div className="ml-2 flex items-center text-sm text-gray-500">
                    {`${fileStat.name} ${fileStat.size == 0 ? '' : '(' + formatBytes(fileStat.size) + ')'}`}
                  </div>
                  <input
                    type="file"
                    hidden
                    disabled={importing}
                    onChange={onFileChange}
                    // onClick={onFileClick}
                    style={{ display: 'none' }}
                    id="input-user-data-file"
                    name="input-user-data-file"
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  />
                </div>
              ),
              description: (
                <span className="text-xs text-gray-500">
                  Max file size: <span className=" text-red-500">20M</span>
                </span>
              ),
              status: 'process'
            },
            {
              title: (
                <span className=" text-gray-900">
                  Open task list to check importing progress
                </span>
              ),
              description: (
                <span className=" text-xs text-gray-500">
                  In case of importing error, you can download the file you just
                  uploaded, each error will be explained in detail.
                </span>
              ),
              status: 'process'
            },
            {
              title: (
                <span className=" text-gray-900">
                  Refresh the page to further ensure data are imported
                </span>
              ),
              status: 'process'
            }
          ]}
        />
        <div className=" flex items-center justify-end gap-4">
          <Button onClick={closeModal} disabled={importing}>
            Close
          </Button>
          {/* <Button
            type="primary"
            // onClick={form.submit}
            // loading={loading}
            // disabled={loading}
          >
            Import
          </Button> */}
        </div>
      </div>
    </Modal>
  )
}
