import { useState } from "react";
import { Settings, HelpCircle, Wallet } from "lucide-react";
import WalletForm from "@/components/wallet-form";
import BalanceCard from "@/components/balance-card";
import PortfolioSummary from "@/components/portfolio-summary";
import RecentWallets from "@/components/recent-wallets";
import { type WalletBalance } from "@shared/schema";

export default function Home() {
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBalanceUpdate = (newBalance: WalletBalance) => {
    setBalances(prev => {
      const existing = prev.findIndex(b => b.address === newBalance.address && b.network === newBalance.network);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newBalance;
        return updated;
      }
      return [...prev, newBalance];
    });
  };

  const totalUSDValue = balances.reduce((sum, balance) => {
    return sum + parseFloat(balance.usdValue || "0");
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">WalletCheck</h1>
                <p className="text-xs text-gray-500">MultiChain Balance Checker</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                className="text-gray-600 hover:text-gray-900 transition-colors"
                data-testid="button-help"
              >
                <HelpCircle className="h-5 w-5" />
              </button>
              <button 
                className="text-gray-600 hover:text-gray-900 transition-colors"
                data-testid="button-settings"
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Wallet Form */}
        <WalletForm 
          onBalanceUpdate={handleBalanceUpdate}
          onLoadingChange={setIsLoading}
          onError={setError}
        />

        {/* Error State */}
        {error && (
          <div className="mb-8">
            <div className="bg-white rounded-xl card-shadow p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Fetch Balance</h3>
              <p className="text-gray-600 mb-6" data-testid="text-error-message">
                {error}
              </p>
              <button 
                className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                onClick={() => setError(null)}
                data-testid="button-retry"
              >
                <i className="fas fa-redo mr-2"></i>Try Again
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="bg-white rounded-xl card-shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full animate-skeleton"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded animate-skeleton w-20 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded animate-skeleton w-12"></div>
                    </div>
                  </div>
                  <div className="h-5 bg-gray-200 rounded animate-skeleton w-16"></div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="h-8 bg-gray-200 rounded animate-skeleton w-32 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded animate-skeleton w-24"></div>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex justify-between mb-2">
                      <div className="h-3 bg-gray-200 rounded animate-skeleton w-16"></div>
                      <div className="h-3 bg-gray-200 rounded animate-skeleton w-12"></div>
                    </div>
                    <div className="flex justify-between">
                      <div className="h-3 bg-gray-200 rounded animate-skeleton w-20"></div>
                      <div className="h-3 bg-gray-200 rounded animate-skeleton w-16"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Balance Results */}
        {!isLoading && balances.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {balances.map((balance, index) => (
              <BalanceCard 
                key={`${balance.address}-${balance.network}`}
                balance={balance}
                index={index}
              />
            ))}
          </div>
        )}

        {/* Portfolio Summary */}
        {!isLoading && balances.length > 0 && (
          <PortfolioSummary balances={balances} totalValue={totalUSDValue} />
        )}

        {/* Recent Wallets */}
        <RecentWallets />
      </div>
    </div>
  );
}
