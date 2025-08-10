import { getNetworkIcon, getNetworkColor } from "@/lib/address-validator";
import { formatBalance, formatUSDValue, getTimeAgo } from "@/lib/blockchain-api";
import { type WalletBalance } from "@shared/schema";
import { useState } from "react";

interface BalanceCardProps {
  balance: WalletBalance;
  index: number;
}

export default function BalanceCard({ balance, index }: BalanceCardProps) {
  const iconClass = getNetworkIcon(balance.network);
  const colorClass = getNetworkColor(balance.network);
  const [imageError, setImageError] = useState(false);

  return (
    <div 
      className="bg-white rounded-xl card-shadow hover:card-shadow-hover transition-all duration-300 p-6 animate-fade-in"
      style={{ animationDelay: `${index * 0.1}s` }}
      data-testid={`card-balance-${balance.network}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
            {balance.logoUrl && !imageError ? (
              <img 
                src={balance.logoUrl} 
                alt={`${balance.symbol} logo`}
                className="w-6 h-6 rounded-full"
                onError={() => setImageError(true)}
              />
            ) : (
              <i className={`${iconClass} text-lg`}></i>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 capitalize" data-testid={`text-network-${balance.network}`}>
              {balance.network}
            </h3>
            <p className="text-sm text-gray-500" data-testid={`text-symbol-${balance.network}`}>
              {balance.symbol}
            </p>
          </div>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          balance.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full mr-1 ${
            balance.isValid ? 'bg-green-400' : 'bg-red-400'
          }`}></div>
          {balance.isValid ? 'Active' : 'Error'}
        </span>
      </div>
      
      <div className="space-y-3">
        <div>
          <p 
            className="text-2xl font-bold text-gray-900" 
            data-testid={`text-balance-${balance.network}`}
          >
            {formatBalance(balance.balance)} {balance.symbol}
          </p>
          <p 
            className="text-sm text-gray-600" 
            data-testid={`text-usd-value-${balance.network}`}
          >
            ≈ {formatUSDValue(balance.usdValue)}
          </p>
        </div>
        
        <div className="pt-3 border-t border-gray-100">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Network</span>
            <span className="text-gray-900 capitalize">{balance.network}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-500">Last Updated</span>
            <span className="text-gray-900" data-testid={`text-last-updated-${balance.network}`}>
              {getTimeAgo(balance.lastUpdated)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
