export function validateAddress(address: string, network: string): boolean {
  if (!address || !network) return false;

  switch (network) {
    case "ethereum":
    case "polygon":
    case "bsc":
    case "arbitrum":
    case "avalanche":
    case "optimism":
    case "fantom":
    case "harmony":
    case "moonriver":
    case "cronos":
      // Ethereum-compatible address validation
      return /^0x[a-fA-F0-9]{40}$/.test(address);
      
    case "bitcoin":
      // Bitcoin address validation (simplified)
      // Supports Legacy (1...), P2SH (3...), and Bech32 (bc1...)
      return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address) || 
             /^bc1[a-z0-9]{39,59}$/.test(address);

    case "solana":
      // Solana addresses are base58 encoded and 32-44 characters long
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
             
    default:
      return false;
  }
}

export function getNetworkIcon(network: string): string {
  switch (network) {
    case "ethereum":
      return "fab fa-ethereum";
    case "bitcoin":
      return "fab fa-bitcoin";
    case "polygon":
      return "fas fa-gem";
    case "bsc":
      return "fas fa-coins";
    case "arbitrum":
      return "fas fa-layer-group";
    case "avalanche":
      return "fas fa-mountain";
    case "optimism":
      return "fas fa-bolt";
    case "fantom":
      return "fas fa-ghost";
    case "harmony":
      return "fas fa-music";
    case "moonriver":
      return "fas fa-moon";
    case "cronos":
      return "fas fa-crown";
    case "solana":
      return "fas fa-sun";
    default:
      return "fas fa-wallet";
  }
}

export function getNetworkColor(network: string): string {
  switch (network) {
    case "ethereum":
      return "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300";
    case "bitcoin":
      return "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300";
    case "polygon":
      return "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300";
    case "bsc":
      return "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300";
    case "arbitrum":
      return "bg-cyan-100 text-cyan-600 dark:bg-cyan-900 dark:text-cyan-300";
    case "avalanche":
      return "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300";
    case "optimism":
      return "bg-rose-100 text-rose-600 dark:bg-rose-900 dark:text-rose-300";
    case "fantom":
      return "bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300";
    case "harmony":
      return "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300";
    case "moonriver":
      return "bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300";
    case "cronos":
      return "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300";
    case "solana":
      return "bg-violet-100 text-violet-600 dark:bg-violet-900 dark:text-violet-300";
    default:
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300";
  }
}
