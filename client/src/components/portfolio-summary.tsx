import { ExternalLink } from "lucide-react";
import { formatUSDValue } from "@/lib/blockchain-api";
import { type WalletBalance } from "@shared/schema";

interface PortfolioSummaryProps {
  balances: WalletBalance[];
  totalValue: number;
}

export default function PortfolioSummary({ balances, totalValue }: PortfolioSummaryProps) {
  const calculateAllocation = (balance: WalletBalance) => {
    const value = parseFloat(balance.usdValue || "0");
    return totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : "0.0";
  };

  const getNetworkColor = (network: string) => {
    switch (network) {
      case "ethereum":
        return "bg-blue-500";
      case "bitcoin":
        return "bg-orange-500";
      case "polygon":
        return "bg-purple-500";
      case "bsc":
        return "bg-yellow-500";
      case "arbitrum":
        return "bg-cyan-500";
      case "avalanche":
        return "bg-red-500";
      case "optimism":
        return "bg-rose-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="bg-white rounded-xl card-shadow p-6 mb-8" data-testid="portfolio-summary">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Portfolio Summary</h3>
        <button 
          className="text-primary hover:text-blue-700 text-sm font-medium"
          data-testid="button-view-details"
        >
          <ExternalLink className="h-4 w-4 mr-1 inline" />
          View Details
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center">
          <p 
            className="text-3xl font-bold text-gray-900" 
            data-testid="text-total-value"
          >
            {formatUSDValue(totalValue.toString())}
          </p>
          <p className="text-sm text-gray-600">Total Portfolio Value</p>
        </div>
        
        <div className="text-center">
          <p 
            className="text-3xl font-bold text-success" 
            data-testid="text-total-gain"
          >
            +$0.00
          </p>
          <p className="text-sm text-gray-600">24h Change</p>
        </div>
        
        <div className="text-center">
          <p 
            className="text-3xl font-bold text-success" 
            data-testid="text-total-gain-percent"
          >
            +0.00%
          </p>
          <p className="text-sm text-gray-600">24h Change %</p>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-100">
        <h4 className="text-sm font-semibold text-gray-700 mb-4">Asset Allocation</h4>
        <div className="space-y-3">
          {balances.map((balance) => (
            <div 
              key={`${balance.address}-${balance.network}`} 
              className="flex items-center justify-between"
              data-testid={`allocation-${balance.network}`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded ${getNetworkColor(balance.network)}`}></div>
                <span className="text-sm text-gray-600 capitalize">
                  {balance.network} ({balance.symbol})
                </span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {calculateAllocation(balance)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
