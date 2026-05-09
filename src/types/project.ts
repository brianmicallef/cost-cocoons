export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'link' | 'file';
  deleted?: boolean;
}

export interface Payment {
  id: string;
  amount: number;
  description: string;
  date: string;
  deleted?: boolean;
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
  createdBy?: string;
  deleted?: boolean;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  items: LineItem[];
  createdBy?: string;
  deleted?: boolean;
}

export interface Reminder {
  id: string;
  text: string;
  categoryId?: string;
  itemId?: string;
  createdBy?: string;
  deleted?: boolean;
}

export interface MoodVote {
  user: string;
  type: 'up' | 'down';
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
  /** @deprecated use votes */
  reaction?: 'up' | 'down';
  votes?: MoodVote[];
  createdBy?: string;
  deleted?: boolean;
}

export interface MoodBoard {
  id: string;
  name: string;
  color: string;
  items: MoodItem[];
  createdBy?: string;
  deleted?: boolean;
}

export interface Project {
  id: string;
  name: string;
  categories: Category[];
  reminders?: Reminder[];
  moodboard?: { boards: MoodBoard[] };
}
