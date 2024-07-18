import { DeleteOutlined, SaveOutlined } from '@ant-design/icons'
import {
  Button,
  Col,
  DatePicker,
  Input,
  Row,
  Select,
  Switch,
  Tag,
  message
} from 'antd'
import update from 'immutability-helper'
import { ReactNode, useEffect, useState } from 'react'
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd'
import { SUBSCRIPTION_STATUS, USER_STATUS } from '../../constants'
import { getExportFieldsReq } from '../../requests'
import { useAppConfigStore } from '../../stores'

type TExportField = {
  name: string
  id: string
  render: () => ReactNode
}

const settableFields: TExportField[] = [
  { name: 'Amount To', id: 'amountEnd', render: () => <Input /> },
  { name: 'Amount From', id: 'amountStart', render: () => <Input /> },
  {
    name: 'Create Time End',
    id: 'createTimeEnd',
    render: () => <DatePicker />
  },
  {
    name: 'Create Time Start',
    id: 'createTimeStart',
    render: () => <DatePicker />
  },
  { name: 'Currency', id: 'currency', render: () => <Select /> },
  { name: 'First Name', id: 'firstName', render: () => <Input /> },
  { name: 'Last Name', id: 'lastName', render: () => <Input /> }
]

const Index = () => {
  const appConfig = useAppConfigStore()
  const INITIA_FIELDS: TExportField[] = [
    {
      name: 'Invoice Id',
      id: 'InvoiceId',
      render: () => <Input style={{ width: '80%' }} />
    },
    { name: 'Invoice Number', id: 'InvoiceNumber', render: () => <Input /> },
    {
      name: 'User Id',
      id: 'UserId',
      render: () => (
        <div className=" flex items-center">
          <Select />
        </div>
      )
    },
    {
      name: 'External User Id',
      id: 'ExternalUserId',
      render: () => (
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
      render: () => (
        <div className=" flex items-center">
          <DatePicker />
        </div>
      )
    },
    {
      name: 'sub end',
      id: 'subEnd',
      render: () => (
        <div className=" flex items-center">
          <DatePicker />
        </div>
      )
    },
    {
      name: 'discount code',
      id: 'discountCode',
      render: () => (
        <div className=" flex items-center">
          <Input />
        </div>
      )
    },
    {
      name: 'payment gateway',
      id: 'paymentGateway',
      render: () => (
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
      render: () => (
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

  const [importing, setImporting] = useState(false)
  const [availableFields, setAvailableFields] =
    useState<TExportField[]>(INITIA_FIELDS)
  const [fields, setFields] = useState<TExportField[]>([])

  const getFields = async () => {
    const [res, err] = await getExportFieldsReq({ task: 'InvoiceExport' })
    if (null != err) {
      message.error(err.message)
      return
    }
    console.log('get fields res: ', res)
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
      if (destination.index == source.index) {
        // you are not dragging anything
        return
      }
      const srcItem = fields[source.index]
      const dstItem = fields[destination.index]
      let newFields = update(fields, {
        [source.index]: { $set: { ...dstItem } }
      })
      newFields = update(newFields, {
        [destination.index]: { $set: { ...srcItem } }
      })
      setFields(newFields)
      return
    }

    if (destination.droppableId == null) {
      console.log('no droppableId found')
      return
    }

    // item is dragged from source to dst
    const newAvailables = update(availableFields, {
      $splice: [[source.index, 1]]
    })
    setAvailableFields(newAvailables)

    const item = INITIA_FIELDS.find((f) => f.id == draggableId)
    console.log('item being dragged: ', item)
    const newFields = update(fields, {
      $splice: [
        [
          destination.index,
          0,
          { name: item!.name, id: item!.id, render: item!.render }
        ]
      ]
    })
    setFields(newFields)
  }

  useEffect(() => {
    getFields()
  }, [])

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <div>
          <span>Preset: </span>
          <Select style={{ width: '130px' }} />
        </div>
        <Button
          style={{ padding: 0, border: 'none' }}
          icon={<SaveOutlined />}
        ></Button>
        <Button
          style={{ padding: 0, border: 'none' }}
          icon={<DeleteOutlined />}
        ></Button>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="available-fields">
          <Droppable droppableId="available-fields">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {availableFields.map((f, idx) => (
                  <Draggable
                    key={f.id}
                    draggableId={f.id.toString()}
                    index={idx}
                  >
                    {(provided, snapshot) => (
                      <span
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        ref={provided.innerRef}
                      >
                        <Tag>{f.name}</Tag>
                      </span>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
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
                  <DeleteOutlined />
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
                                className="flex items-center pl-2"
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
                  {f.render()}
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
          // onClick={form.submit}
          // loading={loading}
          // disabled={loading}
        >
          Export
        </Button>
      </div>
    </div>
  )
}

export default Index
