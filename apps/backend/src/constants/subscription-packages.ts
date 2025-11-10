import { SubscriptionPackage } from './enums'

export const PACKAGE_CONFIG: Record<SubscriptionPackage, { price: string; max_usages: number | null }> =
  {
    [SubscriptionPackage.BASIC]: {
      price: '119000',
      max_usages: 30
    },
    [SubscriptionPackage.PREMIUM]: {
      price: '199000',
      max_usages: 60
    },
    [SubscriptionPackage.UNLIMITED]: {
      price: '299000',
      max_usages: null
    }
  }
