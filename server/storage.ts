import { type Wallet, type InsertWallet, type Balance, type InsertBalance, type WalletBalance, type SavedWallet, type SavedWalletInput } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getWallet(id: string): Promise<Wallet | undefined>;
  getWalletByAddress(address: string, network: string): Promise<Wallet | undefined>;
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  getRecentWallets(): Promise<Wallet[]>;
  saveBalance(balance: InsertBalance): Promise<Balance>;
  getBalance(walletId: string): Promise<Balance | undefined>;
  
  // Saved wallets functionality
  getSavedWallets(): Promise<SavedWallet[]>;
  saveManagedWallet(wallet: SavedWalletInput): Promise<SavedWallet>;
  updateSavedWallet(id: string, updates: Partial<SavedWallet>): Promise<SavedWallet | undefined>;
  deleteSavedWallet(id: string): Promise<boolean>;
  toggleWalletActive(id: string): Promise<SavedWallet | undefined>;
}

export class MemStorage implements IStorage {
  private wallets: Map<string, Wallet>;
  private balances: Map<string, Balance>;
  private savedWallets: Map<string, SavedWallet>;

  constructor() {
    this.wallets = new Map();
    this.balances = new Map();
    this.savedWallets = new Map();
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
      label: insertWallet.label || null, 
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
      walletId: insertBalance.walletId || null,
      usdValue: insertBalance.usdValue || null,
      metadata: insertBalance.metadata || null,
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

  // Saved wallets implementation
  async getSavedWallets(): Promise<SavedWallet[]> {
    return Array.from(this.savedWallets.values())
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  async saveManagedWallet(walletInput: SavedWalletInput): Promise<SavedWallet> {
    const id = randomUUID();
    const savedWallet: SavedWallet = {
      ...walletInput,
      id,
      isActive: true,
      lastUpdated: new Date(),
    };
    this.savedWallets.set(id, savedWallet);
    return savedWallet;
  }

  async updateSavedWallet(id: string, updates: Partial<SavedWallet>): Promise<SavedWallet | undefined> {
    const existing = this.savedWallets.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates, lastUpdated: new Date() };
    this.savedWallets.set(id, updated);
    return updated;
  }

  async deleteSavedWallet(id: string): Promise<boolean> {
    return this.savedWallets.delete(id);
  }

  async toggleWalletActive(id: string): Promise<SavedWallet | undefined> {
    const existing = this.savedWallets.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, isActive: !existing.isActive };
    this.savedWallets.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
