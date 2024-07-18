import {
  DownloadOutlined,
  LoadingOutlined,
  UploadOutlined
} from '@ant-design/icons'
import {
  Button,
  Col,
  DatePicker,
  Input,
  Modal,
  Row,
  Select,
  Steps,
  Switch,
  Tag,
  message
} from 'antd'
import update from 'immutability-helper'
import { ReactElement, ReactNode, useState } from 'react'
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd'
import { SUBSCRIPTION_STATUS, USER_STATUS } from '../../constants'
import { downloadStaticFile, formatBytes } from '../../helpers'
import { importDataReq } from '../../requests'
import '../../shared.css'
import { TImportDataType } from '../../shared.types'
import { useAppConfigStore } from '../../stores'

type TExportField = {
  name: string
  id: number
  render: () => ReactNode
}

const Index = ({ closeModal }: { closeModal: () => void }) => {
  const appConfig = useAppConfigStore()
  const INITIA_FIELDS: TExportField[] = [
    {
      name: 'user name',
      id: 0,
      render: () => <Input style={{ width: '80%' }} />
    },
    { name: 'email', id: 1, render: () => <Input /> },
    {
      name: 'subscription plan',
      id: 2,
      render: () => (
        <div className=" flex items-center">
          <Select />
        </div>
      )
    },
    {
      name: 'sub status',
      id: 3,
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
      name: 'sub start',
      id: 4,
      render: () => (
        <div className=" flex items-center">
          <DatePicker />
        </div>
      )
    },
    {
      name: 'sub end',
      id: 5,
      render: () => (
        <div className=" flex items-center">
          <DatePicker />
        </div>
      )
    },
    {
      name: 'discount code',
      id: 6,
      render: () => (
        <div className=" flex items-center">
          <Input />
        </div>
      )
    },
    {
      name: 'payment gateway',
      id: 7,
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
      id: 8,
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
  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result
    console.log('dragEnd result :', result)
    /*
    if (destination.droppableId == source.droppableId) {
      return
    }
      */

    if (
      destination.droppableId == source.droppableId &&
      destination.droppableId == 'exported-fields'
    ) {
      // reordering in export-fields
      const item = fields.find((f) => f.name == draggableId)

      return
    }

    if (destination.droppableId == null) {
      console.log('no droppableId found')
      return
    }
    const newAvailables = update(availableFields, {
      $splice: [[source.index, 1]]
    })
    setAvailableFields(newAvailables)

    const item = availableFields.find((f) => f.name == draggableId)
    // console.log('draggable item: ', item)
    const newFields = update(fields, {
      $splice: [
        [
          destination.index,
          1,
          { name: item!.name, id: item!.id, render: item!.render }
        ]
      ]
    })
    setFields(newFields)
  }

  return (
    <Modal
      title="Custom user data export"
      width={'800px'}
      open={true}
      footer={null}
      closeIcon={null}
    >
      <div className=" my-6">
        <div className="available-fields">
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="available-fields">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {availableFields.map((f, idx) => (
                    <Draggable key={f.name} draggableId={f.name} index={f.id}>
                      {(provided) => (
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
            <div
              className=" my-4 p-2"
              style={{
                border: '1px solid #eee',
                borderRadius: '4px',
                minHeight: '160px'
              }}
            >
              <Row>
                <Col span={4} className=" font-bold">
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
                <Col span={4}>
                  <Droppable droppableId="exported-fields">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="exported-fields "
                      >
                        <div style={{ minHeight: '160px' }}>
                          {fields.map((f, idx) => (
                            <Draggable
                              key={f.name}
                              draggableId={f.name}
                              index={f.id}
                            >
                              {(provided) => (
                                <span
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  ref={provided.innerRef}
                                >
                                  <div
                                    className="flex items-center"
                                    style={{ height: '42px' }}
                                  >
                                    {f.name}
                                  </div>
                                </span>
                              )}
                            </Draggable>
                          ))}
                        </div>
                        {provided.placeholder}
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
        </div>

        <div className=" flex items-center justify-end gap-4">
          <Button onClick={closeModal} disabled={importing}>
            Close
          </Button>
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
    </Modal>
  )
}

export default Index
