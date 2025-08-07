import { useQuery } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { getRecentWallets, formatUSDValue, getTimeAgo } from "@/lib/blockchain-api";
import { getNetworkIcon, getNetworkColor } from "@/lib/address-validator";

export default function RecentWallets() {
  const { data: recentWallets, isLoading } = useQuery({
    queryKey: ["/api/wallets/recent"],
    queryFn: () => getRecentWallets(),
  });

  const truncateAddress = (address: string) => {
    if (address.length <= 20) return address;
    return `${address.slice(0, 10)}...${address.slice(-8)}`;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl card-shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Recent Wallets</h3>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-skeleton"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded animate-skeleton w-40 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded animate-skeleton w-20"></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-4 bg-gray-200 rounded animate-skeleton w-20 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded animate-skeleton w-12"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl card-shadow p-6" data-testid="recent-wallets">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Recent Wallets</h3>
        <button 
          className="text-primary hover:text-blue-700 text-sm font-medium"
          data-testid="button-clear-history"
        >
          <Trash2 className="h-4 w-4 mr-1 inline" />
          Clear History
        </button>
      </div>

      <div className="space-y-3">
        {recentWallets && recentWallets.length > 0 ? (
          recentWallets.map((wallet) => {
            const iconClass = getNetworkIcon(wallet.network);
            const colorClass = getNetworkColor(wallet.network);
            
            return (
              <div
                key={`${wallet.address}-${wallet.network}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                data-testid={`wallet-item-${wallet.id}`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}>
                    <i className={`${iconClass} text-sm`}></i>
                  </div>
                  <div>
                    <p 
                      className="text-sm font-medium text-gray-900" 
                      data-testid={`text-wallet-address-${wallet.id}`}
                    >
                      {truncateAddress(wallet.address)}
                    </p>
                    <p 
                      className="text-xs text-gray-500" 
                      data-testid={`text-wallet-checked-${wallet.id}`}
                    >
                      Checked {getTimeAgo(new Date(wallet.lastUpdated))}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p 
                    className="text-sm font-medium text-gray-900" 
                    data-testid={`text-wallet-value-${wallet.id}`}
                  >
                    {formatUSDValue(wallet.usdValue || "0")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {parseFloat(wallet.balance || "0") > 0 ? "+0.00%" : "0.00%"}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No recent wallets found</p>
            <p className="text-sm text-gray-400 mt-1">Check a wallet address to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
