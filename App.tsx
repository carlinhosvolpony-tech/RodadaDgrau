
import React, { useState, useEffect } from 'react';
import { User, UserRole, Match, Ticket, AppSettings, BalanceRequest } from './types';
import { supabase } from './supabaseClient';
import { INITIAL_MATCHES, DEFAULT_SETTINGS } from './constants';
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
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [view, setView] = useState<'BET' | 'ADMIN' | 'BOOKIE' | 'WALLET' | 'TICKETS'>('BET');
  const [isLoading, setIsLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // 1. CARREGAMENTO INICIAL RESILIENTE
  useEffect(() => {
    const initApp = async () => {
      try {
        // Tentar carregar configurações
        const { data: s, error: sError } = await supabase.from('app_settings').select('*').single();
        if (s) setSettings(s);
        else if (sError) console.warn("Usando configurações padrão (DB offline ou vazio)");

        // Tentar carregar partidas
        const { data: m, error: mError } = await supabase.from('matches').select('*').order('display_order');
        if (m && m.length > 0) setMatches(m);
        else setMatches(INITIAL_MATCHES);

        // Tentar carregar tickets e usuários
        const { data: t } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
        const { data: u } = await supabase.from('users').select('*');
        
        if (t) setTickets(t);
        if (u) setUsers(u);

        // Checar sessão local
        const savedUser = localStorage.getItem('volpony_user');
        if (savedUser) setCurrentUser(JSON.parse(savedUser));
        
      } catch (err) {
        console.error("Erro na conexão Supabase:", err);
        setConnectionError("Modo Offline: Verifique as chaves do Supabase.");
        // Fallbacks já definidos nos states iniciais
      } finally {
        setIsLoading(false);
      }
    };

    initApp();
  }, []);

  // 2. SINCRONIZAÇÃO EM TEMPO REAL
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase.channel('global-sync')
      .on('postgres_changes', { event: '*', table: 'app_settings' }, (payload) => {
        if (payload.new) setSettings(payload.new as AppSettings);
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
      potential_prize: settings.jackpotPrize,
      status: isAutoPay ? 'VALIDATED' : 'PENDING',
      parent_id: currentUser.parentId,
    };

    // Tentar persistir no DB, caso falhe, avisa o usuário mas mantém local
    const { error } = await supabase.from('tickets').insert([newTicket]);

    if (!error && isAutoPay) {
      const newBalance = currentUser.balance - settings.ticketPrice;
      await supabase.from('users').update({ balance: newBalance }).eq('id', currentUser.id);
    }

    if (error) {
        console.error("Erro no DB:", error);
        alert("Erro de conexão. Verifique se o banco de dados está configurado corretamente.");
    } else {
        setView('TICKETS');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent animate-spin rounded-full mb-4"></div>
        <h2 className="text-emerald-500 font-black uppercase tracking-widest text-xs animate-pulse">Entrando no Estádio...</h2>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={(u) => { setCurrentUser(u); localStorage.setItem('volpony_user', JSON.stringify(u)); }} users={users} setUsers={setUsers} />;
  }

  return (
    <div className="stadium-bg min-h-screen">
      <Navbar user={currentUser} onLogout={handleLogout} setView={setView} activeView={view} />
      
      {connectionError && (
          <div className="bg-amber-500/20 text-amber-500 text-[10px] font-black uppercase py-1 text-center border-b border-amber-500/10">
              <i className="fa-solid fa-triangle-exclamation mr-2"></i> {connectionError}
          </div>
      )}

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
