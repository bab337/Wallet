import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const wallets = pgTable("wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  address: text("address").notNull(),
  network: text("network").notNull(),
  label: text("label"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const balances = pgTable("balances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletId: varchar("wallet_id").references(() => wallets.id),
  balance: decimal("balance", { precision: 20, scale: 8 }).notNull(),
  usdValue: decimal("usd_value", { precision: 20, scale: 2 }),
  lastUpdated: timestamp("last_updated").defaultNow(),
  metadata: jsonb("metadata"), // Additional data like token price, etc.
});

export const insertWalletSchema = createInsertSchema(wallets).omit({
  id: true,
  createdAt: true,
});

export const insertBalanceSchema = createInsertSchema(balances).omit({
  id: true,
  lastUpdated: true,
});

export const walletCheckSchema = z.object({
  address: z.string().min(1, "Address is required"),
  network: z.enum(["ethereum", "bitcoin", "polygon", "bsc", "arbitrum", "avalanche", "optimism"]),
});

export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Wallet = typeof wallets.$inferSelect;
export type InsertBalance = z.infer<typeof insertBalanceSchema>;
export type Balance = typeof balances.$inferSelect;
export type WalletCheck = z.infer<typeof walletCheckSchema>;

export interface WalletBalance {
  address: string;
  network: string;
  balance: string;
  usdValue: string;
  symbol: string;
  logoUrl?: string;
  lastUpdated: Date;
  isValid: boolean;
  error?: string;
}

export interface SavedWallet {
  id: string;
  label: string;
  address: string;
  network: string;
  balance?: string;
  usdValue?: string;
  logoUrl?: string;
  lastUpdated?: Date;
  isActive: boolean;
}

export const savedWalletSchema = z.object({
  label: z.string().min(1, "Label is required"),
  address: z.string().min(1, "Address is required"),
  network: z.enum(["ethereum", "bitcoin", "polygon", "bsc", "arbitrum", "avalanche", "optimism"]),
});

export type SavedWalletInput = z.infer<typeof savedWalletSchema>;
