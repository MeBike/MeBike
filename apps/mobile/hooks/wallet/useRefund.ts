import { useCallback } from "react";
import { Alert } from "react-native";

import {
  validateRefundAmount,
  validateTransactionId,
} from "../../utils/wallet/validators";
import { useRefundAction } from "../useRefundAction";

export function useRefund() {
  const { createRefund, isCreating } = useRefundAction();

  const handleRefund = useCallback(() => {
    Alert.prompt(
      "Hoàn tiền",
      "Nhập ID giao dịch cần hoàn tiền",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Tiếp tục",
          onPress: (transaction_id?: string) => {
            if (transaction_id) {
              const validation = validateTransactionId(transaction_id);
              if (!validation.isValid) {
                Alert.alert("Lỗi", validation.message);
                return;
              }

              Alert.prompt(
                "Số tiền hoàn",
                "Nhập số tiền cần hoàn (phải lớn hơn 0)",
                [
                  { text: "Hủy", style: "cancel" },
                  {
                    text: "Xác nhận",
                    onPress: (amount?: string) => {
                      if (amount) {
                        const amountValidation = validateRefundAmount(amount);
                        if (!amountValidation.isValid) {
                          Alert.alert("Lỗi", amountValidation.message);
                          return;
                        }

                        createRefund({
                          transaction_id,
                          amount: Number(amount),
                        });
                      }
                    },
                  },
                ],
                "plain-text",
                "",
                "numeric",
              );
            }
          },
        },
      ],
      "plain-text",
      "",
      "default",
    );
  }, [createRefund]);

  const handleRefundFromTransaction = useCallback((transactionId: string, defaultAmount: number) => {
    Alert.prompt(
      "Số tiền hoàn",
      "Nhập số tiền cần hoàn",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xác nhận",
          onPress: (amount?: string) => {
            if (amount) {
              const amountValidation = validateRefundAmount(amount);
              if (!amountValidation.isValid) {
                Alert.alert("Lỗi", amountValidation.message);
                return;
              }

              createRefund({
                transaction_id: transactionId,
                amount: Number(amount),
              });
            }
          },
        },
      ],
      "plain-text",
      defaultAmount.toString(),
      "numeric",
    );
  }, [createRefund]);

  return {
    handleRefund,
    handleRefundFromTransaction,
    isCreatingRefund: isCreating,
  };
}
