export interface CoinWallet {
  id: string;
  balance: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  url: string;
  coin: CoinWallet;
}
