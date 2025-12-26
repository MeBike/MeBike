export { uniqueTargets } from "@/infrastructure/prisma-unique-violation";

export function isEmailTarget(target: string): boolean {
  return target.includes("email");
}

export function isPhoneTarget(target: string): boolean {
  return (
    target.includes("phone_number")
    || target.includes("phoneNumber")
    || target.includes("phone_number_key")
  );
}
