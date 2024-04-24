import { CopyOutlined, LoadingOutlined } from '@ant-design/icons'
import { Button, Col, Input, Modal, Row, Spin, message } from 'antd'
// import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
// import { useCopyContent } from '../../hooks'
import { saveGatewayKeyReq, saveVatSenseKeyReq } from '../../requests'
import { TGateway } from '../../shared.types'
const { TextArea } = Input

interface IProps {
  closeModal: () => void
  // gatewayDetail: TGateway | undefined
}
const Index = ({ closeModal }: IProps) => {
  const [loading, setLoading] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const onKeyChange: React.ChangeEventHandler<HTMLTextAreaElement> = (evt) => {
    setApiKey(evt.target.value)
  }
  const onSaveKey = async () => {
    setLoading(true)
    const [res, err] = await saveVatSenseKeyReq(apiKey)
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    message.success(`VATsense API key saved`)
    closeModal()
  }

  return (
    <div style={{ margin: '32px 0' }}>
      <Modal
        title={`VAT sense API key setup`}
        width={'640px'}
        open={true}
        footer={null}
        closeIcon={null}
      >
        <div className="my-6  w-full ">
          <Row gutter={[16, 32]} style={{ marginBottom: '12px' }}>
            <Col span={4}>Your API key</Col>
            <Col span={20}>
              <TextArea rows={4} value={apiKey} onChange={onKeyChange} />
            </Col>
          </Row>
          <Row>
            <Col span={4}></Col>
            <Col span={20}>
              Apply your key at&nbsp;&nbsp;
              <a href="https://vatsense.com" target="_blank">
                https://vatsense.com
              </a>{' '}
            </Col>
          </Row>
        </div>
        <div className="flex justify-end gap-4">
          <Button onClick={closeModal} disabled={loading}>
            Close
          </Button>
          <Button
            type="primary"
            onClick={onSaveKey}
            disabled={loading}
            loading={loading}
          >
            Save
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default Index
