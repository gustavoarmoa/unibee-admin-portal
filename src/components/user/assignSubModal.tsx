import {
  Button,
  Col,
  Divider,
  message,
  Modal,
  Row,
  Select,
  Switch,
  Tag
} from 'antd'
import update from 'immutability-helper'
import React, { useEffect, useState } from 'react'
import {
  createSubscriptionReq,
  getPlanList,
  TPlanListBody
} from '../../requests'
import { IPlan, IProfile, ISubscriptionType } from '../../shared.types.d'
import { useAppConfigStore } from '../../stores'
import Plan from '../subscription/plan'
import PaymentMethodSelector from '../ui/paymentSelector'

interface Props {
  user: IProfile
  refresh: () => void
  closeModal: () => void
}

const Index = ({ user, closeModal, refresh }: Props) => {
  const appConfig = useAppConfigStore()
  const [loading, setLoading] = useState(false)
  const [plans, setPlans] = useState<IPlan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null)
  const [requirePayment, setRequirePayment] = useState(false)
  const [includeUnpublished, setIncludeUnpublished] = useState(false)
  const onIncludeChange = (checked: boolean) => {
    if (!checked) {
      if (
        selectedPlan != null &&
        plans
          .filter((p) => p.publishStatus == 2)
          .findIndex((p) => p.id == selectedPlan) == -1
      ) {
        // if selected plan doesn't exist in published plans, reset it to null
        setSelectedPlan(null)
      }
    }
    setIncludeUnpublished(!includeUnpublished)
  }

  // set card payment as default gateway
  const [gatewayId, setGatewayId] = useState<undefined | number>(
    appConfig.gateway.find((g) => g.gatewayName == 'stripe')?.gatewayId
  )
  const onGatewayChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setGatewayId(Number(e.target.value))
  }

  const onAddonChange = (
    addonId: number,
    quantity: number | null, // null means: don't update this field, keep its original value. I don't want to define 2 fn to do similar jobs.
    checked: boolean | null // ditto
  ) => {
    const planIdx = plans.findIndex((p) => p.id == selectedPlan)
    if (planIdx == -1) {
      return
    }
    const addonIdx = plans[planIdx].addons!.findIndex((a) => a.id == addonId)
    if (addonIdx == -1) {
      return
    }

    let newPlans = plans
    if (quantity == null) {
      newPlans = update(plans, {
        [planIdx]: {
          addons: { [addonIdx]: { checked: { $set: checked as boolean } } }
        }
      })
    } else if (checked == null) {
      newPlans = update(plans, {
        [planIdx]: {
          addons: { [addonIdx]: { quantity: { $set: quantity as number } } }
        }
      })
    }
    setPlans(newPlans)
  }

  const onSubmit = async () => {
    if (selectedPlan == null) {
      message.error('Please choose a plan')
      return
    }
    if (gatewayId == undefined) {
      message.error('Please choose a payment method')
      return
    }
    console.log('submitting: ', selectedPlan, '//', gatewayId, '//', user)
    // return

    const body: any = {
      planId: selectedPlan as number,
      gatewayId: gatewayId as number,
      userId: user.id as number
      // trialEnd: sec
    }
    if (!requirePayment) {
      const fiveYearFromNow = new Date(
        new Date().setFullYear(new Date().getFullYear() + 5)
      )
      const sec = Math.round(fiveYearFromNow.getTime() / 1000)
      body.trialEnd = sec
    } else {
      body.startIncomplete = true
    }
    setLoading(true)
    const [res, err] = await createSubscriptionReq(body)
    setLoading(false)
    console.log('create submit res: ', res)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success('Subscription created')
    closeModal()
    refresh()
  }

  const fetchPlan = async () => {
    const body: TPlanListBody = {
      type: [1], // get main plan and addon
      status: [2], // active, inactive, expired, editing, all of them
      page: 0,
      count: 100
    }
    /*
    if (!includeUnpublished) {
      body.publishStatus = 2 // 1-UnPublished，2-Published
    }
    */
    setLoading(true)
    const [planList, err] = await getPlanList(body, fetchPlan)
    setLoading(false)

    if (err != null) {
      message.error(err.message)
      return
    }
    if (planList == null) {
      return
    }
    setPlans(
      planList.map((p: any) => ({
        ...p.plan,
        metricPlanLimits: p.metricPlanLimits
      }))
    )
  }

  useEffect(() => {
    fetchPlan()
  }, [])

  return (
    <Modal
      title="Assign subscription"
      open={true}
      width={'720px'}
      footer={null}
      closeIcon={null}
    >
      <Divider>Choose a subscription plan</Divider>
      <div className="flex justify-between">
        <div className="my-6 w-3/6">
          <Row gutter={[16, 48]}>
            <Col span={10} className=" font-bold text-gray-700">
              UserId
            </Col>
            <Col span={14}>{user.id}</Col>
          </Row>
          <Row gutter={[16, 48]}>
            <Col span={10} className=" font-bold text-gray-700">
              User name
            </Col>
            <Col span={14}>{`${user.firstName} ${user.lastName}`}</Col>
          </Row>
          <Row gutter={[16, 48]} className="mb-4">
            <Col span={10} className=" font-bold text-gray-700">
              Email
            </Col>
            <Col span={14}>{user.email}</Col>
          </Row>
          <PaymentMethodSelector
            selected={gatewayId}
            onSelect={onGatewayChange}
            cryptoDisabled={true}
          />
        </div>
        <div className="w-3/6">
          <div className="mx-3 my-6 flex items-center justify-center">
            <Select
              loading={loading}
              disabled={loading}
              style={{ width: 240 }}
              value={selectedPlan}
              onChange={setSelectedPlan}
              options={plans
                .filter((p) =>
                  includeUnpublished ? true : p.publishStatus == 2
                )
                .map((p) => ({ label: p.planName, value: p.id }))}
            />
          </div>

          <div className=" mb-12 flex flex-col items-center justify-center">
            {selectedPlan != null && (
              <Plan
                plan={plans.find((p) => p.id == selectedPlan)!}
                selectedPlan={selectedPlan}
                setSelectedPlan={setSelectedPlan}
                onAddonChange={onAddonChange}
                isActive={false}
              />
            )}
            <div className="my-3 flex items-center gap-3">
              <span>Require payment</span>
              <Switch checked={requirePayment} onChange={setRequirePayment} />
            </div>
            <div className=" flex items-center gap-3">
              <span>Include unpublished</span>
              <Switch checked={includeUnpublished} onChange={onIncludeChange} />
            </div>
          </div>
        </div>
      </div>

      <div
        className="flex items-center justify-end gap-4"
        style={{
          marginTop: '24px'
        }}
      >
        <Button onClick={closeModal}>Cancel</Button>
        <Button
          type="primary"
          onClick={onSubmit}
          loading={loading}
          disabled={loading}
        >
          OK
        </Button>
      </div>
    </Modal>
  )
}

export default Index
