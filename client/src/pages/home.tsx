import { useState } from "react";
import { Settings, HelpCircle, Wallet, History } from "lucide-react";
import WalletForm from "@/components/wallet-form";
import BalanceCard from "@/components/balance-card";
import PortfolioSummary from "@/components/portfolio-summary";
import PortfolioAnalytics from "@/components/portfolio-analytics";
import RecentWallets from "@/components/recent-wallets";
import SavedWallets from "@/components/saved-wallets";
import EnhancedSavedWallets from "@/components/enhanced-saved-wallets";
import { ThemeToggle } from "@/components/theme-toggle";
import { Tabs as TabsComponent, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">WalletCheck</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">MultiChain Balance Checker</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <button 
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                data-testid="button-help"
              >
                <HelpCircle className="h-5 w-5" />
              </button>
              <button 
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
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

        {/* Enhanced Error State */}
        {error && (
          <div className="mb-8 animate-fade-in">
            <div className="bg-white rounded-xl border-l-4 border-red-500 p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-sm font-semibold text-red-800">Unable to Fetch Balance</h3>
                  <p className="mt-1 text-sm text-red-700" data-testid="text-error-message">
                    {error}
                  </p>
                  <div className="mt-4">
                    <button 
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                      onClick={() => setError(null)}
                      data-testid="button-retry"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="bg-white rounded-xl card-shadow p-6 animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full shimmer"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded shimmer w-20 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded shimmer w-12"></div>
                    </div>
                  </div>
                  <div className="h-5 bg-gray-200 rounded shimmer w-16"></div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="h-8 bg-gray-200 rounded shimmer w-32 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded shimmer w-24"></div>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex justify-between mb-2">
                      <div className="h-3 bg-gray-200 rounded shimmer w-16"></div>
                      <div className="h-3 bg-gray-200 rounded shimmer w-12"></div>
                    </div>
                    <div className="flex justify-between">
                      <div className="h-3 bg-gray-200 rounded shimmer w-20"></div>
                      <div className="h-3 bg-gray-200 rounded shimmer w-16"></div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 text-center">
                  <div className="inline-flex items-center text-sm text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                    Fetching balance data...
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
        {/* Portfolio Analytics and Summary */}
        {!isLoading && balances.length > 0 && (
          <>
            <PortfolioAnalytics balances={balances} totalValue={totalUSDValue} />
            <PortfolioSummary balances={balances} totalValue={totalUSDValue} />
          </>
        )}

        {/* Wallet Management Tabs */}
        <TabsComponent defaultValue="saved" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="saved" data-testid="tab-saved-wallets">
              <Wallet className="h-4 w-4 mr-2" />
              My Wallets
            </TabsTrigger>
            <TabsTrigger value="recent" data-testid="tab-recent-checks">
              <History className="h-4 w-4 mr-2" />
              Recent Checks
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="saved" className="mt-6">
            <EnhancedSavedWallets />
          </TabsContent>
          
          <TabsContent value="recent" className="mt-6">
            <RecentWallets />
          </TabsContent>
        </TabsComponent>
      </div>
    </div>
  );
}
