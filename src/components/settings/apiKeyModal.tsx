import { CopyOutlined, LoadingOutlined } from '@ant-design/icons'
import { Button, Modal, Spin, message } from 'antd'
import { useEffect, useState } from 'react'
import { useCopyContent } from '../../hooks'
import { generateApiKeyReq } from '../../requests'

interface IProps {
  closeModal: () => void
}
const Index = ({ closeModal }: IProps) => {
  const [loading, setLoading] = useState(true)
  const [key, setKey] = useState('')
  const onCreateKey = async () => {
    const [key, err] = await generateApiKeyReq()
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    setKey(key)
  }

  const copyContent = async () => {
    const err = await useCopyContent(key)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success('Copied')
  }

  useEffect(() => {
    onCreateKey()
  }, [])

  return (
    <div style={{ margin: '32px 0' }}>
      <Modal
        title="API key"
        width={'640px'}
        open={true}
        footer={null}
        closeIcon={null}
      >
        <div className="my-6 flex w-full items-center justify-center gap-4">
          <div>
            {loading ? (
              <Spin
                spinning={loading}
                indicator={
                  <LoadingOutlined
                    style={{ fontSize: 32, color: 'blue' }}
                    spin
                  />
                }
              />
            ) : (
              <div className="flex w-full flex-col items-center justify-center">
                <h1>Your API key</h1>
                <div className="flex items-center">
                  <div className="text-lg text-red-700">{key}</div>
                  <Button
                    type="link"
                    onClick={copyContent}
                    icon={<CopyOutlined />}
                  >
                    Copy
                  </Button>
                </div>
                <div className="my-4 text-xs text-gray-500">
                  This key won't show on this page after you close, please copy
                  and save it in a secure area.
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={closeModal}>Close</Button>
        </div>
      </Modal>
    </div>
  )
}

export default Index
