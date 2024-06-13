import { Col, Divider, Row } from 'antd'
import { CSSProperties } from 'react'
import { IProfile } from '../../shared.types.d'
import { useAppConfigStore } from '../../stores'

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  height: '24px',
  color: '#757575'
}
const Index = ({ user }: { user: IProfile | undefined }) => {
  const appConfig = useAppConfigStore()
  return (
    <div style={{ marginBottom: '24px' }}>
      {/* <Divider orientation="left" style={{ margin: '16px 0' }}>
        User Info
  </Divider> */}
      <Row style={rowStyle}>
        <Col span={4}>
          <span style={{ fontWeight: 'bold' }}>First Name</span>
        </Col>
        <Col span={6}>{user?.firstName}</Col>
        <Col span={4}>
          <span style={{ fontWeight: 'bold' }}>Last Name</span>
        </Col>
        <Col span={6}>{user?.lastName}</Col>
      </Row>
      <Row style={rowStyle}>
        <Col span={4}>
          <span style={{ fontWeight: 'bold' }}>Email</span>
        </Col>
        <Col span={6}>
          <a href={`mailto:${user?.email}`}>{user?.email} </a>
        </Col>
        <Col span={4}>
          <span style={{ fontWeight: 'bold' }}>Phone</span>
        </Col>
        <Col span={6}>{user?.mobile}</Col>
      </Row>
      <Row style={rowStyle}>
        <Col span={4}>
          <span style={{ fontWeight: 'bold' }}>Country</span>
        </Col>
        <Col span={6}>{user?.countryName}</Col>
        <Col span={4}>
          <span style={{ fontWeight: 'bold' }}>Billing Address</span>
        </Col>
        <Col span={6}>{user?.address}</Col>
      </Row>
      <Row style={rowStyle}>
        <Col span={4}>
          <span style={{ fontWeight: 'bold' }}>Payment Method</span>
        </Col>
        <Col span={6}>
          {
            appConfig.gateway.find((g) => g.gatewayId == user?.gatewayId)
              ?.displayName
          }
        </Col>
        <Col span={4}>
          <span style={{ fontWeight: 'bold' }}>VAT Number</span>
        </Col>
        <Col span={6}>{user?.vATNumber}</Col>
      </Row>
    </div>
  )
}

export default Index
