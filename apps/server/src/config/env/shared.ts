import { z } from "zod";

export const CsvStringArraySchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value;
    }

    const items = value
      .split(",")
      .map(item => item.trim())
      .filter(Boolean);

    return items.length > 0 ? items : undefined;
  },
  z.array(z.string().min(1)).optional(),
);

export const BooleanStringSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value;
    }

    const normalized = value.trim().toLowerCase();

    if (normalized === "true") {
      return true;
    }

    if (normalized === "false") {
      return false;
    }

    return value;
  },
  z.boolean(),
);
