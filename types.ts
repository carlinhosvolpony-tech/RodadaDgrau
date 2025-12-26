
export enum UserRole {
  ADMIN = 'ADMIN',
  CLIENT = 'CLIENT',
  BOOKIE = 'BOOKIE'
}

export type User = {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: UserRole;
  balance: number;
  pix_key?: string;
  created_at: number;
  parent_id?: string;
  total_deposits_by_bookie?: number;
};

export type Match = {
  id: string;
  league: string;
  home_team: string;
  away_team: string;
  date: string;
  result?: 'H' | 'D' | 'A';
  display_order?: number;
};

export type TicketMatchInfo = {
  home: string;
  away: string;
};

export type Ticket = {
  id: string;
  user_id: string;
  user_name: string;
  picks: ('H' | 'D' | 'A')[];
  match_info: TicketMatchInfo[];
  cost: number;
  potential_prize: number;
  status: 'PENDING' | 'VALIDATED' | 'LOST' | 'WON' | 'CANCELLED';
  created_at: number;
  parent_id?: string; 
};

export type BalanceRequest = {
  id: string;
  user_id: string;
  user_name: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: number;
  parent_id?: string;
};

export type AppSettings = {
  id?: number;
  pix_key: string;
  betting_blocked: boolean;
  ticket_price: number;
  jackpot_prize: number;
};
