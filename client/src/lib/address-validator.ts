export function validateAddress(address: string, network: string): boolean {
  if (!address || !network) return false;

  switch (network) {
    case "ethereum":
    case "polygon":
    case "bsc":
      // Ethereum-compatible address validation
      return /^0x[a-fA-F0-9]{40}$/.test(address);
      
    case "bitcoin":
      // Bitcoin address validation (simplified)
      // Supports Legacy (1...), P2SH (3...), and Bech32 (bc1...)
      return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address) || 
             /^bc1[a-z0-9]{39,59}$/.test(address);
             
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
    default:
      return "fas fa-wallet";
  }
}

export function getNetworkColor(network: string): string {
  switch (network) {
    case "ethereum":
      return "bg-blue-100 text-blue-600";
    case "bitcoin":
      return "bg-orange-100 text-orange-600";
    case "polygon":
      return "bg-purple-100 text-purple-600";
    case "bsc":
      return "bg-yellow-100 text-yellow-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
}
