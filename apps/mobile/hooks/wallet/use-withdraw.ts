import { useCallback, useState } from "react";
import { Alert } from "react-native";

import {
  validateAccountNumber,
  validateAccountOwner,
  validateBankName,
  validateNote,
  validateWithdrawalAmount,
} from "../../utils/wallet/validators";
import { useWithdrawalAction } from "../use-withdrawal-action";

type WithdrawalFormData = {
  amount: string;
  bank: string;
  account: string;
  account_owner: string;
  note?: string;
};

export function useWithdraw() {
  const { createWithdrawal, isCreating } = useWithdrawalAction();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<WithdrawalFormData>({
    amount: "",
    bank: "",
    account: "",
    account_owner: "",
    note: "Rút tiền từ ví",
  });

  const resetForm = useCallback(() => {
    setCurrentStep(0);
    setFormData({
      amount: "",
      bank: "",
      account: "",
      account_owner: "",
      note: "Rút tiền từ ví",
    });
  }, []);

  const validateStep = useCallback((step: number, value: string): { isValid: boolean; message?: string } => {
    switch (step) {
      case 0:
        return validateWithdrawalAmount(value);
      case 1:
        return validateBankName(value);
      case 2:
        return validateAccountNumber(value);
      case 3:
        return validateAccountOwner(value);
      case 4:
        return validateNote(value || "");
      default:
        return { isValid: true };
    }
  }, []);

  const handleStepValueChange = useCallback((step: number, value: string) => {
    switch (step) {
      case 0:
        setFormData(prev => ({ ...prev, amount: value }));
        break;
      case 1:
        setFormData(prev => ({ ...prev, bank: value }));
        break;
      case 2:
        setFormData(prev => ({ ...prev, account: value }));
        break;
      case 3:
        setFormData(prev => ({ ...prev, account_owner: value }));
        break;
      case 4:
        setFormData(prev => ({ ...prev, note: value }));
        break;
    }
  }, []);

  const proceedToStep = useCallback((step: number) => {
    const prompts = [
      {
        title: "Thông tin ngân hàng",
        message: "Nhập tên ngân hàng",
        keyboardType: "default" as const,
      },
      {
        title: "Số tài khoản",
        message: "Nhập số tài khoản ngân hàng",
        keyboardType: "default" as const,
      },
      {
        title: "Chủ tài khoản",
        message: "Nhập tên chủ tài khoản",
        keyboardType: "default" as const,
      },
      {
        title: "Ghi chú",
        message: "Nhập ghi chú (tối thiểu 10 ký tự, tối đa 500 ký tự)",
        keyboardType: "default" as const,
      },
    ];

    const currentPrompt = prompts[step - 1];
    if (!currentPrompt) {
      return;
    }

    Alert.prompt(
      currentPrompt.title,
      currentPrompt.message,
      [
        { text: "Hủy", style: "cancel", onPress: resetForm },
        {
          text: step === 4 ? "Xác nhận" : "Tiếp tục",
          onPress: (value?: string) => {
            if (value !== undefined) {
              const validation = validateStep(step, value);
              if (!validation.isValid) {
                Alert.alert("Lỗi", validation.message);
                return;
              }

              handleStepValueChange(step, value);

              if (step === 4) {
                // Final step - submit
                createWithdrawal({
                  amount: Number(formData.amount),
                  bank: formData.bank,
                  account: formData.account,
                  account_owner: formData.account_owner,
                  note: value || "Rút tiền từ ví",
                });
                resetForm();
              }
              else {
                proceedToStep(step + 1);
              }
            }
          },
        },
      ],
      "plain-text",
      "",
      currentPrompt.keyboardType,
    );
  }, [validateStep, handleStepValueChange, createWithdrawal, formData, resetForm]);

  const handleWithdraw = useCallback(() => {
    Alert.prompt(
      "Rút tiền",
      "Nhập số tiền muốn rút (tối thiểu 10,000 VND)",
      [
        { text: "Hủy", style: "cancel", onPress: resetForm },
        {
          text: "Tiếp tục",
          onPress: (amount?: string) => {
            if (amount) {
              const validation = validateStep(0, amount);
              if (!validation.isValid) {
                Alert.alert("Lỗi", validation.message);
                return;
              }
              handleStepValueChange(0, amount);
              proceedToStep(1);
            }
          },
        },
      ],
      "plain-text",
      "",
      "numeric",
    );
  }, [validateStep, handleStepValueChange, resetForm, proceedToStep]);

  return {
    handleWithdraw,
    isCreatingWithdrawal: isCreating,
    currentStep,
    formData,
  };
}
