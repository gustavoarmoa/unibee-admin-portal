import { Divider, Modal, Select } from 'antd';
import { IPlan, ISubscriptionType } from '../../../shared.types.d';
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
      <div className="mx-3 my-3 flex items-center justify-center">
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

      <div className="mb-12 flex items-center justify-center">
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
