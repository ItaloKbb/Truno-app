export const SHOP_POWERS = ['bomb', 'block'] as const;
export type ShopPower = (typeof SHOP_POWERS)[number];

export interface ShopItem {
  id: string;
  name: string;
  price: number;
  url: string;
  /** Verdadeiro quando o preço é cobrado em troféus, e não em moedas. */
  trophyPrice: boolean;
  power: ShopPower;
}

export interface Shop {
  id: string;
  name: string;
  status: boolean;
  itens: ShopItem[];
  url: string;
}
