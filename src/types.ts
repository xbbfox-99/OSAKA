export interface Tag {
  type: 'price' | 'booking' | 'food' | 'menu' | 'buy';
  text: string;
  color?: string;
}

export interface ItineraryItem {
  time: string;
  type: 'sight' | 'food' | 'transit' | 'hotel' | 'misc';
  icon: string;
  title: string;
  body?: string;
  tags?: Tag[];
  map?: string;
  guide?: string;
}

export interface Day {
  label: string;
  title: string;
  loc: string;
  lat: number;
  lon: number;
  items: ItineraryItem[];
}

export interface Expense {
  id: string | number;
  member: number;
  name: string;
  store?: string;
  amount: number;
  preTaxAmount?: number;
  currency: 'JPY' | 'TWD';
  category: string;
  date: string;
  items?: { name: string; translatedName?: string; price: number }[];
}

export interface SplitExpense {
  id: string | number;
  name: string;
  amount: number;
  currency: 'JPY' | 'TWD';
  payer: string;
  participants: string[];
  date: string;
}
