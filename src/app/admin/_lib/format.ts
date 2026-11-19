import type { Order, OrderStatus } from "@/lib/admin-types";

export const money = (value: number, currency = "AUD") =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency, maximumFractionDigits: value % 1 ? 2 : 0 }).format(value);

export const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
export const dateTime = (iso: string) => new Date(iso).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export const statusLabel: Record<OrderStatus, string> = {
  paid: "Paid", pending: "Needs review", refund_requested: "Refund requested", refunded: "Refunded", failed: "Failed",
};

/** Orders that bring in money (paid, plus pending reviews which usually clear). */
export const counted = (order: Order) => order.status === "paid" || order.status === "pending" || order.status === "refund_requested";

export const daysAgo = (days: number) => Date.now() - days * 86_400_000;

export function inRange(order: Order, from: number, to = Date.now()) {
  const time = Date.parse(order.createdAt);
  return time >= from && time <= to;
}

export function toCsv(rows: (string | number)[][]) {
  return rows.map((row) => row.map((cell) => {
    const value = String(cell);
    return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  }).join(",")).join("\n");
}

export function downloadCsv(name: string, rows: (string | number)[][]) {
  const blob = new Blob(["﻿" + toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
