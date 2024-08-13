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
import DeleteProductModal from './deleteProductModal'
import PlanList from './planList'
import ProductModal from './productModal'

const APP_PATH = import.meta.env.BASE_URL
type TargetKey = React.MouseEvent | React.KeyboardEvent | string

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  // const productId = useRef(parseInt(searchParams.get('productId') ?? '0'))
  const [isProductValid, setIsProductValid] = useState(true) // user might manually type the invalid productId in url
  const [productId, setProductId] = useState(searchParams.get('product') ?? '0') // set default tab
  const deleteProductId = useRef<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [productList, setProductList] = useState<IProduct[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [productModalOpen, setProductModalOpen] = useState(false)
  const toggleProductModal = () => setProductModalOpen(!productModalOpen)
  const [deleteProductModalOpen, setDeleteProductModalOpen] = useState(false)
  const toggleDeleteProductModal = () =>
    setDeleteProductModalOpen(!deleteProductModalOpen)

  const onTabChange = (newActiveKey: string) => {
    setProductId(newActiveKey)
    setSearchParams({ product: newActiveKey })
  }

  const onTabEdit = (
    targetKey: React.MouseEvent | React.KeyboardEvent | string,
    action: 'add' | 'remove'
  ) => {
    if (action === 'add') {
      setIsCreating(true)
      toggleProductModal()
    } else if (action == 'remove') {
      deleteProductId.current = targetKey as string
      deleteProduct(targetKey as string)
    } else {
      return
      // remove(targetKey)
    }
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
    if (productId == '0') {
      setProductList(productList)
      return
    }

    const [productRes, productErr] = await getProductDetailReq(
      Number(productId)
    )
    console.log('get product detail res: ', productRes, '//', productErr)
    if (null != productErr || productRes.product == null) {
      productList.push({
        id: productId,
        productName: productId,
        description: ''
      })
      setProductList(productList)
      setIsProductValid(false)
      return
    }

    setProductList(productList)
    setIsProductValid(true)
  }

  // no Modal popped up if deleting invalid product
  const deleteProduct = async (productId: string) => {
    // invalid product tab are created locally, just to show user "product not found", nothing you can do
    // to remove invalid product, no backend call is needed.
    if (!isProductValid) {
      // locally delete it
      refreshProductList()
      return
    }

    if (productId == '0') {
      message.info('Default product cannot be deleted')
      return
    }
    toggleDeleteProductModal()
  }

  // used after deleting a valid product
  const refreshProductList = () => {
    const idx = productList.findIndex(
      (p) => p.id.toString() == deleteProductId.current
    )
    if (idx != -1) {
      setProductList(update(productList, { $splice: [[idx, 1]] }))
      setIsProductValid(true)
      // I'm on productA, and try to delete productA
      if (deleteProductId.current == productId) {
        setProductId('0')
        setSearchParams({ product: '0' })
      }
      // I'm on productA, try to delete productB, then no need to set searchParams or default productId
    }
  }

  const onSaveProduct = (product: IProduct) => {
    const idx = productList.findIndex((p) => p.id == product.id)
    if (idx == -1) {
      // add new product
      setProductList(update(productList, { $push: [product] }))
      setProductId(product.id.toString())
      setSearchParams({ product: product.id.toString() })
    } else {
      // edit existing product
      setProductList(update(productList, { $splice: [[idx, 1, product]] }))
    }
  }

  useEffect(() => {
    if (!productModalOpen) {
      setIsCreating(false)
    }
  }, [productModalOpen])

  useEffect(() => {
    getProductList()
  }, [])

  return (
    <>
      {deleteProductModalOpen && (
        <DeleteProductModal
          product={productList.find(
            (p) => p.id == Number(deleteProductId.current)
          )}
          closeModal={toggleDeleteProductModal}
          refresh={refreshProductList}
        />
      )}
      {productModalOpen && (
        <ProductModal
          isNew={isCreating}
          closeModal={toggleProductModal}
          detail={productList.find((p) => p.id.toString() == productId)}
          refresh={onSaveProduct}
        />
      )}
      <Spin
        spinning={loading}
        indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />}
      >
        <Tabs
          type="editable-card"
          tabBarExtraContent={{
            left: (
              <Button
                style={{ border: 'unset' }}
                onClick={toggleProductModal}
                icon={<EditOutlined />}
              />
            )
          }}
          onChange={onTabChange}
          activeKey={productId}
          onEdit={onTabEdit}
          items={productList.map((p) => ({
            label: p.productName,
            key: p.id.toString(),
            children: (
              <PlanList productId={p.id} isProductValid={isProductValid} />
            )
          }))}
        />
      </Spin>
    </>
  )
}

export default Index