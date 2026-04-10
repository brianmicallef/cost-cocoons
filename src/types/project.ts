export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'link' | 'file';
}

export interface Payment {
  id: string;
  amount: number;
  description: string;
  date: string;
}

export interface LineItem {
  id: string;
  name: string;
  vendor: string;
  predictedCost: number;
  payments: Payment[];
  attachments: Attachment[];
  completed?: boolean;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  items: LineItem[];
}

export interface Project {
  id: string;
  name: string;
  categories: Category[];
}
