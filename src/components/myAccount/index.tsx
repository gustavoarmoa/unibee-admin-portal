import { Divider } from 'antd'
import MerchantInfo from './merchantInfo'
import MyProfile from './profile'

const Index = () => {
  return (
    <>
      <Divider
        orientation="left"
        style={{ color: '#757575', fontSize: '14px' }}
      >
        Company profile
      </Divider>
      <MerchantInfo />
      <Divider
        orientation="left"
        style={{ color: '#757575', fontSize: '14px' }}
      >
        My profile
      </Divider>
      <MyProfile />
    </>
  )
}

export default Index
