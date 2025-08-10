import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, RefreshCw, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { savedWalletSchema, type SavedWalletInput, type SavedWallet } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { validateAddress, getNetworkIcon, getNetworkColor } from "@/lib/address-validator";
import { formatUSDValue, getTimeAgo } from "@/lib/blockchain-api";
import { useToast } from "@/hooks/use-toast";

export default function SavedWallets() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: savedWallets, isLoading } = useQuery({
    queryKey: ["/api/saved-wallets"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/saved-wallets");
      return await response.json() as SavedWallet[];
    },
  });

  const addWalletMutation = useMutation({
    mutationFn: async (data: SavedWalletInput) => {
      const response = await apiRequest("POST", "/api/saved-wallets", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-wallets"] });
      setIsAddOpen(false);
      form.reset();
      toast({
        title: "Wallet Added",
        description: "Your wallet has been saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add wallet",
        variant: "destructive",
      });
    },
  });

  const toggleWalletMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("PATCH", `/api/saved-wallets/${id}/toggle`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-wallets"] });
    },
  });

  const deleteWalletMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/saved-wallets/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-wallets"] });
      toast({
        title: "Wallet Removed",
        description: "Wallet has been removed from your portfolio",
      });
    },
  });

  const batchCheckMutation = useMutation({
    mutationFn: async (walletIds: string[]) => {
      const response = await apiRequest("POST", "/api/wallets/batch-check", { walletIds });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-wallets"] });
      setIsRefreshing(false);
      toast({
        title: "Balances Updated",
        description: "All wallet balances have been refreshed",
      });
    },
    onError: () => {
      setIsRefreshing(false);
      toast({
        title: "Error",
        description: "Failed to refresh balances",
        variant: "destructive",
      });
    },
  });

  const form = useForm<SavedWalletInput>({
    resolver: zodResolver(savedWalletSchema),
    defaultValues: {
      label: "",
      address: "",
      network: "ethereum",
    },
  });

  const onSubmit = async (data: SavedWalletInput) => {
    setValidationError(null);
    
    if (!validateAddress(data.address, data.network)) {
      setValidationError(`Invalid address format for ${data.network} network`);
      return;
    }

    addWalletMutation.mutate(data);
  };

  const handleRefreshAll = () => {
    if (!savedWallets) return;
    
    const activeWalletIds = savedWallets
      .filter(w => w.isActive)
      .map(w => w.id);
    
    if (activeWalletIds.length === 0) {
      toast({
        title: "No Active Wallets",
        description: "Enable some wallets to refresh their balances",
        variant: "destructive",
      });
      return;
    }

    setIsRefreshing(true);
    batchCheckMutation.mutate(activeWalletIds);
  };

  const truncateAddress = (address: string) => {
    if (address.length <= 20) return address;
    return `${address.slice(0, 10)}...${address.slice(-8)}`;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl card-shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">My Wallets</h3>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full animate-skeleton"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded animate-skeleton w-32 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded animate-skeleton w-40"></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-4 bg-gray-200 rounded animate-skeleton w-20 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded animate-skeleton w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl card-shadow p-6" data-testid="saved-wallets">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">My Wallets</h3>
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleRefreshAll}
            disabled={isRefreshing || !savedWallets?.some(w => w.isActive)}
            variant="outline"
            size="sm"
            data-testid="button-refresh-all"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh All
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-add-wallet">
                <Plus className="h-4 w-4 mr-2" />
                Add Wallet
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Wallet</DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="label"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Wallet Label</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Personal Wallet, Trading Wallet"
                            data-testid="input-wallet-label"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="network"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Network</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-add-network">
                              <SelectValue placeholder="Select network" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ethereum">Ethereum</SelectItem>
                            <SelectItem value="bitcoin">Bitcoin</SelectItem>
                            <SelectItem value="polygon">Polygon</SelectItem>
                            <SelectItem value="bsc">Binance Smart Chain</SelectItem>
                            <SelectItem value="arbitrum">Arbitrum</SelectItem>
                            <SelectItem value="avalanche">Avalanche</SelectItem>
                            <SelectItem value="optimism">Optimism</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Wallet Address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter wallet address"
                            data-testid="input-add-wallet-address"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {validationError && (
                    <Alert variant="destructive" data-testid="alert-add-validation-error">
                      <AlertDescription>{validationError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={addWalletMutation.isPending}
                      data-testid="button-save-wallet"
                    >
                      {addWalletMutation.isPending ? "Adding..." : "Add Wallet"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-3">
        {savedWallets && savedWallets.length > 0 ? (
          savedWallets.map((wallet) => {
            const iconClass = getNetworkIcon(wallet.network);
            const colorClass = getNetworkColor(wallet.network);
            
            return (
              <div
                key={wallet.id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 ${
                  wallet.isActive 
                    ? 'bg-gray-50 border-gray-200 hover:bg-gray-100' 
                    : 'bg-gray-25 border-gray-100 opacity-60'
                }`}
                data-testid={`saved-wallet-${wallet.id}`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
                    {wallet.logoUrl ? (
                      <img 
                        src={wallet.logoUrl} 
                        alt={`${wallet.network} logo`}
                        className="w-6 h-6 rounded-full"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.style.display = 'none';
                          const sibling = target.nextElementSibling as HTMLElement;
                          if (sibling) sibling.style.display = 'block';
                        }}
                      />
                    ) : null}
                    <i className={`${iconClass} text-sm`} style={{ display: wallet.logoUrl ? 'none' : 'block' }}></i>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p 
                        className="font-medium text-gray-900" 
                        data-testid={`text-wallet-label-${wallet.id}`}
                      >
                        {wallet.label}
                      </p>
                      <span className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded capitalize">
                        {wallet.network}
                      </span>
                    </div>
                    <p 
                      className="text-sm text-gray-500" 
                      data-testid={`text-wallet-address-${wallet.id}`}
                    >
                      {truncateAddress(wallet.address)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p 
                      className="font-semibold text-gray-900" 
                      data-testid={`text-wallet-balance-${wallet.id}`}
                    >
                      {formatUSDValue(wallet.usdValue || "0")}
                    </p>
                    {wallet.lastUpdated && (
                      <p className="text-xs text-gray-500">
                        {getTimeAgo(new Date(wallet.lastUpdated))}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => toggleWalletMutation.mutate(wallet.id)}
                      variant="ghost"
                      size="sm"
                      disabled={toggleWalletMutation.isPending}
                      data-testid={`button-toggle-${wallet.id}`}
                    >
                      {wallet.isActive ? (
                        <Eye className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                    
                    <Button
                      onClick={() => deleteWalletMutation.mutate(wallet.id)}
                      variant="ghost"
                      size="sm"
                      disabled={deleteWalletMutation.isPending}
                      data-testid={`button-delete-${wallet.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-2">No saved wallets yet</p>
            <p className="text-sm text-gray-400 mb-4">Add wallets to track your portfolio across multiple networks</p>
            <Button onClick={() => setIsAddOpen(true)} data-testid="button-add-first-wallet">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Wallet
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}