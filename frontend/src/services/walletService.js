// Company wallet addresses
const WALLETS = {
  TRC20: {
    address: 'TGE4YbwSAcyYtkb9USJWKeXEjFNUstE584',
    contract: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    name: 'TRC20 (USDT)'
  },
  BEP20: {
    address: '0x626Cf0750f44FEa35E1e295082fe80D0F6E9234a',
    contract: '0x55d398326f99059fF775485246999027B3197955',
    name: 'BEP20 (USDT)'
  }
};

export const getWalletAddress = (chain) => {
  return WALLETS[chain] || null;
};

export const getAllWallets = () => {
  return WALLETS;
};

export default WALLETS;
