import { SubscriptionPackage } from './enums'

export const PACKAGE_CONFIG: Record<SubscriptionPackage, { price: string; max_reservations_per_month: number | null }> =
  {
    [SubscriptionPackage.BASIC]: {
      price: '99000',
      max_reservations_per_month: 30
    },
    [SubscriptionPackage.PREMIUM]: {
      price: '199000',
      max_reservations_per_month: 60
    },
    [SubscriptionPackage.UNLIMITED]: {
      price: '299000',
      max_reservations_per_month: null
    }
  }
