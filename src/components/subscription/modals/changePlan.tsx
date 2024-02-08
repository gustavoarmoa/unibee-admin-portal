import { Divider, Modal, Select } from 'antd';
import { IPlan, ISubscriptionType } from '../../../shared.types';
import Plan from '../plan';

interface Props {
  isOpen: boolean;
  // loading: boolean;
  subInfo: ISubscriptionType | null;
  selectedPlanId: number | null;
  plans: IPlan[];
  // onSelectPlanChange: (planId: number) => void;
  setSelectedPlan: (planId: number) => void;
  onAddonChange: (
    addonId: number,
    quantity: number | null,
    checked: boolean | null,
  ) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

const ChangePlan = ({
  isOpen,
  subInfo,
  selectedPlanId,
  plans,
  // onSelectPlanChange,
  setSelectedPlan,
  onAddonChange,
  onCancel,
  onConfirm,
}: Props) => {
  if (selectedPlanId == null) {
    return null;
  }
  const selectedPlan = plans.find((p) => p.id == selectedPlanId);
  if (selectedPlan == null) {
    return null;
  }
  return (
    <Modal
      title="Change plan"
      open={isOpen}
      width={'480px'}
      onOk={onConfirm}
      onCancel={onCancel}
      closeIcon={null}
    >
      <Divider>Choose a new subscription plan</Divider>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          margin: '12px',
        }}
      >
        <Select
          style={{ width: 240 }}
          value={selectedPlanId}
          onChange={setSelectedPlan}
          options={plans.map((p) => ({
            label: p.planName,
            value: p.id,
          }))}
        />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '48px',
        }}
      >
        <Plan
          plan={selectedPlan}
          selectedPlan={selectedPlanId}
          setSelectedPlan={setSelectedPlan}
          onAddonChange={onAddonChange}
          isActive={selectedPlan.id == subInfo?.planId}
        />
      </div>
    </Modal>
  );
};

export default ChangePlan;

{
  /*
        <Modal
          title="Change plan"
          open={changePlanModal}
          width={"480px"}
          onOk={() => {
            // setChangePlanModal(false);
            openPreviewModal();
          }}
          onCancel={() => setChangePlanModal(false)}
        >
          <Divider>Choose a new subscription plan</Divider>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              margin: "12px",
            }}
          >
            <Select
              style={{ width: 120 }}
              value={selectedPlan}
              onChange={onSelectPlanChange}
              options={plans.map((p) => ({
                label: p.planName,
                value: p.id,
              }))}
            />
          </div>

          {p != undefined && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: "48px",
              }}
            >
              <Plan
                plan={p}
                selectedPlan={selectedPlan}
                setSelectedPlan={setSelectedPlan}
                onAddonChange={onAddonChange}
                isActive={p.id == activeSub?.planId}
              />
            </div>
          )}
        </Modal>
            */
}
