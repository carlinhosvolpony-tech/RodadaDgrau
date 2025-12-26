
import React, { useState } from 'react';
import { User, Match, Ticket, AppSettings, UserRole, BalanceRequest } from '../types';
import { supabase } from '../supabaseClient';

interface AdminDashboardProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  matches: Match[];
  setMatches: React.Dispatch<React.SetStateAction<Match[]>>;
  tickets: Ticket[];
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
  balanceRequests: BalanceRequest[];
  setBalanceRequests: React.Dispatch<React.SetStateAction<BalanceRequest[]>>;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  currentUser: User;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  users, matches, tickets, balanceRequests, settings, currentUser 
}) => {
  const [tab, setTab] = useState<'MATCHES' | 'USERS' | 'TICKETS' | 'FINANCE' | 'SETTINGS' | 'RAFFLE'>('MATCHES');
  const [raffleWinner, setRaffleWinner] = useState<Ticket | null>(null);
  const [isRaffling, setIsRaffling] = useState(false);

  const handleUpdateMatch = async (id: string, field: keyof Match, value: string) => {
    await supabase.from('matches').update({ [field]: value }).eq('id', id);
  };

  const handleActionTicket = async (id: string, status: Ticket['status']) => {
    await supabase.from('tickets').update({ status }).eq('id', id);
  };

  const handleToggleBetting = async () => {
    await supabase.from('app_settings').update({ betting_blocked: !settings.betting_blocked }).eq('id', 1);
  };

  const handlePerformRaffle = () => {
    const eligible = tickets.filter(t => t.status === 'VALIDATED' || t.status === 'WON');
    if (eligible.length === 0) return alert("Sem bilhetes pagos!");
    
    setIsRaffling(true);
    setTimeout(() => {
      const winner = eligible[Math.floor(Math.random() * eligible.length)];
      setRaffleWinner(winner);
      setIsRaffling(false);
    }, 2000);
  };

  const handleAdjustBalance = async (userId: string, type: 'ADD' | 'REMOVE') => {
    const amount = parseFloat(prompt("Valor:") || '0');
    if (isNaN(amount) || amount <= 0) return;
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const newBalance = type === 'ADD' ? user.balance + amount : user.balance - amount;
    await supabase.from('users').update({ balance: newBalance }).eq('id', userId);
  };

  return (
    <div className="max-w-6xl mx-auto glass p-6 rounded-3xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h2 className="text-2xl font-black uppercase italic text-white">ADMIN <span className="text-emerald-500">CONTROL</span></h2>
        <div className="flex gap-2 bg-black/50 p-1 rounded-xl overflow-x-auto border border-emerald-500/10">
          {['MATCHES', 'USERS', 'FINANCE', 'TICKETS', 'RAFFLE', 'SETTINGS'].map((t) => (
            <button key={t} onClick={() => setTab(t as any)} className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${tab === t ? 'bg-emerald-500 text-black' : 'text-emerald-500/60'}`}>{t}</button>
          ))}
        </div>
      </div>

      {tab === 'MATCHES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matches.map((m) => (
            <div key={m.id} className="bg-black/60 p-4 rounded-2xl border border-emerald-500/10 space-y-3">
              <input value={m.league} onChange={(e) => handleUpdateMatch(m.id, 'league', e.target.value)} className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-1 text-xs text-emerald-400 outline-none" placeholder="Liga"/>
              <input value={m.home_team} onChange={(e) => handleUpdateMatch(m.id, 'home_team', e.target.value)} className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-1 font-bold text-white outline-none" placeholder="Time Casa"/>
              <div className="text-center text-[10px] font-black opacity-30 italic text-emerald-500">VS</div>
              <input value={m.away_team} onChange={(e) => handleUpdateMatch(m.id, 'away_team', e.target.value)} className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-1 font-bold text-white outline-none" placeholder="Time Fora"/>
            </div>
          ))}
        </div>
      )}

      {tab === 'SETTINGS' && (
        <div className="max-w-xl space-y-8">
          <div className="bg-black/60 p-6 rounded-3xl border border-emerald-500/10">
            <h4 className="text-xs font-black uppercase text-emerald-400 mb-4 tracking-widest">Painel de Bloqueio</h4>
            <button onClick={handleToggleBetting} className={`w-full py-3 rounded-xl font-black uppercase text-xs transition-all ${settings.betting_blocked ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/50'}`}>
              {settings.betting_blocked ? '🔓 LIBERAR APOSTAS' : '🔒 BLOQUEAR APOSTAS'}
            </button>
          </div>
        </div>
      )}
      
      {tab === 'USERS' && (
         <div className="space-y-4">
            {users.map(u => (
               <div key={u.id} className="glass p-4 rounded-xl flex justify-between items-center">
                  <div>
                    <span className="text-white font-bold">{u.name} (@{u.username})</span>
                    <span className="block text-[10px] text-emerald-500 uppercase font-black">{u.role}</span>
                  </div>
                  <div className="flex gap-2">
                     <button onClick={() => handleAdjustBalance(u.id, 'ADD')} className="bg-emerald-500 text-black px-3 py-1 rounded-lg font-black text-xs">+ SALDO</button>
                  </div>
               </div>
            ))}
         </div>
      )}
    </div>
  );
};

export default AdminDashboard;
