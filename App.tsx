
import React, { useState, useEffect } from 'react';
import { User, UserRole, Match, Ticket, AppSettings, BalanceRequest } from './types';
import { INITIAL_MATCHES, DEFAULT_SETTINGS } from './constants';
import Navbar from './components/Navbar';
import BettingArea from './components/BettingArea';
import AdminDashboard from './components/AdminDashboard';
import BookieDashboard from './components/BookieDashboard';
import Login from './components/Login';
import Wallet from './components/Wallet';
import TicketHistory from './components/TicketHistory';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('volpony_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('volpony_users');
    if (saved) return JSON.parse(saved);
    const admin: User = {
      id: 'admin-1',
      name: 'Administrador Geral',
      username: 'admin',
      password: 'admin',
      role: UserRole.ADMIN,
      balance: 0,
      createdAt: Date.now()
    };
    return [admin];
  });

  const [matches, setMatches] = useState<Match[]>(() => {
    const saved = localStorage.getItem('volpony_matches');
    return saved ? JSON.parse(saved) : INITIAL_MATCHES;
  });

  const [tickets, setTickets] = useState<Ticket[]>(() => {
    const saved = localStorage.getItem('volpony_tickets');
    return saved ? JSON.parse(saved) : [];
  });

  const [balanceRequests, setBalanceRequests] = useState<BalanceRequest[]>(() => {
    const saved = localStorage.getItem('volpony_balance_reqs');
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('volpony_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [view, setView] = useState<'BET' | 'ADMIN' | 'BOOKIE' | 'WALLET' | 'TICKETS'>('BET');

  useEffect(() => {
    localStorage.setItem('volpony_user', JSON.stringify(currentUser));
    localStorage.setItem('volpony_users', JSON.stringify(users));
    localStorage.setItem('volpony_matches', JSON.stringify(matches));
    localStorage.setItem('volpony_tickets', JSON.stringify(tickets));
    localStorage.setItem('volpony_balance_reqs', JSON.stringify(balanceRequests));
    localStorage.setItem('volpony_settings', JSON.stringify(settings));
  }, [currentUser, users, matches, tickets, balanceRequests, settings]);

  const handleLogin = (user: User) => setCurrentUser(user);
  const handleLogout = () => {
    setCurrentUser(null);
    setView('BET');
  };

  const handlePlaceTicket = (picks: ('H' | 'D' | 'A')[]) => {
    if (!currentUser) return;
    
    let ticketStatus: Ticket['status'] = 'PENDING';
    let updatedBalance = currentUser.balance;

    if (currentUser.balance >= settings.ticketPrice) {
      updatedBalance -= settings.ticketPrice;
      ticketStatus = 'VALIDATED';
    }

    const newTicket: Ticket = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      userId: currentUser.id,
      userName: currentUser.name,
      picks,
      matchInfo: matches.map(m => ({ home: m.homeTeam, away: m.awayTeam })),
      cost: settings.ticketPrice,
      potentialPrize: settings.jackpotPrize,
      status: ticketStatus,
      date: Date.now(),
      parentId: currentUser.parentId
    };

    setTickets(prev => [newTicket, ...prev]);
    
    const updatedUser = { ...currentUser, balance: updatedBalance };
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    
    setView('TICKETS');
    if (ticketStatus === 'VALIDATED') alert("Bilhete Validado automaticamente!");
    else alert("Bilhete gerado! Pague ao seu cambista para validar.");
  };

  const handleRequestBalance = (amount: number) => {
    if (!currentUser) return;
    const newReq: BalanceRequest = {
      id: Math.random().toString(36).substr(2, 5).toUpperCase(),
      userId: currentUser.id,
      userName: currentUser.name,
      amount,
      status: 'PENDING',
      date: Date.now(),
      parentId: currentUser.parentId
    };
    setBalanceRequests(prev => [newReq, ...prev]);
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} users={users} setUsers={setUsers} />;
  }

  return (
    <div className="stadium-bg min-h-screen">
      <Navbar user={currentUser} onLogout={handleLogout} setView={setView} activeView={view} />
      <main className="container mx-auto px-4 py-8">
        {view === 'BET' && (
          <BettingArea 
            matches={matches} 
            settings={settings} 
            onPlaceTicket={handlePlaceTicket} 
            userBalance={currentUser.balance}
          />
        )}
        {view === 'ADMIN' && currentUser.role === UserRole.ADMIN && (
          <AdminDashboard 
            users={users} setUsers={setUsers}
            matches={matches} setMatches={setMatches}
            tickets={tickets} setTickets={setTickets}
            balanceRequests={balanceRequests} setBalanceRequests={setBalanceRequests}
            settings={settings} setSettings={setSettings}
            currentUser={currentUser} setCurrentUser={setCurrentUser}
          />
        )}
        {view === 'BOOKIE' && currentUser.role === UserRole.BOOKIE && (
          <BookieDashboard 
            currentUser={currentUser} setCurrentUser={setCurrentUser} users={users} setUsers={setUsers}
            tickets={tickets} setTickets={setTickets}
            balanceRequests={balanceRequests} setBalanceRequests={setBalanceRequests}
            settings={settings}
          />
        )}
        {view === 'WALLET' && <Wallet user={currentUser} settings={settings} users={users} onBalanceAdded={handleRequestBalance} />}
        {view === 'TICKETS' && (
          <TicketHistory 
            tickets={tickets.filter(t => t.userId === currentUser.id)}
            onDelete={(id) => setTickets(prev => prev.filter(t => t.id !== id))}
          />
        )}
      </main>
    </div>
  );
};

export default App;
