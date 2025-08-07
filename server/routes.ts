import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { walletCheckSchema, type WalletBalance } from "@shared/schema";
import { validateAddress } from "../client/src/lib/address-validator";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Check wallet balance endpoint
  app.post("/api/wallet/check", async (req, res) => {
    try {
      const { address, network } = walletCheckSchema.parse(req.body);
      
      // Validate address format
      if (!validateAddress(address, network)) {
        return res.status(400).json({ 
          error: "Invalid address format for selected network" 
        });
      }

      // Check if wallet exists, create if not
      let wallet = await storage.getWalletByAddress(address, network);
      if (!wallet) {
        wallet = await storage.createWallet({ address, network });
      }

      // Fetch balance from blockchain
      const balanceData = await fetchBalanceFromBlockchain(address, network);
      
      // Save balance to storage
      await storage.saveBalance({
        walletId: wallet.id,
        balance: balanceData.balance,
        usdValue: balanceData.usdValue,
        metadata: { symbol: balanceData.symbol }
      });

      res.json(balanceData);
    } catch (error) {
      console.error("Error checking wallet balance:", error);
      res.status(500).json({ 
        error: "Failed to fetch wallet balance. Please try again." 
      });
    }
  });

  // Get recent wallets
  app.get("/api/wallets/recent", async (req, res) => {
    try {
      const wallets = await storage.getRecentWallets();
      const walletsWithBalances = await Promise.all(
        wallets.map(async (wallet) => {
          const balance = await storage.getBalance(wallet.id);
          return {
            ...wallet,
            balance: balance?.balance || "0",
            usdValue: balance?.usdValue || "0",
            lastUpdated: balance?.lastUpdated || wallet.createdAt,
          };
        })
      );
      res.json(walletsWithBalances);
    } catch (error) {
      console.error("Error fetching recent wallets:", error);
      res.status(500).json({ error: "Failed to fetch recent wallets" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function fetchBalanceFromBlockchain(address: string, network: string): Promise<WalletBalance> {
  try {
    let balance: string = "0";
    let usdValue: string = "0";
    let symbol: string = "";

    switch (network) {
      case "ethereum":
        const ethData = await fetchEthereumBalance(address);
        balance = ethData.balance;
        usdValue = ethData.usdValue;
        symbol = "ETH";
        break;
        
      case "bitcoin":
        const btcData = await fetchBitcoinBalance(address);
        balance = btcData.balance;
        usdValue = btcData.usdValue;
        symbol = "BTC";
        break;
        
      case "polygon":
        const maticData = await fetchPolygonBalance(address);
        balance = maticData.balance;
        usdValue = maticData.usdValue;
        symbol = "MATIC";
        break;
        
      case "bsc":
        const bnbData = await fetchBSCBalance(address);
        balance = bnbData.balance;
        usdValue = bnbData.usdValue;
        symbol = "BNB";
        break;
        
      default:
        throw new Error(`Unsupported network: ${network}`);
    }

    return {
      address,
      network,
      balance,
      usdValue,
      symbol,
      lastUpdated: new Date(),
      isValid: true,
    };
  } catch (error) {
    console.error(`Error fetching ${network} balance:`, error);
    return {
      address,
      network,
      balance: "0",
      usdValue: "0",
      symbol: getNetworkSymbol(network),
      lastUpdated: new Date(),
      isValid: false,
      error: "Failed to fetch balance",
    };
  }
}

async function fetchEthereumBalance(address: string) {
  const response = await fetch(`https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=YourApiKeyToken`);
  const data = await response.json();
  const balanceWei = data.result;
  const balanceEth = (parseInt(balanceWei) / 1e18).toString();
  
  // Get ETH price from CoinGecko
  const priceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
  const priceData = await priceResponse.json();
  const ethPrice = priceData.ethereum.usd;
  const usdValue = (parseFloat(balanceEth) * ethPrice).toFixed(2);
  
  return { balance: balanceEth, usdValue };
}

async function fetchBitcoinBalance(address: string) {
  const response = await fetch(`https://blockstream.info/api/address/${address}`);
  const data = await response.json();
  const balanceSats = data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
  const balanceBTC = (balanceSats / 1e8).toString();
  
  // Get BTC price from CoinGecko
  const priceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
  const priceData = await priceResponse.json();
  const btcPrice = priceData.bitcoin.usd;
  const usdValue = (parseFloat(balanceBTC) * btcPrice).toFixed(2);
  
  return { balance: balanceBTC, usdValue };
}

async function fetchPolygonBalance(address: string) {
  const response = await fetch('https://polygon-rpc.com/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_getBalance',
      params: [address, 'latest'],
      id: 1
    })
  });
  const data = await response.json();
  const balanceWei = parseInt(data.result, 16);
  const balanceMatic = (balanceWei / 1e18).toString();
  
  // Get MATIC price from CoinGecko
  const priceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=usd');
  const priceData = await priceResponse.json();
  const maticPrice = priceData['matic-network'].usd;
  const usdValue = (parseFloat(balanceMatic) * maticPrice).toFixed(2);
  
  return { balance: balanceMatic, usdValue };
}

async function fetchBSCBalance(address: string) {
  const response = await fetch('https://bsc-dataseed.binance.org/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_getBalance',
      params: [address, 'latest'],
      id: 1
    })
  });
  const data = await response.json();
  const balanceWei = parseInt(data.result, 16);
  const balanceBNB = (balanceWei / 1e18).toString();
  
  // Get BNB price from CoinGecko
  const priceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd');
  const priceData = await priceResponse.json();
  const bnbPrice = priceData.binancecoin.usd;
  const usdValue = (parseFloat(balanceBNB) * bnbPrice).toFixed(2);
  
  return { balance: balanceBNB, usdValue };
}

function getNetworkSymbol(network: string): string {
  switch (network) {
    case "ethereum": return "ETH";
    case "bitcoin": return "BTC";
    case "polygon": return "MATIC";
    case "bsc": return "BNB";
    default: return "";
  }
}
