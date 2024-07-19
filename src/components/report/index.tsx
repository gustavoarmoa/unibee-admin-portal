import {
  DeleteOutlined,
  LoadingOutlined,
  PlusOutlined,
  SaveOutlined
} from '@ant-design/icons'
import {
  Button,
  Col,
  DatePicker,
  Input,
  Row,
  Select,
  Spin,
  Switch,
  Tag,
  Tooltip,
  message
} from 'antd'
import update from 'immutability-helper'
import { ReactNode, useEffect, useRef, useState } from 'react'
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd'
import {
  exportDataReq,
  getExportFieldsReq,
  getExportFieldsWithMore,
  getExportTmplReq,
  removeExportTmplReq,
  saveExportTmplReq
} from '../../requests'
import { TExportDataType } from '../../shared.types'
import { useAppConfigStore } from '../../stores'
import './index.css'

type TExpTmpl = {
  templateId: number
  name: string
  createTime: string
  task: TExportDataType
  exportColumns: string[]
  format: 'csv' | 'xlsx'
}

type TExportField = {
  name: string
  id: string
  node: ReactNode | null
}

const settableFields: TExportField[] = [
  { name: 'Amount To', id: 'amountEnd', node: <Input /> },
  { name: 'Amount From', id: 'amountStart', node: <Input /> },
  {
    name: 'Create Time End',
    id: 'createTimeEnd',
    node: <DatePicker />
  },
  {
    name: 'Create Time Start',
    id: 'createTimeStart',
    node: <DatePicker />
  },
  { name: 'Currency', id: 'currency', node: <Select /> },
  { name: 'First Name', id: 'firstName', node: <Input /> },
  { name: 'Last Name', id: 'lastName', node: <Input /> }
]

const Index = () => {
  const appConfig = useAppConfigStore()
  /*
  const INITIA_FIELDS: TExportField[] = [
    {
      name: 'Invoice Id',
      id: 'InvoiceId',
      node: <Input style={{ width: '80%' }} />
    },
    { name: 'Invoice Number', id: 'InvoiceNumber', node: <Input /> },
    {
      name: 'User Id',
      id: 'UserId',
      node: (
        <div className=" flex items-center">
          <Select />
        </div>
      )
    },
    {
      name: 'External User Id',
      id: 'ExternalUserId',
      node: (
        <div className=" flex items-center">
          <Select
            style={{ width: '120px' }}
            options={Object.keys(SUBSCRIPTION_STATUS)
              .map((s) => ({
                label: SUBSCRIPTION_STATUS[Number(s)],
                value: Number(s)
              }))
              .sort((a, b) => (a.value < b.value ? -1 : 1))}
          />
        </div>
      )
    },
    {
      name: 'First Name',
      id: 'FirstName',
      node: (
        <div className=" flex items-center">
          <DatePicker />
        </div>
      )
    },
    {
      name: 'sub end',
      id: 'subEnd',
      node: (
        <div className=" flex items-center">
          <DatePicker />
        </div>
      )
    },
    {
      name: 'discount code',
      id: 'discountCode',
      node: (
        <div className=" flex items-center">
          <Input />
        </div>
      )
    },
    {
      name: 'payment gateway',
      id: 'paymentGateway',
      node: (
        <div className=" flex items-center">
          <Select
            style={{ width: '130px' }}
            options={appConfig.gateway.map((g) => ({
              value: g.gatewayId as number,
              label: g.displayName
            }))}
          />
        </div>
      )
    },
    {
      name: 'user status',
      id: 'userStatus',
      node: (
        <div className=" flex items-center">
          <Select
            style={{ width: '120px' }}
            options={Object.entries(USER_STATUS).map((s) => {
              const [value, text] = s
              return { value: Number(value), label: text }
            })}
          />
        </div>
      )
    }
  ]
  */

  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const allFields = useRef<TExportField[]>([])
  const [availableFields, setAvailableFields] = useState<TExportField[]>([])
  const [fields, setFields] = useState<TExportField[]>([])
  const [selectedTmpl, setSelectedTmpl] = useState<number | null>(null)
  const [templates, setTemplates] = useState<TExpTmpl[]>([]) // use ref, no need to save in state
  const [newTmplName, setNewTmplName] = useState('')

  const getFields = async () => {
    setLoading(true)
    const [res, err] = await getExportFieldsWithMore('InvoiceExport', getFields)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    console.log('get fields res: ', res)
    const { exportTmplRes, exportFieldsRes } = res
    const { templates, total } = exportTmplRes
    setTemplates(templates ?? [])
    let { columns } = exportFieldsRes
    columns = columns.map((c: string) => {
      const col = settableFields.find((f) => f.id == c)
      if (col != null) {
        return col
      } else {
        return { name: c, id: c, node: null }
      }
    })
    setAvailableFields(columns)
    allFields.current = columns
  }

  const removeField = (fieldId: string) => () => {
    console.log('removing...', fieldId)
    const idx = fields.findIndex((f) => f.id == fieldId)
    if (idx != -1) {
      setAvailableFields(update(availableFields, { $push: [fields[idx]] }))
      setFields(update(fields, { $splice: [[idx, 1]] }))
    }
  }

  const exportReportReq = async () => {
    console.log(
      'export columsn: ',
      fields.map((f) => f.id)
    )
    const exportColumns = fields.map((f) => f.id)
    setExporting(true)
    const [res, err] = await exportDataReq({
      task: 'InvoiceExport',
      payload: {},
      exportColumns
    })
    setExporting(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success(
      'Report is being exported, please check task list for progress.'
    )
    appConfig.setTaskListOpen(true)
  }

  const onSelectTmpl = (tmplId: number) => {
    const tmpl = templates.find((t) => t.templateId == tmplId)
    if (tmpl == null) {
      return
    }
    setSelectedTmpl(tmplId)
    const cols = tmpl.exportColumns ?? []
    const newAvailableFields = allFields.current.filter(
      (f) => cols.findIndex((c) => c == f.id) == -1
    )
    const newFields = cols
      .map((c) => {
        const f = allFields.current.find((field) => field.id == c)
        return f
      })
      .filter((c) => c != null)
    setAvailableFields(newAvailableFields)
    setFields(newFields as TExportField[])
    // without the 'as TExportField', TS'll complain: Type '(TExportField | undefined)[]' is not assignable to type 'TExportField[]'.
    // but I already filtered out the undefined items.
  }

  const createTmpl = async () => {
    if (newTmplName.trim() == '') {
      message.error('New template name must not be empty')
      return
    }
    setLoading(true)
    const [res, err] = await saveExportTmplReq({
      name: newTmplName,
      task: 'InvoiceExport',
      exportColumns: fields.map((f) => f.id)
    })
    setLoading(false)
    console.log('creating new template res: ', res)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success('New preset created')
    setSelectedTmpl(res.template.templateId)
    setNewTmplName('')

    // actually, I don't need to call this, just append the createNewTmpl res to the templates array.
    const [res2, err2] = await getExportTmplReq({
      task: 'InvoiceExport',
      page: 0,
      count: 100
    })
    if (null != err2) {
      message.error(err2.message)
      return
    }
    const { templates, total } = res2
    console.log('after createing new temp: ', templates)
    setTemplates(templates)
  }

  const saveTmpl = async () => {
    if (selectedTmpl == null) {
      return
    }
    setLoading(true)
    const [res, err] = await saveExportTmplReq({
      name: templates.find((t) => t.templateId == selectedTmpl)!.name,
      templateId: selectedTmpl,
      task: 'InvoiceExport',
      exportColumns: fields.map((f) => f.id)
    })
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success('Preset saved')

    const [res2, err2] = await getExportTmplReq({
      task: 'InvoiceExport',
      page: 0,
      count: 100
    })
    if (null != err2) {
      message.error(err2.message)
      return
    }
    {
      const { templates, total } = res2
      setTemplates(templates)
    }
  }

  const removeTmpl = async () => {
    if (selectedTmpl == null) {
      return
    }
    setLoading(true)
    const [res, err] = await removeExportTmplReq({
      templateId: selectedTmpl
    })
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success('Preset removed')

    const [res2, err2] = await getExportTmplReq({
      task: 'InvoiceExport',
      page: 0,
      count: 100
    })
    if (null != err2) {
      message.error(err2.message)
      return
    }

    const { templates, total } = res2
    setTemplates(templates ?? [])
    setSelectedTmpl(null)
  }

  const onDragEnd = (result: any) => {
    const { destination, source, draggableId } = result
    console.log('dragEnd result :', result)
    if (
      destination.droppableId == 'available-fields' &&
      source.droppableId == 'exported-fields'
    ) {
      console.log('no support for moving back')
      return
    }

    // reordering
    if (
      destination.droppableId == source.droppableId &&
      destination.droppableId == 'exported-fields'
    ) {
      // reordering in export-fields
      console.log('reordering...')
      if (destination.index == source.index) {
        // you are not dragging anything
        return
      }
      const srcItem = fields[source.index]
      let newFields = fields
      if (destination.index > source.index) {
        console.log('move down')
        newFields = update(fields, {
          $splice: [[destination.index + 1, 0, srcItem]]
        })
        newFields = update(newFields, { $splice: [[source.index, 1]] })
      } else {
        console.log('move up')
        newFields = update(fields, {
          $splice: [[destination.index, 0, srcItem]]
        })
        newFields = update(newFields, { $splice: [[source.index + 1, 1]] })
      }

      setFields(newFields)
      return
    }

    if (destination.droppableId == null) {
      console.log('no droppableId found')
      return
    }

    // item is dragged from source to dst
    // remove item from source
    const newAvailables = update(availableFields, {
      $splice: [[source.index, 1]]
    })

    // add item in dst
    const item = availableFields.find((f) => f.id == draggableId)
    console.log('item being dragged: ', item)
    const newFields = update(fields, {
      $splice: [
        [
          destination.index,
          0,
          { name: item!.name, id: item!.id, node: item!.node }
        ]
      ]
    })

    setAvailableFields(newAvailables)
    setFields(newFields)
  }

  useEffect(() => {
    getFields()
  }, [])

  return (
    <div>
      <div className="mb-5 flex justify-end">
        <div className="mr-6 flex">
          <Input
            value={newTmplName}
            onChange={(evt) => setNewTmplName(evt.target.value)}
          />
          <Tooltip title="New preset">
            <Button
              disabled={loading || exporting}
              onClick={createTmpl}
              icon={<PlusOutlined />}
              style={{ padding: 0, border: 'none' }}
            ></Button>
          </Tooltip>
        </div>
        <div>
          <span>Preset: </span>
          <Select
            disabled={loading || exporting}
            onChange={onSelectTmpl}
            value={selectedTmpl}
            style={{ width: '180px' }}
            options={templates.map((t) => ({
              value: t.templateId,
              label: t.name
            }))}
          />
        </div>
        <Button
          style={{ padding: 0, border: 'none' }}
          icon={<SaveOutlined />}
          onClick={saveTmpl}
          disabled={loading || exporting}
        ></Button>
        <Button
          onClick={removeTmpl}
          style={{ padding: 0, border: 'none' }}
          icon={<DeleteOutlined />}
          disabled={loading || exporting}
        ></Button>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <Spin
          spinning={loading}
          indicator={<LoadingOutlined spin />}
          size={'large'}
        >
          <div className="available-fields" style={{ minHeight: '80px' }}>
            <Droppable droppableId="available-fields">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className=" flex flex-wrap gap-2"
                >
                  {availableFields.map((f, idx) => (
                    <Draggable
                      key={f.id}
                      draggableId={f.id.toString()}
                      index={idx}
                    >
                      {(provided, snapshot) => (
                        <div
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          ref={provided.innerRef}
                        >
                          {f.node == null ? (
                            <Tag>{f.name}</Tag>
                          ) : (
                            <Tag color="blue">{f.name}</Tag>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </Spin>
        <div
          className=" my-4 p-2"
          style={{
            border: '1px solid #eee',
            borderRadius: '4px',
            minHeight: '160px'
          }}
        >
          <Row className=" mb-2">
            <Col span={1}></Col>
            <Col span={6} className=" font-bold">
              Fields
            </Col>
            <Col span={12} className="font-bold">
              settings
            </Col>
            <Col span={4} className="font-bold">
              Hidden
            </Col>
          </Row>
          <Row>
            <Col span={1}>
              {fields.map((f) => (
                <div
                  className="flex items-center justify-center"
                  style={{ height: '42px' }}
                  key={f.id}
                >
                  <Button
                    icon={<DeleteOutlined />}
                    style={{ border: 'unset', padding: 0 }}
                    onClick={removeField(f.id)}
                  ></Button>
                </div>
              ))}
            </Col>
            <Col span={6}>
              <Droppable droppableId="exported-fields">
                {(provided, snapshot) => (
                  <div
                    className="exported-fields  px-2"
                    style={{
                      // minHeight: '42px',
                      // maxHeight: '420px',
                      height: '600px',
                      overflowY: 'auto',
                      background: '#F5F5F5',
                      marginRight: '24px',
                      border: snapshot.isDraggingOver
                        ? '1px solid #bbdefb'
                        : '1px solid #F5F5F5'
                    }}
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    <div>
                      {fields.map((f, idx) => (
                        <Draggable
                          key={f.id}
                          draggableId={f.id.toString()}
                          index={idx}
                        >
                          {(provided, snapshot) => (
                            <div
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              ref={provided.innerRef}
                            >
                              <div
                                className="droppable-field flex items-center pl-2"
                                style={{
                                  borderRadius: '4px', // snapshot.isDragging ? '1px solid g'
                                  height: '42px',
                                  background: snapshot.isDragging
                                    ? '#bbdefb'
                                    : '#F5F5F5'
                                }}
                              >
                                {f.name}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                    </div>
                    <div style={{ height: '42px' }}>{provided.placeholder}</div>
                  </div>
                )}
              </Droppable>
            </Col>
            <Col span={12}>
              {fields.map((f) => (
                <div style={{ height: '42px' }} key={f.id}>
                  {f.node}
                </div>
              ))}
            </Col>
            <Col span={4}>
              {fields.map((f) => (
                <div style={{ height: '42px' }} key={f.id}>
                  <Switch defaultChecked={false} size="small" />
                </div>
              ))}
            </Col>
          </Row>
        </div>
      </DragDropContext>
      <div className=" flex items-center justify-end gap-4">
        <Button
          type="primary"
          onClick={exportReportReq}
          loading={exporting}
          disabled={exporting || loading}
        >
          Export
        </Button>
      </div>
    </div>
  )
}

export default Index
