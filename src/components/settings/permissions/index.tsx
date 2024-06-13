import { Button, Checkbox, Col, Divider, Row } from 'antd'

type TPermission = {
  appConfig: { read: boolean; write: boolean }
  emailTemplate: { read: boolean; write: boolean }
  invoiceTemplate: { read: boolean; write: boolean }
  plan: { read: boolean; write: boolean }
  subscription: { read: boolean; write: boolean }
  invoice: { read: boolean; write: boolean; generate: boolean }
  accountData: {
    read: boolean
    write: boolean
    invite: boolean
    permissionSetting: boolean
  }
  customerData: { read: boolean; write: boolean }
  analytic: { read: boolean; export: boolean }
}

const roles = [
  'Owner',
  'Admin',
  'Power User',
  'Finance',
  'Customer Support'
] as const // to mark it readonly
type TRoles = (typeof roles)[number] // APP Owner | Admin | *** |

const role: Record<TRoles, TPermission> = {
  Owner: {
    appConfig: { read: true, write: true },
    emailTemplate: { read: true, write: true },
    invoiceTemplate: { read: true, write: true },
    plan: { read: true, write: true },
    subscription: { read: true, write: true },
    invoice: { read: true, write: true, generate: true },
    accountData: {
      read: true,
      write: true,
      invite: true,
      permissionSetting: true
    },
    customerData: { read: true, write: true },
    analytic: { read: true, export: true }
  },
  Admin: {
    appConfig: { read: true, write: true },
    emailTemplate: { read: true, write: true },
    invoiceTemplate: { read: true, write: true },
    plan: { read: true, write: true },
    subscription: { read: true, write: true },
    invoice: { read: true, write: true, generate: true },
    accountData: {
      read: true,
      write: true,
      invite: false,
      permissionSetting: true
    },
    customerData: { read: true, write: true },
    analytic: { read: true, export: true }
  },
  'Power User': {
    appConfig: { read: false, write: false },
    emailTemplate: { read: true, write: true },
    invoiceTemplate: { read: true, write: true },
    plan: { read: true, write: true },
    subscription: { read: true, write: true },
    invoice: { read: true, write: true, generate: true },
    accountData: {
      read: true,
      write: true,
      invite: true,
      permissionSetting: true
    },
    customerData: { read: true, write: true },
    analytic: { read: true, export: false }
  },
  Finance: {
    appConfig: { read: false, write: false },
    emailTemplate: { read: true, write: false },
    invoiceTemplate: { read: true, write: false },
    plan: { read: true, write: false },
    subscription: { read: true, write: false },
    invoice: { read: true, write: true, generate: true },
    accountData: {
      read: false,
      write: false,
      invite: false,
      permissionSetting: false
    },
    customerData: { read: true, write: false },
    analytic: { read: true, export: true }
  },
  'Customer Support': {
    appConfig: { read: false, write: false },
    emailTemplate: { read: true, write: false },
    invoiceTemplate: { read: true, write: false },
    plan: { read: true, write: false },
    subscription: { read: true, write: false },
    invoice: { read: true, write: false, generate: true },
    accountData: {
      read: false,
      write: false,
      invite: false,
      permissionSetting: false
    },
    customerData: { read: true, write: false },
    analytic: { read: false, export: false }
  }
}

const Index = () => (
  <div style={{ width: 'calc(100vw - 300px)', overflowX: 'auto' }}>
    <Row
      // gutter={[32, 32]}
      className="my-6 flex items-center justify-between text-center"
    >
      <Col span={2} style={{ fontWeight: 'bold' }}>
        Roles
      </Col>
      <Col span={2} style={{ fontWeight: 'bold' }}>
        App Config
      </Col>
      <Col span={2} style={{ fontWeight: 'bold' }}>
        Email template
      </Col>
      <Col span={2} style={{ fontWeight: 'bold' }}>
        Invoice Template
      </Col>
      <Col span={2} style={{ fontWeight: 'bold' }}>
        Plans
      </Col>
      <Col span={2} style={{ fontWeight: 'bold' }}>
        Subscription
      </Col>
      <Col span={2} style={{ fontWeight: 'bold' }}>
        Invoice
      </Col>
      <Col span={2} style={{ fontWeight: 'bold' }}>
        Account
      </Col>
      <Col span={2} style={{ fontWeight: 'bold' }}>
        Customer
      </Col>
      <Col span={2} style={{ fontWeight: 'bold' }}>
        Analytics
      </Col>
    </Row>
    <div
      style={{
        height: 'calc(100vh - 410px)',
        overflowY: 'auto',
        marginBottom: '16px'
      }}
    >
      {roles.map((r) => (
        <div key={r}>
          <Row
            className="flex content-center justify-between"
            // gutter={[32, 128]}
          >
            <Col span={2}>{r}</Col>
            <Col span={2}>
              <Checkbox
                disabled={r == 'Owner'}
                defaultChecked={role[r].appConfig.read}
              >
                Read
              </Checkbox>
              <Checkbox
                disabled={r == 'Owner'}
                defaultChecked={role[r].appConfig.write}
              >
                Write
              </Checkbox>
            </Col>
            <Col span={2}>
              <Checkbox
                disabled={r == 'Owner'}
                defaultChecked={role[r].emailTemplate.read}
              >
                Read
              </Checkbox>
              <Checkbox
                disabled={r == 'Owner'}
                defaultChecked={role[r].emailTemplate.write}
              >
                Write
              </Checkbox>
            </Col>
            <Col span={2}>
              <Checkbox
                disabled={r == 'Owner'}
                defaultChecked={role[r].invoiceTemplate.read}
              >
                Read
              </Checkbox>
              <Checkbox
                disabled={r == 'Owner'}
                defaultChecked={role[r].invoiceTemplate.write}
              >
                Write
              </Checkbox>
            </Col>
            <Col span={2}>
              <Checkbox
                disabled={r == 'Owner'}
                defaultChecked={role[r].plan.read}
              >
                Read
              </Checkbox>
              <Checkbox
                disabled={r == 'Owner'}
                defaultChecked={role[r].plan.write}
              >
                Write
              </Checkbox>
            </Col>
            <Col span={2}>
              <Checkbox
                disabled={r == 'Owner'}
                defaultChecked={role[r].subscription.read}
              >
                Read
              </Checkbox>
              <Checkbox
                disabled={r == 'Owner'}
                defaultChecked={role[r].subscription.write}
              >
                Write
              </Checkbox>
            </Col>
            <Col span={2}>
              <Checkbox
                disabled={r == 'Owner'}
                defaultChecked={role[r].invoice.read}
              >
                Read
              </Checkbox>
              <Checkbox
                disabled={r == 'Owner'}
                defaultChecked={role[r].invoice.write}
              >
                Write
              </Checkbox>
              <Checkbox
                disabled={r == 'Owner'}
                defaultChecked={role[r].invoice.generate}
              >
                Generate
              </Checkbox>
            </Col>
            <Col span={2}>
              <Checkbox
                disabled={r == 'Owner'}
                defaultChecked={role[r].accountData.write}
              >
                Read
              </Checkbox>
              <Checkbox
                disabled={r == 'Owner'}
                defaultChecked={role[r].accountData.read}
              >
                Write
              </Checkbox>
              <Checkbox
                disabled={r == 'Owner'}
                defaultChecked={role[r].accountData.invite}
              >
                Invite
              </Checkbox>
              <Checkbox
                disabled={r == 'Owner'}
                defaultChecked={role[r].accountData.permissionSetting}
              >
                set Permission
              </Checkbox>
            </Col>
            <Col span={2}>
              <Checkbox
                disabled={r == 'Owner'}
                defaultChecked={role[r].customerData.read}
              >
                Read
              </Checkbox>
              <Checkbox
                disabled={r == 'Owner'}
                defaultChecked={role[r].customerData.write}
              >
                Write
              </Checkbox>
            </Col>
            <Col span={2}>
              <Checkbox
                disabled={r == 'Owner'}
                defaultChecked={role[r].analytic.read}
              >
                Read
              </Checkbox>
              <Checkbox
                disabled={r == 'Owner'}
                defaultChecked={role[r].analytic.export}
              >
                Export
              </Checkbox>
            </Col>
          </Row>
          <Divider />
        </div>
      ))}
    </div>
    <div className="my-2 flex justify-end gap-4">
      <Button>Apply Change</Button>
      <Button>Add New Role</Button>
      <Button type="primary">Apply Change</Button>
    </div>
  </div>
)

export default Index
