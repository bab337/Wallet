import { apiRequest } from "./queryClient";
import { type WalletBalance, type WalletCheck } from "@shared/schema";

export async function checkWalletBalance(data: WalletCheck): Promise<WalletBalance> {
  const response = await apiRequest("POST", "/api/wallet/check", data);
  return await response.json();
}

export async function getRecentWallets(): Promise<any[]> {
  const response = await apiRequest("GET", "/api/wallets/recent");
  return await response.json();
}

export function formatBalance(balance: string, decimals: number = 4): string {
  const num = parseFloat(balance);
  if (num === 0) return "0";
  if (num < 0.0001) return "< 0.0001";
  return num.toFixed(decimals);
}

export function formatUSDValue(value: string): string {
  const num = parseFloat(value);
  if (num === 0) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
}

export function getTimeAgo(date: Date | string): string {
  const now = new Date();
  const dateObj = (date instanceof Date) ? date : new Date(date);
  const diffMs = now.getTime() - dateObj.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}
