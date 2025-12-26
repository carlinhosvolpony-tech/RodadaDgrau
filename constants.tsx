
import { Match, AppSettings, UserRole, User } from "./types";

export const INITIAL_MATCHES: Match[] = Array.from({ length: 12 }, (_, i) => ({
  id: `match-${i + 1}`,
  league: "Brasileirão Série A",
  home_team: `Time Casa ${i + 1}`,
  away_team: `Time Fora ${i + 1}`,
  date: "Hoje às 16:00",
}));

export const DEFAULT_SETTINGS: AppSettings = {
  pix_key: "3db60233-bf8c-4364-9513-f3ac32c5b9ab",
  betting_blocked: false,
  ticket_price: 2.0,
  jackpot_prize: 1000.0,
};

export const MASTER_ADMIN: User = {
  id: 'master-01',
  name: 'Admin Master',
  username: 'admin',
  password: 'admin123',
  role: UserRole.ADMIN,
  balance: 0,
  created_at: Date.now()
};
