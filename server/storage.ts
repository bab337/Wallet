import { type Wallet, type InsertWallet, type Balance, type InsertBalance, type WalletBalance } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getWallet(id: string): Promise<Wallet | undefined>;
  getWalletByAddress(address: string, network: string): Promise<Wallet | undefined>;
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  getRecentWallets(): Promise<Wallet[]>;
  saveBalance(balance: InsertBalance): Promise<Balance>;
  getBalance(walletId: string): Promise<Balance | undefined>;
}

export class MemStorage implements IStorage {
  private wallets: Map<string, Wallet>;
  private balances: Map<string, Balance>;

  constructor() {
    this.wallets = new Map();
    this.balances = new Map();
  }

  async getWallet(id: string): Promise<Wallet | undefined> {
    return this.wallets.get(id);
  }

  async getWalletByAddress(address: string, network: string): Promise<Wallet | undefined> {
    return Array.from(this.wallets.values()).find(
      (wallet) => wallet.address === address && wallet.network === network
    );
  }

  async createWallet(insertWallet: InsertWallet): Promise<Wallet> {
    const id = randomUUID();
    const wallet: Wallet = { 
      ...insertWallet, 
      id, 
      createdAt: new Date() 
    };
    this.wallets.set(id, wallet);
    return wallet;
  }

  async getRecentWallets(): Promise<Wallet[]> {
    return Array.from(this.wallets.values())
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, 10);
  }

  async saveBalance(insertBalance: InsertBalance): Promise<Balance> {
    const id = randomUUID();
    const balance: Balance = {
      ...insertBalance,
      id,
      lastUpdated: new Date(),
    };
    this.balances.set(id, balance);
    return balance;
  }

  async getBalance(walletId: string): Promise<Balance | undefined> {
    return Array.from(this.balances.values())
      .filter(b => b.walletId === walletId)
      .sort((a, b) => (b.lastUpdated?.getTime() || 0) - (a.lastUpdated?.getTime() || 0))[0];
  }
}

export const storage = new MemStorage();
