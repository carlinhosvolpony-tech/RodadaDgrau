
import { Match, AppSettings, UserRole } from "./types";

export const INITIAL_MATCHES: Match[] = Array.from({ length: 12 }, (_, i) => ({
  id: `match-${i + 1}`,
  league: "Brasileirão Série A",
  homeTeam: `Time Casa ${i + 1}`,
  awayTeam: `Time Fora ${i + 1}`,
  date: "Hoje às 16:00",
}));

export const DEFAULT_SETTINGS: AppSettings = {
  pixKey: "3db60233-bf8c-4364-9513-f3ac32c5b9ab",
  bettingBlocked: false,
  ticketPrice: 2.0,
  jackpotPrize: 1000.0,
};
