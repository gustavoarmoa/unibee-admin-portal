import { DoubleRightOutlined } from '@ant-design/icons'
import { Button, message } from 'antd'
import TextArea from 'antd/es/input/TextArea'
import { useEffect, useState } from 'react'
import { createAdminNoteReq, getAdminNoteReq } from '../../requests'
import './adminNote.css'

const Index = ({
  pushed,
  togglePush
}: {
  pushed: boolean
  togglePush: () => void
}) => {
  const pathName = window.location.pathname.split('/')
  const subscriptionId = pathName.pop()
  const [loading, setLoading] = useState(false)
  const [noteList, setNoteList] = useState([])
  const [note, setNote] = useState('')

  const createNote = async () => {
    if (subscriptionId == null) {
      return
    }
    const [res, err] = await createAdminNoteReq({ subscriptionId, note })
    if (null != err) {
      message.error(err.message)
      return
    }
    fetchData()
  }

  const onNoteChange = (evt: React.ChangeEvent<HTMLTextAreaElement>) =>
    setNote(evt.target.value)

  const fetchData = async () => {
    if (subscriptionId == null) {
      message.error("Subscription didn't exist")
      return
    }

    setLoading(true)
    const [noteList, err] = await getAdminNoteReq({
      subscriptionId,
      page: 0,
      count: 100,
      refreshCb: fetchData
    })
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    console.log('noets list res: ', noteList)
  }
  useEffect(() => {
    fetchData()
  }, [])
  return (
    <div
      id="admin-not-wrapper"
      className="absolute h-full rounded-sm px-2 py-2"
      style={{
        width: '20%',
        right: pushed ? '-20%' : 0,
        border: '1px solid #EEE'
      }}
    >
      <div
        onClick={togglePush}
        className="absolute flex cursor-pointer items-center justify-center"
        style={{ width: '32px', height: '32px', left: '-36px', top: '-4px' }}
      >
        <DoubleRightOutlined rotate={pushed ? 180 : 0} />
      </div>
      <div className="flex items-center justify-center text-gray-500">
        admin side note
      </div>
      <div
        className="mb-4 flex flex-col items-center justify-center text-gray-500"
        style={{
          height: '70%'
        }}
      >
        <div>main content</div>
        <div>side note1</div>
        <div>side note2</div>
      </div>

      <div
        style={{
          height: '150px',
          position: 'absolute',
          bottom: 0,
          width: '100%'
        }}
      >
        <TextArea
          rows={4}
          value={note}
          onChange={onNoteChange}
          style={{ width: '95%' }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '48px'
          }}
        >
          <Button
            onClick={createNote}
            disabled={subscriptionId == null || subscriptionId == ''}
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Index
