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

export type ItemStatus = 'idea' | 'quote' | 'started' | 'done';

export interface LineItem {
  id: string;
  name: string;
  vendor: string;
  predictedCost: number;
  payments: Payment[];
  attachments: Attachment[];
  status: ItemStatus;
  completed?: boolean;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  items: LineItem[];
}

export interface Reminder {
  id: string;
  text: string;
  categoryId?: string;
  itemId?: string;
}

export interface MoodItem {
  id: string;
  title: string;
  url?: string;
  imageUrl?: string;
  notes?: string;
  price?: number;
  tags?: string[];
  createdAt: string;
  linkedCostItemId?: string;
}

export interface MoodBoard {
  id: string;
  name: string;
  color: string;
  items: MoodItem[];
}

export interface Project {
  id: string;
  name: string;
  categories: Category[];
  reminders?: Reminder[];
  moodboard?: { boards: MoodBoard[] };
}
