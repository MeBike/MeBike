import { SubscriptionPackage } from "~/constants/enums"

export type CreateSubscriptionReqBody = {
    package_name: SubscriptionPackage
}

export type SubscriptionParam = {
    id: string
}