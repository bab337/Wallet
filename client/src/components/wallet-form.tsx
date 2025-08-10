import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { walletCheckSchema, type WalletCheck, type WalletBalance } from "@shared/schema";
import { validateAddress } from "@/lib/address-validator";
import { checkWalletBalance } from "@/lib/blockchain-api";
import { useToast } from "@/hooks/use-toast";

interface WalletFormProps {
  onBalanceUpdate: (balance: WalletBalance) => void;
  onLoadingChange: (loading: boolean) => void;
  onError: (error: string | null) => void;
}

export default function WalletForm({ onBalanceUpdate, onLoadingChange, onError }: WalletFormProps) {
  const [validationError, setValidationError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<WalletCheck>({
    resolver: zodResolver(walletCheckSchema),
    defaultValues: {
      network: "ethereum",
      address: "",
    },
  });

  const onSubmit = async (data: WalletCheck) => {
    setValidationError(null);
    onError(null);
    
    // Validate address format
    if (!validateAddress(data.address, data.network)) {
      setValidationError(`Invalid address format for ${data.network} network`);
      return;
    }

    try {
      onLoadingChange(true);
      const balance = await checkWalletBalance(data);
      
      if (!balance.isValid && balance.error) {
        onError(balance.error);
      } else {
        onBalanceUpdate(balance);
        toast({
          title: "Balance Updated",
          description: `Successfully fetched balance for ${data.network} wallet`,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch wallet balance";
      onError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      onLoadingChange(false);
    }
  };

  return (
    <div className="mb-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl card-shadow p-6 border border-gray-200 dark:border-gray-700 transition-colors">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Check Wallet Balance</h2>
          <p className="text-gray-600 dark:text-gray-400">Enter a wallet address to check balances across multiple blockchain networks</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Network Selection */}
              <div className="lg:col-span-1">
                <FormField
                  control={form.control}
                  name="network"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Network</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-network">
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
              </div>

              {/* Wallet Address Input */}
              <div className="lg:col-span-2">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wallet Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter wallet address (0x... or bc1...)"
                          className="w-full"
                          data-testid="input-wallet-address"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Check Button */}
              <div className="lg:col-span-1 flex items-end">
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-blue-700 disabled:opacity-50"
                  disabled={form.formState.isSubmitting}
                  data-testid="button-check-balance"
                >
                  {form.formState.isSubmitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  {form.formState.isSubmitting ? "Checking..." : "Check Balance"}
                </Button>
              </div>
            </div>

            {/* Address Validation Messages */}
            {validationError && (
              <Alert variant="destructive" data-testid="alert-validation-error">
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
}
