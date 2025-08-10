import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, Trash2, RefreshCw, Eye, EyeOff, GripVertical, 
  Download, Filter, Search, Star, StarOff, Edit3 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { savedWalletSchema, type SavedWalletInput, type SavedWallet } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { validateAddress, getNetworkIcon, getNetworkColor } from "@/lib/address-validator";
import { formatUSDValue, getTimeAgo } from "@/lib/blockchain-api";
import { useToast } from "@/hooks/use-toast";

interface DragItem {
  id: string;
  index: number;
}

export default function EnhancedSavedWallets() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterNetwork, setFilterNetwork] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [showBalances, setShowBalances] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: savedWallets = [], isLoading } = useQuery({
    queryKey: ["/api/saved-wallets"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/saved-wallets");
      return await response.json() as SavedWallet[];
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

  // Filter and sort wallets
  const processedWallets = useMemo(() => {
    let filtered = savedWallets.filter((wallet) => {
      const matchesSearch = wallet.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wallet.address.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesNetwork = filterNetwork === "all" || wallet.network === filterNetwork;
      return matchesSearch && matchesNetwork;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.label.localeCompare(b.label);
        case "network":
          return a.network.localeCompare(b.network);
        case "balance":
          return parseFloat(b.usdValue || "0") - parseFloat(a.usdValue || "0");
        case "date":
          return (a.sortOrder || 0) - (b.sortOrder || 0);
        default:
          return 0;
      }
    });
  }, [savedWallets, searchTerm, filterNetwork, sortBy]);

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

  const deleteWalletMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/saved-wallets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-wallets"] });
      toast({
        title: "Wallet Deleted",
        description: "Wallet has been removed from your saved list",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete wallet",
        variant: "destructive",
      });
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await apiRequest("PATCH", `/api/saved-wallets/${id}`, { isActive });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-wallets"] });
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

  const handleDragStart = useCallback((e: React.DragEvent, wallet: SavedWallet, index: number) => {
    setDraggedItem({ id: wallet.id, index });
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.index === dropIndex) {
      setDraggedItem(null);
      return;
    }

    // Reorder logic would be implemented here with backend support
    setDraggedItem(null);
  }, [draggedItem]);

  const exportToCSV = () => {
    const csvContent = [
      ["Label", "Network", "Address", "Balance", "USD Value", "Last Updated"].join(","),
      ...processedWallets.map(wallet => [
        wallet.label,
        wallet.network,
        wallet.address,
        wallet.balance || "0",
        wallet.usdValue || "0",
        wallet.lastUpdated ? new Date(wallet.lastUpdated).toLocaleDateString() : "N/A"
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `saved-wallets-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 transition-colors">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100" data-testid="text-saved-wallets-title">
            Saved Wallets ({processedWallets.length})
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage and organize your cryptocurrency wallets
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowBalances(!showBalances)}
            variant="outline"
            size="sm"
            className="text-gray-600 dark:text-gray-300"
          >
            {showBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          
          <Button
            onClick={exportToCSV}
            variant="outline"
            size="sm"
            className="text-gray-600 dark:text-gray-300"
            disabled={processedWallets.length === 0}
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-add-wallet">
                <Plus className="h-4 w-4 mr-1" />
                Add Wallet
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-gray-900 dark:text-gray-100">Add New Wallet</DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="label"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-900 dark:text-gray-100">Wallet Label</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="My Main Wallet" 
                            {...field}
                            className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-600"
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
                        <FormLabel className="text-gray-900 dark:text-gray-100">Network</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-600">
                              <SelectValue placeholder="Select network" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                            <SelectItem value="ethereum">Ethereum</SelectItem>
                            <SelectItem value="bitcoin">Bitcoin</SelectItem>
                            <SelectItem value="polygon">Polygon</SelectItem>
                            <SelectItem value="bsc">Binance Smart Chain</SelectItem>
                            <SelectItem value="arbitrum">Arbitrum</SelectItem>
                            <SelectItem value="avalanche">Avalanche</SelectItem>
                            <SelectItem value="optimism">Optimism</SelectItem>
                            <SelectItem value="fantom">Fantom</SelectItem>
                            <SelectItem value="harmony">Harmony</SelectItem>
                            <SelectItem value="moonriver">Moonriver</SelectItem>
                            <SelectItem value="cronos">Cronos</SelectItem>
                            <SelectItem value="solana">Solana</SelectItem>
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
                        <FormLabel className="text-gray-900 dark:text-gray-100">Address</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="0x..." 
                            {...field}
                            className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-600"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {validationError && (
                    <Alert variant="destructive">
                      <AlertDescription>{validationError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={addWalletMutation.isPending}
                      className="flex-1"
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

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search wallets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-600"
          />
        </div>
        
        <Select value={filterNetwork} onValueChange={setFilterNetwork}>
          <SelectTrigger className="w-full sm:w-48 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-600">
            <SelectValue placeholder="Filter by network" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <SelectItem value="all">All Networks</SelectItem>
            <SelectItem value="ethereum">Ethereum</SelectItem>
            <SelectItem value="bitcoin">Bitcoin</SelectItem>
            <SelectItem value="polygon">Polygon</SelectItem>
            <SelectItem value="bsc">BSC</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-48 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-600">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="network">Network</SelectItem>
            <SelectItem value="balance">Balance</SelectItem>
            <SelectItem value="date">Date Added</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Wallet List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : processedWallets.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Plus className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchTerm || filterNetwork !== "all" 
              ? "No wallets match your search criteria" 
              : "No saved wallets yet"
            }
          </p>
          {!searchTerm && filterNetwork === "all" && (
            <Button onClick={() => setIsAddOpen(true)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Wallet
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {processedWallets.map((wallet, index) => (
            <div
              key={wallet.id}
              draggable
              onDragStart={(e) => handleDragStart(e, wallet, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className={`
                flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg 
                hover:bg-gray-100 dark:hover:bg-gray-600 transition-all cursor-move
                ${draggedItem?.id === wallet.id ? 'opacity-50' : ''}
              `}
              data-testid={`saved-wallet-${wallet.id}`}
            >
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                <GripVertical className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getNetworkColor(wallet.network)}`}>
                  <i className={`${getNetworkIcon(wallet.network)} text-lg`}></i>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {wallet.label}
                    </p>
                    {wallet.isActive && (
                      <Star className="h-4 w-4 text-yellow-500" fill="currentColor" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {wallet.address}
                  </p>
                </div>

                <div className="flex items-center space-x-4">
                  <Badge variant="secondary" className={getNetworkColor(wallet.network)}>
                    {wallet.network}
                  </Badge>

                  {showBalances && wallet.usdValue && (
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatUSDValue(wallet.usdValue)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {wallet.lastUpdated ? getTimeAgo(wallet.lastUpdated) : "No updates"}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleFavoriteMutation.mutate({
                    id: wallet.id,
                    isActive: !wallet.isActive
                  })}
                  className="text-gray-600 dark:text-gray-400 hover:text-yellow-500"
                >
                  {wallet.isActive ? (
                    <Star className="h-4 w-4" fill="currentColor" />
                  ) : (
                    <StarOff className="h-4 w-4" />
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteWalletMutation.mutate(wallet.id)}
                  disabled={deleteWalletMutation.isPending}
                  className="text-gray-600 dark:text-gray-400 hover:text-red-500"
                  data-testid={`button-delete-${wallet.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}