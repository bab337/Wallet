import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { walletCheckSchema, savedWalletSchema, type WalletBalance } from "@shared/schema";
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

  // Saved wallets management
  app.get("/api/saved-wallets", async (req, res) => {
    try {
      const savedWallets = await storage.getSavedWallets();
      res.json(savedWallets);
    } catch (error) {
      console.error("Error fetching saved wallets:", error);
      res.status(500).json({ error: "Failed to fetch saved wallets" });
    }
  });

  app.post("/api/saved-wallets", async (req, res) => {
    try {
      const walletData = savedWalletSchema.parse(req.body);
      
      // Validate address format
      if (!validateAddress(walletData.address, walletData.network)) {
        return res.status(400).json({ 
          error: "Invalid address format for selected network" 
        });
      }

      const savedWallet = await storage.saveManagedWallet(walletData);
      res.json(savedWallet);
    } catch (error) {
      console.error("Error saving wallet:", error);
      res.status(500).json({ error: "Failed to save wallet" });
    }
  });

  app.patch("/api/saved-wallets/:id/toggle", async (req, res) => {
    try {
      const { id } = req.params;
      const updatedWallet = await storage.toggleWalletActive(id);
      
      if (!updatedWallet) {
        return res.status(404).json({ error: "Wallet not found" });
      }
      
      res.json(updatedWallet);
    } catch (error) {
      console.error("Error toggling wallet:", error);
      res.status(500).json({ error: "Failed to toggle wallet" });
    }
  });

  app.delete("/api/saved-wallets/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteSavedWallet(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Wallet not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting wallet:", error);
      res.status(500).json({ error: "Failed to delete wallet" });
    }
  });

  // Batch check balances for multiple wallets
  app.post("/api/wallets/batch-check", async (req, res) => {
    try {
      const { walletIds } = req.body;
      
      if (!Array.isArray(walletIds)) {
        return res.status(400).json({ error: "Invalid wallet IDs format" });
      }

      const savedWallets = await storage.getSavedWallets();
      const activeWallets = savedWallets.filter(w => 
        walletIds.includes(w.id) && w.isActive
      );

      const balancePromises = activeWallets.map(async (wallet) => {
        try {
          const balanceData = await fetchBalanceFromBlockchain(wallet.address, wallet.network);
          
          // Update saved wallet with latest balance
          await storage.updateSavedWallet(wallet.id, {
            balance: balanceData.balance,
            usdValue: balanceData.usdValue,
            logoUrl: balanceData.logoUrl,
            lastUpdated: new Date(),
          });

          return { ...wallet, ...balanceData };
        } catch (error) {
          console.error(`Error fetching balance for ${wallet.label}:`, error);
          return {
            ...wallet,
            balance: "0",
            usdValue: "0",
            isValid: false,
            error: "Failed to fetch balance",
          };
        }
      });

      const results = await Promise.all(balancePromises);
      res.json(results);
    } catch (error) {
      console.error("Error in batch check:", error);
      res.status(500).json({ error: "Failed to check balances" });
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
    let logoUrl: string = "";

    switch (network) {
      case "ethereum":
        const ethData = await fetchEthereumBalance(address);
        balance = ethData.balance;
        usdValue = ethData.usdValue;
        symbol = "ETH";
        logoUrl = await fetchTokenLogo("ethereum");
        break;
        
      case "bitcoin":
        const btcData = await fetchBitcoinBalance(address);
        balance = btcData.balance;
        usdValue = btcData.usdValue;
        symbol = "BTC";
        logoUrl = await fetchTokenLogo("bitcoin");
        break;
        
      case "polygon":
        const maticData = await fetchPolygonBalance(address);
        balance = maticData.balance;
        usdValue = maticData.usdValue;
        symbol = "MATIC";
        logoUrl = await fetchTokenLogo("matic-network");
        break;
        
      case "bsc":
        const bnbData = await fetchBSCBalance(address);
        balance = bnbData.balance;
        usdValue = bnbData.usdValue;
        symbol = "BNB";
        logoUrl = await fetchTokenLogo("binancecoin");
        break;

      case "arbitrum":
        const arbData = await fetchArbitrumBalance(address);
        balance = arbData.balance;
        usdValue = arbData.usdValue;
        symbol = "ETH";
        logoUrl = await fetchTokenLogo("ethereum");
        break;

      case "avalanche":
        const avaxData = await fetchAvalancheBalance(address);
        balance = avaxData.balance;
        usdValue = avaxData.usdValue;
        symbol = "AVAX";
        logoUrl = await fetchTokenLogo("avalanche-2");
        break;

      case "optimism":
        const opData = await fetchOptimismBalance(address);
        balance = opData.balance;
        usdValue = opData.usdValue;
        symbol = "ETH";
        logoUrl = await fetchTokenLogo("ethereum");
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
      logoUrl,
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
      logoUrl: "",
      lastUpdated: new Date(),
      isValid: false,
      error: "Failed to fetch balance. Please check the address and try again.",
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

// Add new network balance fetchers
async function fetchArbitrumBalance(address: string) {
  const response = await fetch('https://arb1.arbitrum.io/rpc', {
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
  const balanceEth = (balanceWei / 1e18).toString();
  
  // Get ETH price from CoinGecko
  const priceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
  const priceData = await priceResponse.json();
  const ethPrice = priceData.ethereum.usd;
  const usdValue = (parseFloat(balanceEth) * ethPrice).toFixed(2);
  
  return { balance: balanceEth, usdValue };
}

async function fetchAvalancheBalance(address: string) {
  const response = await fetch('https://api.avax.network/ext/bc/C/rpc', {
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
  const balanceAvax = (balanceWei / 1e18).toString();
  
  // Get AVAX price from CoinGecko
  const priceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=avalanche-2&vs_currencies=usd');
  const priceData = await priceResponse.json();
  const avaxPrice = priceData['avalanche-2'].usd;
  const usdValue = (parseFloat(balanceAvax) * avaxPrice).toFixed(2);
  
  return { balance: balanceAvax, usdValue };
}

async function fetchOptimismBalance(address: string) {
  const response = await fetch('https://mainnet.optimism.io', {
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
  const balanceEth = (balanceWei / 1e18).toString();
  
  // Get ETH price from CoinGecko
  const priceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
  const priceData = await priceResponse.json();
  const ethPrice = priceData.ethereum.usd;
  const usdValue = (parseFloat(balanceEth) * ethPrice).toFixed(2);
  
  return { balance: balanceEth, usdValue };
}

async function fetchTokenLogo(coinId: string): Promise<string> {
  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`);
    const data = await response.json();
    return data.image?.large || data.image?.small || "";
  } catch (error) {
    console.error(`Error fetching logo for ${coinId}:`, error);
    return "";
  }
}

function getNetworkSymbol(network: string): string {
  switch (network) {
    case "ethereum": return "ETH";
    case "bitcoin": return "BTC";
    case "polygon": return "MATIC";
    case "bsc": return "BNB";
    case "arbitrum": return "ETH";
    case "avalanche": return "AVAX";
    case "optimism": return "ETH";
    default: return "";
  }
}
