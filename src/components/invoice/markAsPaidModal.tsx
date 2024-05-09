// import { EditFilled, MinusOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Col, Form, Input, message, Modal, Row } from 'antd'
import React, { useState } from 'react'
import { showAmount } from '../../helpers'
import { markInvoiceAsPaidReq } from '../../requests'
import { useAppConfigStore } from '../../stores'

const { TextArea } = Input

interface Props {
  invoiceId: string
  closeModal: () => void
  refresh: () => void
}

const Index = ({ closeModal, refresh, invoiceId }: Props) => {
  const [form] = Form.useForm()
  const appConfigStore = useAppConfigStore()
  const [loading, setLoading] = useState(false)

  const onConfirm = async () => {
    setLoading(true)
    const [res, err] = await markInvoiceAsPaidReq(
      invoiceId,
      form.getFieldValue('reason'),
      form.getFieldValue('TransferNumber')
    )
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    refresh()
    closeModal()
  }

  return (
    <Modal
      title="Invoice Paid Confirm"
      open={true}
      width={'620px'}
      footer={null}
      closeIcon={null}
    >
      <div style={{ height: '12px' }}></div>
      <p>
        Are you sure you have received the payment and want to mark this invoice
        as <span className=" text-red-600">PAID</span>?{' '}
      </p>
      <Form
        form={form}
        onFinish={onConfirm}
        // labelCol={{ span: 4 }}
        labelCol={{ flex: '130px' }}
        // wrapperCol={{ span: 20 }}
        wrapperCol={{ flex: 1 }}
        colon={false}
        // layout="horizontal"
        // disabled={componentDisabled}
        style={{ marginTop: '18px' }}
        // initialValues={plan}
      >
        <Form.Item
          label="Transfer Number"
          name="TransferNumber"
          rules={[
            {
              required: true,
              message: 'Please input the Transfer Number!'
            }
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Comment"
          name="reason"
          rules={[
            {
              required: true,
              message: 'Please input your comment!'
            }
          ]}
        >
          <TextArea
            showCount
            maxLength={120}
            style={{ height: 120, resize: 'none' }}
          />
        </Form.Item>
      </Form>

      <div className="mt-6 flex items-center justify-end gap-4">
        <div style={{ display: 'flex', gap: '16px', margin: '16px 0' }}>
          <Button onClick={closeModal} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={form.submit}
            type="primary"
            disabled={loading}
            loading={loading}
          >
            Mark as Paid
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default Index
