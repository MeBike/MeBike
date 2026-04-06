import { useFocusEffect } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StatusBar, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, XStack, YStack } from "tamagui";

import type { WalletTransactionDetail } from "@services/wallets/wallet.service";

import { IconSymbol } from "@components/IconSymbol";
import { iconSizes, spaceScale } from "@theme/metrics";
import { AppButton } from "@ui/primitives/app-button";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import { Screen } from "@ui/primitives/screen";

import { WalletHeroCard } from "./components/wallet-hero-card";
import { WalletTopUpCta } from "./components/wallet-top-up-cta";
import { WalletTransactionRow } from "./components/wallet-transaction-row";
import { useMyWalletScreen } from "./hooks/use-my-wallet-screen";
import { QRModal } from "./modals/qr-modal";
import { TransactionDetailModal } from "./modals/transaction-detail-modal";

const walletRefreshButtonSize = spaceScale[7];

function MyWalletScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [showQR, setShowQR] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showTransactionDetail, setShowTransactionDetail] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<WalletTransactionDetail | null>(null);

  const wallet = useMyWalletScreen();
  const { getMyTransaction, getMyWallet } = wallet;

  const refreshWalletData = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["my-wallet"] }),
      queryClient.invalidateQueries({ queryKey: ["myTransactions"] }),
    ]);

    await Promise.all([
      getMyWallet(),
      getMyTransaction(),
    ]);
  }, [getMyTransaction, getMyWallet, queryClient]);

  useFocusEffect(
    useCallback(() => {
      void refreshWalletData();
    }, [refreshWalletData]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshWalletData();
    setRefreshing(false);
  };

  const handleTopUp = () => {
    setShowQR(true);
  };

  const handleTransactionPress = (transaction: WalletTransactionDetail) => {
    setSelectedTransaction(transaction);
    setShowTransactionDetail(true);
  };

  if (wallet.isLoadingWallet || wallet.isLoadingTransactions) {
    return (
      <Screen alignItems="center" inset="wide" justifyContent="center">
        <StatusBar backgroundColor={theme.actionPrimary.val} barStyle="light-content" />
        <ActivityIndicator color={theme.actionPrimary.val} size="large" />
        <AppText align="center" marginTop="$4" tone="muted" variant="bodySmall">
          {wallet.isLoadingWallet ? "Đang tải ví của bạn..." : "Đang tải giao dịch gần đây..."}
        </AppText>
      </Screen>
    );
  }

  if (!wallet.myWallet) {
    return (
      <Screen alignItems="center" inset="wide" justifyContent="center">
        <StatusBar backgroundColor={theme.actionPrimary.val} barStyle="light-content" />
        <AppText align="center" variant="sectionTitle">
          Chưa có ví nào
        </AppText>
        <AppText align="center" marginTop="$2" tone="muted" variant="bodySmall">
          Hãy thử làm mới hoặc đăng nhập lại để tải thông tin ví.
        </AppText>
      </Screen>
    );
  }

  const transactions = wallet.transactions ?? [];

  return (
    <Screen>
      <StatusBar backgroundColor={theme.actionPrimary.val} barStyle="light-content" />

      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + spaceScale[7],
        }}
        refreshControl={<RefreshControl colors={[theme.actionPrimary.val]} onRefresh={onRefresh} refreshing={refreshing} tintColor={theme.actionPrimary.val} />}
        showsVerticalScrollIndicator={false}
      >
        <WalletHeroCard topInset={insets.top} wallet={wallet.myWallet} />

        <View style={{ marginTop: -spaceScale[6], paddingHorizontal: spaceScale[5] }}>
          <WalletTopUpCta onPress={handleTopUp} />
        </View>

        <YStack gap="$3" paddingHorizontal="$5" paddingTop="$5">
          <XStack alignItems="center" justifyContent="space-between">
            <AppText variant="xlTitle">
              Giao dịch gần đây
            </AppText>

            <Pressable onPress={() => void onRefresh()} style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}>
              <XStack
                alignItems="center"
                backgroundColor="$surfaceDefault"
                borderColor="$borderSubtle"
                borderRadius="$round"
                borderWidth={1}
                height={walletRefreshButtonSize}
                justifyContent="center"
                width={walletRefreshButtonSize}
              >
                <IconSymbol color={theme.textSecondary.val} name="arrow.clockwise" size={iconSizes.md} />
              </XStack>
            </Pressable>
          </XStack>

          {transactions.length > 0
            ? (
                <YStack gap="$2">
                  {transactions.map(transaction => (
                    <WalletTransactionRow
                      key={transaction.id}
                      item={transaction}
                      onPress={() => handleTransactionPress(transaction)}
                    />
                  ))}
                </YStack>
              )
            : (
                <AppCard borderRadius="$5" elevated={false} gap="$2" padding="$5">
                  <AppText variant="bodyStrong">Chưa có giao dịch nào</AppText>
                  <AppText tone="muted" variant="bodySmall">
                    Khi ví của bạn có phát sinh nạp tiền, thanh toán hoặc hoàn tiền, danh sách sẽ hiển thị tại đây.
                  </AppText>
                </AppCard>
              )}

          {wallet.hasNextPageTransactions
            ? (
                <AppButton
                  alignSelf="center"
                  borderRadius="$round"
                  loading={wallet.isFetchingNextPageTransactions}
                  onPress={wallet.loadMoreTransactions}
                  tone="ghost"
                >
                  {wallet.isFetchingNextPageTransactions ? "Đang tải thêm giao dịch" : "Tải thêm giao dịch"}
                </AppButton>
              )
            : null}
        </YStack>
      </ScrollView>

      <QRModal
        onClose={() => setShowQR(false)}
        onSuccess={onRefresh}
        visible={showQR}
      />

      <TransactionDetailModal
        onClose={() => setShowTransactionDetail(false)}
        transaction={selectedTransaction}
        visible={showTransactionDetail}
      />
    </Screen>
  );
}

export default MyWalletScreen;
