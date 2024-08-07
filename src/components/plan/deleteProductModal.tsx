import { Button, Form, message, Modal } from 'antd'
import React, { useEffect, useState } from 'react'
import { deleteProductReq } from '../../requests'
import { useAppConfigStore } from '../../stores'

interface Props {
  refresh: () => void
  closeModal: () => void
  productId: number
}

const Index = ({ closeModal, refresh, productId }: Props) => {
  const [loading, setLoading] = useState(false)

  const onDelete = async () => {
    setLoading(true)
    const [res, err] = await deleteProductReq(productId)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    refresh()
  }

  return (
    <Modal
      title="Product delete confirm"
      open={true}
      width={'720px'}
      footer={null}
      closeIcon={null}
    >
      <p>Are you sure you want to delete this product?</p>
      <div
        className="flex items-center justify-end gap-4"
        style={{
          marginTop: '24px'
        }}
      >
        <Button onClick={closeModal} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="primary"
          onClick={onDelete}
          loading={loading}
          disabled={loading}
        >
          OK
        </Button>
      </div>
    </Modal>
  )
}

export default Index
