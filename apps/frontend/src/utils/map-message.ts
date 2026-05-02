
import { USERS_MESSAGES , AUTH_MESSAGE , STATIONS_MESSAGE , SUPPLIER_MESSAGE, BIKES_MESSAGES ,AGENCY_MESSAGES
  , DISTRIBUTION_REQUEST,ENVIRONMENT_POLICY_REQUEST,COUPON_REQUEST,TECHNICIAN_TEAM,PRICING_POLICY_REQUEST, NFC
} from "@/constants/messages";
const getErrorMessageUserFromCode = (code?: string) => {
  if (!code) return "Something went wrong";
  return USERS_MESSAGES[code as keyof typeof USERS_MESSAGES] 
    || "Something went wrong";
};
const getErrorMessageAuthFromCode = (code?: string) => {
  if (!code) return "Something went wrong";
  return AUTH_MESSAGE[code as keyof typeof AUTH_MESSAGE] 
    || "Something went wrong";
}
const getErrorMessageFromStationCode = (code?: string) => {
  if (!code) return "Something went wrong";
  return STATIONS_MESSAGE[code as keyof typeof STATIONS_MESSAGE] 
    || "Something went wrong";
}
const getErrorMessageFromSupplierCode = (code?:string) => {
  if(!code) return "Something went wrong";
  return SUPPLIER_MESSAGE[code as keyof typeof SUPPLIER_MESSAGE] || "Something went wrong";
}
const getErrorMessageFromCustomerCode = (code?: string) => {
  if (!code) return "Something went wrong";
  return USERS_MESSAGES[code as keyof typeof USERS_MESSAGES] 
    || "Something went wrong";
}
const getErrorMessageFromBikeCode = (code?: string) => {
  if (!code) return "Something went wrong";
  return BIKES_MESSAGES[code as keyof typeof BIKES_MESSAGES] 
    || "Something went wrong";
}
const getErrorMessageFromAgencyCode = (code?: string) => {
  if (!code) return "Something went wrong";
  return AGENCY_MESSAGES[code as keyof typeof AGENCY_MESSAGES] 
    || "Something went wrong";
}
const getErrorMessageFromDistributionRequestCode = (code?: string) => {
  if (!code) return "Something went wrong";
  return DISTRIBUTION_REQUEST[code as keyof typeof DISTRIBUTION_REQUEST] 
    || "Something went wrong";
}
const getErrorMessageFromEnvironmentCode = (code?: string) => {
  if (!code) return "Something went wrong";
  return ENVIRONMENT_POLICY_REQUEST[code as keyof typeof ENVIRONMENT_POLICY_REQUEST] 
    || "Something went wrong";
}
const getErrorMessageFromPricingCode = (code?: string) => {
  if (!code) return "Something went wrong";
  return PRICING_POLICY_REQUEST[code as keyof typeof PRICING_POLICY_REQUEST] 
    || "Something went wrong";
}
const getErrorMessageFromCouponCode = (code?: string) => {
  if (!code) return "Something went wrong";
  return COUPON_REQUEST[code as keyof typeof COUPON_REQUEST] 
    || "Something went wrong";
}
const getErrorMessageFromTechnicianTeamCode = (code?: string) => {
  if (!code) return "Something went wrong";
  return TECHNICIAN_TEAM[code as keyof typeof TECHNICIAN_TEAM] 
    || "Something went wrong";
};
const getErrorMessageFromNFCCode = (code?: string) => {
  if (!code) return "Something went wrong";
  return NFC[code as keyof typeof NFC] 
    || "Something went wrong";
};
export { getErrorMessageUserFromCode, getErrorMessageAuthFromCode, getErrorMessageFromStationCode , getErrorMessageFromSupplierCode, 
  getErrorMessageFromCustomerCode, getErrorMessageFromBikeCode,
  getErrorMessageFromAgencyCode,
  getErrorMessageFromDistributionRequestCode,
  getErrorMessageFromEnvironmentCode,
  getErrorMessageFromCouponCode,
  getErrorMessageFromTechnicianTeamCode,
  getErrorMessageFromPricingCode,
  getErrorMessageFromNFCCode
 };