import {
  DesktopOutlined,
  LogoutOutlined,
  // FileOutlined,
  PieChartOutlined
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { Layout, Menu, Modal, message, theme } from 'antd'
import React, { useEffect, useState } from 'react'
import {
  Navigate,
  Route,
  // BrowserRouter as Router,
  Routes,
  useLocation,
  // Outlet,
  // Link,
  useNavigate
} from 'react-router-dom'
import {
  useAppConfigStore,
  useMerchantInfoStore,
  usePermissionStore,
  useProfileStore,
  useSessionStore
} from './stores'

import Dashboard from './components/dashboard'
import InvoiceDetail from './components/invoice/detail'
import InvoiceList from './components/invoice/list'
import OutletPage from './components/outletPage'
import PaymentList from './components/payment/list'
import PlanDetail from './components/plan/detail'
// import PricePlans from './components/pricePlans';
import BillableMetricsDetail from './components/billableMetrics/detail'
import BillableMetricsList from './components/billableMetrics/list'
import DiscountCodeDetail from './components/discountCode/detail'
import DiscountCodeList from './components/discountCode/list'
import PricePlanList from './components/plan/list'
import Settings from './components/settings'
import SubscriptionDetail from './components/subscription/detail'
import SubscriptionList from './components/subscription/list'
import CustomerDetail from './components/user/userDetail'
import CustomerList from './components/user/userList'
// import Users from "./components/userList";
import MerchantUserDetail from './components/merchantUser/userDetail'
import MerchantUsserList from './components/merchantUser/userList'

import AppSearch from './components/appSearch'
import Login from './components/login'
import LoginModal from './components/login/LoginModal'
import NotFound from './components/notFound'
import Profile from './components/profile'
import Signup from './components/signup'
import { getUserProfile, logoutReq } from './requests'

const { Header, Content, Footer, Sider } = Layout

type MenuItem = Required<MenuProps>['items'][number]

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[]
): MenuItem {
  return {
    key,
    icon,
    children,
    label
  } as MenuItem
}

const APP_PATH = import.meta.env.BASE_URL // import.meta.env.VITE_APP_PATH;
const noSiderRoutes = [`${APP_PATH}login`, `${APP_PATH}signup`]

const App: React.FC = () => {
  const merchantInfoStore = useMerchantInfoStore()
  const permStore = usePermissionStore()
  const profileStore = useProfileStore()
  const sessionStore = useSessionStore()
  const appConfig = useAppConfigStore()
  const [openLoginModal, setOpenLoginModal] = useState(false)
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [activeMenuItem, setActiveMenuItem] = useState<string[]>([
    window.location.pathname
  ])
  // const [openKeys, setOpenKeys] = useState<string[]>(["/subscription/list"]);
  // this is the default open keys after successful login.
  // const [openKeys, setOpenKeys] = useState<string[]>(["/subscription"]);
  const {
    token: { colorBgContainer, borderRadiusLG }
  } = theme.useToken()

  let items: MenuItem[] = [
    getItem('Plan', '/plan/list', <DesktopOutlined />),
    getItem('Billable Metrics', '/billable-metrics/list', <DesktopOutlined />),
    getItem('Discount Code', '/discount-code/list', <DesktopOutlined />),
    getItem('Subscription', '/subscription/list', <PieChartOutlined />),
    getItem('Invoice', '/invoice/list', <PieChartOutlined />),
    getItem('Payment', '/payment/list', <PieChartOutlined />),
    getItem('User List', '/user/list', <PieChartOutlined />),
    getItem('Admin List', '/admin/list', <PieChartOutlined />),
    getItem('Analytics', '/analytics', <PieChartOutlined />),
    getItem('My Account', '/my-account', <PieChartOutlined />), // /profile
    getItem('Configuration', '/configuration', <PieChartOutlined />)
  ]

  if (permStore.role == 'Customer Support') {
    items = items.filter(
      (i) =>
        i?.key != '/plan/list' &&
        i?.key != '/discount-code/list' &&
        i?.key != '/billable-metrics/list' &&
        i?.key != '/discount-code/list' &&
        i?.key != '/admin/list' &&
        i?.key != '/analytics' &&
        i?.key != '/settings' &&
        i?.key != '/profile'
    )
  }

  const navigate = useNavigate()

  const onItemClick = ({ key }: { key: string; needNavigate?: boolean }) => {
    navigate(`${APP_PATH}${key.substring(1)}`) // remove the leading '/' character, coz APP_PATH already has it
    setActiveMenuItem([key])
  }

  const logout = async () => {
    const [_, err] = await logoutReq()
    if (null != err) {
      message.error(err.message)
      return
    }
    sessionStore.reset()
    profileStore.reset()
    merchantInfoStore.reset()
    appConfig.reset()
    permStore.reset()
    localStorage.removeItem('merchantToken')
    localStorage.removeItem('appConfig')
    localStorage.removeItem('merchantInfo')
    localStorage.removeItem('session')
    localStorage.removeItem('profile')
    localStorage.removeItem('permissions')
    navigate(`${APP_PATH}login`)
  }

  useEffect(() => {
    const pathItems = location.pathname.split('/').filter((p) => p != '')
    if (pathItems[0] == 'subscription') {
      setActiveMenuItem(['/subscription/list'])
    } else if (pathItems[0] == 'plan') {
      setActiveMenuItem(['/plan/list'])
    } else if (pathItems[0] == 'user') {
      setActiveMenuItem(['/user/list'])
    } else if (pathItems[0] == 'admin') {
      setActiveMenuItem(['/admin/list'])
    } else if (pathItems[0] == 'invoice') {
      setActiveMenuItem(['/invoice/list'])
    } else if (pathItems[0] == 'payment') {
      setActiveMenuItem(['/payment/list'])
    } else if (pathItems[0] == 'discount-code') {
      setActiveMenuItem(['/discount-code/list'])
    } else if (pathItems[0] == 'billable-metrics') {
      setActiveMenuItem(['/billable-metrics/list'])
    } else {
      setActiveMenuItem(['/' + pathItems[0]])
    }
  }, [location, location.pathname])

  useEffect(() => {
    if (sessionStore.expired) {
      if (null == profileStore.id) {
        // is it better to use email?
        navigate(`${APP_PATH}login`)
      } else {
        setOpenLoginModal(true)
      }
    } else {
      setOpenLoginModal(false)
    }
  }, [sessionStore.expired])

  return (
    <>
      {noSiderRoutes.findIndex((r) => r == location.pathname) != -1 ? (
        <Layout style={{ minHeight: '100vh' }}>
          <Routes>
            <Route path={`${APP_PATH}login`} Component={Login} />
            <Route path={`${APP_PATH}signup`} Component={Signup} />
          </Routes>
        </Layout>
      ) : (
        <Layout style={{ minHeight: '100vh' }}>
          {openLoginModal && <LoginModal email={profileStore.email} />}
          <Sider
            // theme="light"
            collapsible
            collapsed={collapsed}
            onCollapse={(value) => setCollapsed(value)}
          >
            <div className="demo-logo-vertical" />
            <div
              style={{
                color: '#FFF',
                display: 'flex',
                justifyContent: 'center',
                margin: '16px 0'
              }}
            >
              <img
                src={
                  merchantInfoStore.companyLogo ||
                  APP_PATH + 'logoPlaceholder.png'
                }
                height={'80px'}
              />
            </div>
            <Menu
              theme="dark"
              selectedKeys={activeMenuItem}
              mode="inline"
              items={items}
              onClick={onItemClick}
            />
            <div className="absolute bottom-20 flex w-full flex-col items-center justify-center text-gray-50">
              <div className="flex flex-col items-center">
                <div className="text-xs">{profileStore.email}</div>
                <div>{`${profileStore.firstName} ${profileStore.lastName}`}</div>
              </div>
              <div onClick={logout} className=" my-4 cursor-pointer">
                <LogoutOutlined />
                &nbsp;&nbsp;Logout
              </div>
            </div>
          </Sider>
          <Layout>
            <Header style={{ background: colorBgContainer }}>
              <AppSearch />
            </Header>
            <Content
              style={{
                padding: '16px',
                height: 'calc(100vh - 180px)',
                overflowY: 'auto'
              }}
            >
              <div
                style={{
                  padding: 24,
                  minHeight: 360,
                  background: colorBgContainer,
                  borderRadius: borderRadiusLG
                  // height: "100%",
                }}
              >
                <Routes>
                  <Route path="*" Component={NotFound} />
                  <Route
                    path={APP_PATH}
                    element={<Navigate to={`${APP_PATH}subscription/list`} />} // default page after login
                  />
                  {permStore.role == 'Owner' && (
                    <Route path={`${APP_PATH}my-account`} Component={Profile} />
                  )}
                  {permStore.role == 'Owner' && (
                    <Route
                      path={`${APP_PATH}analytics`}
                      Component={Dashboard}
                    />
                  )}
                  {/* <Route path={`${APP_PATH}invoice`} Component={Invoices} /> */}
                  {permStore.role == 'Owner' && (
                    <Route
                      path={`${APP_PATH}configuration`}
                      Component={Settings}
                    />
                  )}
                  {/* <Route path={`${APP_PATH}users`} Component={Users} /> */}
                  <Route
                    path={`${APP_PATH}subscription`}
                    Component={OutletPage}
                  >
                    <Route path="list" element={<SubscriptionList />} />
                    <Route
                      path=":subscriptionId"
                      element={<SubscriptionDetail />}
                    />
                  </Route>

                  {permStore.role == 'Owner' && (
                    <Route path={`${APP_PATH}plan`} Component={OutletPage}>
                      <Route path="list" element={<PricePlanList />} />
                      <Route path="new" element={<PlanDetail />} />
                      {/* <Route path="new" element={<PlanNew />} /> */}
                      <Route path=":planId" element={<PlanDetail />} />
                    </Route>
                  )}

                  {permStore.role == 'Owner' && (
                    <Route
                      path={`${APP_PATH}billable-metrics`}
                      Component={OutletPage}
                    >
                      <Route path="list" element={<BillableMetricsList />} />
                      <Route path="new" element={<BillableMetricsDetail />} />
                      <Route
                        path=":metricsId"
                        element={<BillableMetricsDetail />}
                      />
                    </Route>
                  )}

                  {permStore.role == 'Owner' && (
                    <Route
                      path={`${APP_PATH}discount-code`}
                      Component={OutletPage}
                    >
                      <Route path="list" element={<DiscountCodeList />} />
                      <Route path="new" element={<DiscountCodeDetail />} />
                      <Route
                        path=":discountCodeId"
                        element={<DiscountCodeDetail />}
                      />
                    </Route>
                  )}

                  <Route path={`${APP_PATH}user`} Component={OutletPage}>
                    <Route path="list" element={<CustomerList />} />
                    <Route path=":userId" element={<CustomerDetail />} />
                  </Route>
                  {permStore.role == 'Owner' && (
                    <Route path={`${APP_PATH}admin`} Component={OutletPage}>
                      <Route path="list" element={<MerchantUsserList />} />
                      <Route path=":adminId" element={<MerchantUserDetail />} />
                    </Route>
                  )}

                  <Route path={`${APP_PATH}invoice`} Component={OutletPage}>
                    <Route path="list" element={<InvoiceList />} />
                    <Route path=":invoiceId" element={<InvoiceDetail />} />
                  </Route>
                  <Route path={`${APP_PATH}payment`} Component={OutletPage}>
                    <Route path="list" element={<PaymentList />} />
                    {/* <Route path=":invoiceId" element={<InvoiceDetail />} /> */}
                  </Route>
                </Routes>
              </div>
            </Content>
            <Footer style={{ textAlign: 'center' }}>Copyright © 2024</Footer>
          </Layout>
        </Layout>
      )}
    </>
  )
}

export default App
