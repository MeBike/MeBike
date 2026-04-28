import { formatAbsoluteCurrency, formatDate, formatTransactionTitle } from "@utils/wallet/formatters";

import type { Transaction } from "./types";

export function toShortReference(transaction: Transaction, expanded = false) {
  const reference = transaction.id || transaction.hash;
  if (!reference) {
    return "--";
  }

  if (expanded || reference.length <= 24) {
    return reference;
  }

  return `${reference.slice(0, 14)}...${reference.slice(-6)}`;
}

export function formatDetailDate(dateString: string): string {
  const formatted = formatDate(dateString);
  const [date, time] = formatted.split(" ");

  if (!date || !time) {
    return formatted;
  }

  return `${time} - ${date}`;
}

function getReferenceSuffix(transaction: Transaction): string | null {
  const source = `${transaction.description ?? ""} ${transaction.hash ?? ""} ${transaction.id}`;
  const uuid = source.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0];
  const reference = uuid ?? transaction.id;

  if (!reference) {
    return null;
  }

  return reference.slice(-6).toUpperCase();
}

export function humanizeTransactionTitle(transaction: Transaction): string {
  const title = formatTransactionTitle(transaction.type, transaction.description);
  const normalizedSource = `${transaction.description ?? ""} ${transaction.hash ?? ""}`.toLowerCase();
  const suffix = getReferenceSuffix(transaction);

  if (!suffix) {
    return title;
  }

  if (normalizedSource.includes("return-slot") || normalizedSource.includes("return slot")) {
    return `Phí đặt điểm trả xe #${suffix}`;
  }

  if (title === "Thanh toán chuyến đi") {
    return `${title} #${suffix}`;
  }

  return title;
}

export function getStatusTone(status: string): "success" | "warning" | "danger" | "default" {
  switch (status.toUpperCase()) {
    case "SUCCESS":
      return "success";
    case "PENDING":
      return "warning";
    case "FAILED":
      return "danger";
    default:
      return "default";
  }
}

export function formatDisplayAmount(transaction: Transaction): string {
  const rawAmount = Number(transaction.amount);
  const isSignedNegative = rawAmount < 0;
  const isMoneyOut = transaction.type.toUpperCase() === "DEBIT";
  const sign = isSignedNegative || isMoneyOut ? "-" : "+";

  return `${sign}${formatAbsoluteCurrency(transaction.amount)}`;
}
