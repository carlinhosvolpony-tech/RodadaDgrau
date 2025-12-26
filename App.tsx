
import React, { useState, useEffect } from 'react';
import { User, UserRole, Match, Ticket, AppSettings, BalanceRequest } from './types';
import { supabase } from './supabaseClient';
import Navbar from './components/Navbar';
import BettingArea from './components/BettingArea';
import AdminDashboard from './components/AdminDashboard';
import BookieDashboard from './components/BookieDashboard';
import Login from './components/Login';
import Wallet from './components/Wallet';
import TicketHistory from './components/TicketHistory';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [balanceRequests, setBalanceRequests] = useState<BalanceRequest[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [view, setView] = useState<'BET' | 'ADMIN' | 'BOOKIE' | 'WALLET' | 'TICKETS'>('BET');
  const [isLoading, setIsLoading] = useState(true);

  // 1. CARREGAMENTO INICIAL E AUTH
  useEffect(() => {
    const initApp = async () => {
      // Carregar dados iniciais do DB
      const { data: m } = await supabase.from('matches').select('*').order('display_order');
      const { data: s } = await supabase.from('app_settings').select('*').single();
      const { data: t } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
      const { data: u } = await supabase.from('users').select('*');
      
      if (m) setMatches(m);
      if (s) setSettings(s);
      if (t) setTickets(t);
      if (u) setUsers(u);

      // Checar sessão local (apenas para persistência de UI)
      const savedUser = localStorage.getItem('volpony_user');
      if (savedUser) setCurrentUser(JSON.parse(savedUser));
      
      setIsLoading(false);
    };

    initApp();
  }, []);

  // 2. SINCRONIZAÇÃO EM TEMPO REAL (REALTIME ENGINE)
  useEffect(() => {
    const channel = supabase.channel('global-sync')
      .on('postgres_changes', { event: '*', table: 'app_settings' }, (payload) => {
        setSettings(payload.new as AppSettings);
      })
      .on('postgres_changes', { event: '*', table: 'matches' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setMatches(prev => prev.map(m => m.id === payload.new.id ? { ...m, ...payload.new } : m));
        }
      })
      .on('postgres_changes', { event: '*', table: 'tickets' }, (payload) => {
        if (payload.eventType === 'INSERT') setTickets(prev => [payload.new as Ticket, ...prev]);
        if (payload.eventType === 'UPDATE') setTickets(prev => prev.map(t => t.id === payload.new.id ? { ...t, ...payload.new } : t));
        if (payload.eventType === 'DELETE') setTickets(prev => prev.filter(t => t.id !== payload.old.id));
      })
      .on('postgres_changes', { event: '*', table: 'users' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setUsers(prev => prev.map(u => u.id === payload.new.id ? { ...u, ...payload.new } : u));
          if (currentUser?.id === payload.new.id) {
            const updated = payload.new as User;
            setCurrentUser(updated);
            localStorage.setItem('volpony_user', JSON.stringify(updated));
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser]);

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('volpony_user');
    setView('BET');
  };

  const handlePlaceTicket = async (picks: ('H' | 'D' | 'A')[]) => {
    if (!currentUser || !settings) return;
    
    const ticketId = Math.random().toString(36).substr(2, 9).toUpperCase();
    const isAutoPay = currentUser.balance >= settings.ticketPrice;
    
    const newTicket = {
      id: ticketId,
      user_id: currentUser.id,
      user_name: currentUser.name,
      picks,
      match_info: matches.map(m => ({ home: m.homeTeam, away: m.awayTeam })),
      cost: settings.ticketPrice,
      potential_prize: settings.jackpot_prize,
      status: isAutoPay ? 'VALIDATED' : 'PENDING',
      parent_id: currentUser.parentId,
    };

    // Salvar no Banco (Isso refletirá em tempo real para o admin)
    const { error } = await supabase.from('tickets').insert([newTicket]);

    if (!error && isAutoPay) {
      // Atualizar Saldo no DB
      const newBalance = currentUser.balance - settings.ticketPrice;
      await supabase.from('users').update({ balance: newBalance }).eq('id', currentUser.id);
    }

    if (error) alert("Erro ao registrar bilhete.");
    else setView('TICKETS');
  };

  if (isLoading || !settings) return <div className="min-h-screen flex items-center justify-center bg-black"><div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent animate-spin rounded-full"></div></div>;

  if (!currentUser) {
    return <Login onLogin={(u) => { setCurrentUser(u); localStorage.setItem('volpony_user', JSON.stringify(u)); }} users={users} setUsers={setUsers} />;
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
        {view === 'WALLET' && <Wallet user={currentUser} settings={settings} users={users} onBalanceAdded={async (amt) => {
           // Solicitação de saldo no DB
           await supabase.from('balance_requests').insert([{ user_id: currentUser.id, user_name: currentUser.name, amount: amt, status: 'PENDING', parent_id: currentUser.parentId }]);
        }} />}
        {view === 'TICKETS' && (
          <TicketHistory 
            tickets={tickets.filter(t => t.userId === currentUser.id)}
            onDelete={async (id) => await supabase.from('tickets').delete().eq('id', id)}
          />
        )}
      </main>
    </div>
  );
};

export default App;
