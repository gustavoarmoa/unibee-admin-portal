import { EditOutlined, LoadingOutlined } from '@ant-design/icons'
import { Button, Space, Spin, Tabs, message } from 'antd'
// import currency from 'currency.js'
import Dinero, { Currency } from 'dinero.js'
import update from 'immutability-helper'
import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getProductDetailReq, getProductListReq } from '../../requests'
import '../../shared.css'
import { IProduct } from '../../shared.types'
import OneTimeHistory from './oneTimePurchaseHistory'
import SubHistory from './subHistory'
import Subscription from './subscriptionTab'

const APP_PATH = import.meta.env.BASE_URL
type TargetKey = React.MouseEvent | React.KeyboardEvent | string

const Index = ({ userId }: { userId: number }) => {
  //const [searchParams, setSearchParams] = useSearchParams()
  // const productId = useRef(parseInt(searchParams.get('productId') ?? '0'))
  // const [productId, setProductId] = useState(searchParams.get('product') ?? '0') // set default tab
  const [productId, setProductId] = useState('0') // set default tab
  const [loading, setLoading] = useState(false)
  const [productList, setProductList] = useState<IProduct[]>([])
  const onTabChange = (newActiveKey: string) => {
    setProductId(newActiveKey)
    // setSearchParams({ product: newActiveKey })
  }

  const getProductList = async () => {
    setLoading(true)
    const [res, err] = await getProductListReq()
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }

    const productList = res.products ?? []
    setProductList(productList)
  }

  useEffect(() => {
    getProductList()
  }, [])

  return (
    <>
      <Spin
        spinning={loading}
        indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />}
      >
        <Tabs
          onChange={onTabChange}
          activeKey={productId}
          items={productList.map((p) => ({
            label: p.productName,
            key: p.id.toString(),
            children: <Subscription userId={userId} productId={p.id} />
          }))}
        />
        <SubHistory userId={userId} />
        <OneTimeHistory userId={userId} />
      </Spin>
    </>
  )
}

export default Index
