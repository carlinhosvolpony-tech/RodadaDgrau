
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
  pixKey?: string;
  createdAt: number;
  parentId?: string; // ID do cambista pai
  totalDepositsByBookie?: number; // Soma de recargas manuais feitas pelo cambista
};

export type Match = {
  id: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  result?: 'H' | 'D' | 'A';
};

export type TicketMatchInfo = {
  home: string;
  away: string;
};

export type Ticket = {
  id: string;
  userId: string;
  userName: string;
  picks: ('H' | 'D' | 'A')[];
  matchInfo: TicketMatchInfo[]; // Nomes dos times no momento da aposta
  cost: number;
  potentialPrize: number;
  status: 'PENDING' | 'VALIDATED' | 'LOST' | 'WON' | 'CANCELLED';
  date: number;
  parentId?: string; 
};

export type BalanceRequest = {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  date: number;
  parentId?: string;
};

export type AppSettings = {
  pixKey: string;
  bettingBlocked: boolean;
  ticketPrice: number;
  jackpotPrize: number;
};
