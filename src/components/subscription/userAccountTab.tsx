import {
  Button,
  Col,
  Divider,
  Form,
  Input,
  Radio,
  Row,
  Select,
  message
} from 'antd'
import { ReactElement, useEffect, useState } from 'react'
import { getCountryListReq, saveUserProfileReq } from '../../requests'
import { Country, IProfile } from '../../shared.types.d'

const UserAccountTab = ({
  user,
  setUserProfile,
  extraButton
}: {
  user: IProfile | null
  setUserProfile: (u: IProfile) => void
  extraButton?: ReactElement
}) => {
  const [form] = Form.useForm()
  const [countryList, setCountryList] = useState<Country[]>([])
  const [loading, setLoading] = useState(false)

  const filterOption = (
    input: string,
    option?: { label: string; value: string }
  ) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())

  const onSave = async () => {
    const userProfile = form.getFieldsValue()
    setLoading(true)
    const [_, err] = await saveUserProfileReq(userProfile)
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    message.success('User Info Saved')
    setUserProfile(userProfile)
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const [list, err] = await getCountryListReq()
      setLoading(false)
      if (err != null) {
        message.error(err.message)
        return
      }
      setCountryList(
        list.map((c: any) => ({
          code: c.countryCode,
          name: c.countryName
        }))
      )
    }

    fetchData()
  }, [])

  const countryCode = Form.useWatch('countryCode', form)
  useEffect(() => {
    countryCode &&
      countryList.length > 0 &&
      form.setFieldValue(
        'countryName',
        countryList.find((c) => c.code == countryCode)!.name
      )
  }, [countryCode])

  return (
    user != null && (
      <Form
        form={form}
        labelCol={{ span: 7 }}
        onFinish={onSave}
        initialValues={user}
      >
        <Form.Item label="id" name="id" hidden>
          <Input disabled />
        </Form.Item>
        <Form.Item label="countryName" name="countryName" hidden>
          <Input disabled />
        </Form.Item>
        <Form.Item label="Country Name" name="countryName" hidden>
          <Input />
        </Form.Item>

        <Divider orientation="left" style={{ margin: '16px 0' }}>
          General
        </Divider>
        <Row>
          <Col span={12}>
            <Form.Item
              label="First name"
              name="firstName"
              rules={[
                {
                  required: true,
                  message: 'Please input your first name!'
                }
              ]}
            >
              <Input style={{ width: '240px' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Last name"
              name="lastName"
              rules={[
                {
                  required: true,
                  message: 'Please input your last name!'
                }
              ]}
            >
              <Input style={{ width: '240px' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row>
          <Col span={12}>
            <Form.Item label="Email" name="email">
              <Input disabled style={{ width: '240px' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Company name" name="companyName">
              <Input style={{ width: '240px' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row>
          <Col span={12}>
            <Form.Item label="VAT number" name="vATNumber">
              <Input style={{ width: '240px' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Payment" name="paymentMethod">
              <Radio.Group>
                <Radio value="CreditCard">Credit Card</Radio>
                <Radio value="Crypto">Crypto</Radio>
                <Radio value="PayPal">PayPal</Radio>
                <Radio value="WireTransfer">Wire Transfer</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left" style={{ margin: '16px 0' }}>
          Contact Info
        </Divider>

        <Row>
          <Col span={12}>
            <Form.Item
              label="Country"
              name="countryCode"
              rules={[
                {
                  required: true,
                  message: 'Please select your first country!'
                }
              ]}
            >
              <Select
                showSearch
                placeholder="Type to search"
                optionFilterProp="children"
                // value={country}
                // onChange={onCountryChange}
                // onSearch={onSearch}
                filterOption={filterOption}
                options={countryList.map((c) => ({
                  label: c.name,
                  value: c.code
                }))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Billing address"
              name="address"
              rules={[
                {
                  required: true,
                  message: 'Please input your billing address!'
                }
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Row>
          <Col span={12}>
            <Form.Item label="Phone number" name="mobile">
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left" style={{ margin: '16px 0' }}>
          Social Info
        </Divider>

        <Row>
          <Col span={12}>
            <Form.Item label="Telegram" name="telegram">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="WhatsApp" name="whatsAPP">
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Row>
          <Col span={12}>
            <Form.Item label="WeChat" name="weChat">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="LinkedIn" name="linkedIn">
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Row>
          <Col span={12}>
            <Form.Item label="Facebook" name="facebook">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="TikTok" name="tikTok">
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Row>
          <Col span={12}>
            <Form.Item label="Other social info" name="otherSocialInfo">
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <div className="mx-9 my-9 flex justify-center gap-6">
          {extraButton}
          <Button danger>Suspend</Button>
          <Button type="primary" onClick={form.submit} disabled={loading}>
            Save
          </Button>
        </div>
      </Form>
    )
  )
}

export default UserAccountTab
