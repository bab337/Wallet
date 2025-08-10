import { useState } from "react";
import { BarChart, PieChart, TrendingUp, Download, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type WalletBalance } from "@shared/schema";
import { formatUSDValue } from "@/lib/blockchain-api";

interface PortfolioAnalyticsProps {
  balances: WalletBalance[];
  totalValue: number;
}

export default function PortfolioAnalytics({ balances, totalValue }: PortfolioAnalyticsProps) {
  const [timeRange, setTimeRange] = useState("7d");
  
  const getNetworkDistribution = () => {
    const distribution = balances.reduce((acc, balance) => {
      const network = balance.network;
      const value = parseFloat(balance.usdValue || "0");
      acc[network] = (acc[network] || 0) + value;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(distribution)
      .map(([network, value]) => ({
        network,
        value,
        percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  };

  const getRiskAnalysis = () => {
    const distribution = getNetworkDistribution();
    const topAllocation = distribution[0]?.percentage || 0;
    
    let riskLevel = "Low";
    let riskColor = "text-green-600 dark:text-green-400";
    
    if (topAllocation > 70) {
      riskLevel = "High";
      riskColor = "text-red-600 dark:text-red-400";
    } else if (topAllocation > 50) {
      riskLevel = "Medium";
      riskColor = "text-yellow-600 dark:text-yellow-400";
    }
    
    return { riskLevel, riskColor, topAllocation };
  };

  const exportToCSV = () => {
    const csvContent = [
      ["Network", "Address", "Balance", "USD Value", "Symbol"].join(","),
      ...balances.map(balance => [
        balance.network,
        balance.address,
        balance.balance,
        balance.usdValue || "0",
        balance.symbol
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `portfolio-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const distribution = getNetworkDistribution();
  const { riskLevel, riskColor, topAllocation } = getRiskAnalysis();

  if (balances.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Portfolio Distribution */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              <PieChart className="h-5 w-5 inline mr-2" />
              Portfolio Distribution
            </CardTitle>
            <Button
              onClick={exportToCSV}
              variant="outline"
              size="sm"
              className="text-gray-600 dark:text-gray-300"
              data-testid="button-export-csv"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {distribution.slice(0, 5).map((item, index) => (
              <div key={item.network} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className={`w-3 h-3 rounded-full`}
                    style={{ 
                      backgroundColor: [
                        '#3B82F6', '#EF4444', '#8B5CF6', '#F59E0B', '#10B981'
                      ][index % 5]
                    }}
                  ></div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                    {item.network}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {formatUSDValue(item.value.toString())}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {item.percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risk Analysis */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            <TrendingUp className="h-5 w-5 inline mr-2" />
            Risk Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">Risk Level</span>
              <span className={`text-sm font-semibold ${riskColor}`}>
                {riskLevel}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">Network Count</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {distribution.length}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">Top Allocation</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {topAllocation.toFixed(1)}%
              </span>
            </div>
            
            <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p>• <strong>Low Risk:</strong> Well-diversified across networks</p>
                <p>• <strong>Medium Risk:</strong> Moderate concentration</p>
                <p>• <strong>High Risk:</strong> Over-concentrated in one network</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}