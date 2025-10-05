import { ObjectId } from "mongodb";

export function toObjectId(id: string | ObjectId) {
  return typeof id === "string" ? new ObjectId(id) : id;
}
