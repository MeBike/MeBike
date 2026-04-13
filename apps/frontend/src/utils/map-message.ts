import { USERS_MESSAGES , AUTH_MESSAGE , STATIONS_MESSAGE , SUPPLIER_MESSAGE, BIKES_MESSAGES ,AGENCY_MESSAGES} from "@/constants/messages";
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
export { getErrorMessageUserFromCode, getErrorMessageAuthFromCode, getErrorMessageFromStationCode , getErrorMessageFromSupplierCode, 
  getErrorMessageFromCustomerCode, getErrorMessageFromBikeCode,
  getErrorMessageFromAgencyCode
 };