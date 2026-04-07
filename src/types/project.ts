export interface Payment {
  id: string;
  amount: number;
  description: string;
  date: string;
}

export interface LineItem {
  id: string;
  name: string;
  predictedCost: number;
  payments: Payment[];
}

export interface Category {
  id: string;
  name: string;
  items: LineItem[];
}

export interface Project {
  id: string;
  name: string;
  categories: Category[];
}
