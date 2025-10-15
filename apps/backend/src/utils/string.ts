import { ObjectId } from "mongodb";

export function toObjectId(id: string | ObjectId) {
  return typeof id === "string" ? new ObjectId(id) : id;
}

export function normalizeDecimal(obj: any) {
  if (!obj || typeof obj !== "object") return obj;

  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (value && value._bsontype === "Decimal128") {
      obj[key] = parseFloat(value.toString());
    } else if (typeof value === "object") {
      normalizeDecimal(value);
    }
  }
  return obj;
}

