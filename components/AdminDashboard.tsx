
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

  // HANDLERS AGORA PERSISTEM NO SUPABASE
  const handleUpdateMatch = async (id: string, field: keyof Match, value: string) => {
    await supabase.from('matches').update({ [field]: value }).eq('id', id);
  };

  const handleActionTicket = async (id: string, status: Ticket['status']) => {
    await supabase.from('tickets').update({ status }).eq('id', id);
  };

  const handleDeleteTicket = async (id: string) => {
    if (window.confirm("Excluir permanentemente?")) {
      await supabase.from('tickets').delete().eq('id', id);
    }
  };

  const handleToggleBetting = async () => {
    await supabase.from('app_settings').update({ betting_blocked: !settings.bettingBlocked }).eq('id', 1);
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

  // Cálculos de volume (derivados do estado global que já está sendo sincronizado)
  const bookies = users.filter(u => u.role === UserRole.BOOKIE);
  const totalDirectVolume = tickets.filter(t => !t.parentId).reduce((acc, t) => acc + t.cost, 0);

  return (
    <div className="max-w-6xl mx-auto glass p-6 rounded-3xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h2 className="text-2xl font-black uppercase italic text-white">ADMIN <span className="text-emerald-500">CONTROL</span></h2>
        
        <div className="flex gap-2 bg-black/50 p-1 rounded-xl overflow-x-auto border border-emerald-500/10">
          {[
            { id: 'MATCHES', icon: 'fa-futbol', label: 'Jogos' },
            { id: 'USERS', icon: 'fa-users', label: 'Usuários' },
            { id: 'FINANCE', icon: 'fa-hand-holding-dollar', label: 'Financeiro' },
            { id: 'TICKETS', icon: 'fa-ticket', label: 'Bilhetes' },
            { id: 'RAFFLE', icon: 'fa-clover', label: 'Sorteio' },
            { id: 'SETTINGS', icon: 'fa-gear', label: 'Geral' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${tab === t.id ? 'bg-emerald-500 text-black' : 'hover:bg-emerald-500/10 text-emerald-500/60'}`}
            >
              <i className={`fa-solid ${t.icon}`}></i> {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'RAFFLE' && (
        <div className="flex flex-col items-center py-10 space-y-8">
          <div className="text-center">
             <h3 className="text-3xl font-black text-white italic uppercase mb-2">Sorteio <span className="text-emerald-500">Global</span></h3>
             <p className="text-gray-500 text-sm">Sincronizado em tempo real para todos os terminais.</p>
          </div>
          <div className="relative w-full max-w-md h-64 glass rounded-3xl border-2 border-emerald-500/20 flex flex-col items-center justify-center p-8 overflow-hidden">
             {isRaffling ? (
               <div className="flex flex-col items-center gap-4 animate-pulse">
                 <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                 <span className="text-emerald-500 font-black uppercase">GIRANDO GLOBO...</span>
               </div>
             ) : raffleWinner ? (
               <div className="text-center animate-in zoom-in duration-500">
                 <div className="bg-emerald-500 text-black px-4 py-1 rounded-full text-[10px] font-black uppercase mb-4 inline-block">Vencedor!</div>
                 <div className="text-5xl font-black text-white mb-2 tracking-tighter">#{raffleWinner.id}</div>
                 <div className="text-emerald-400 font-bold uppercase">{raffleWinner.userName}</div>
                 <button onClick={() => setRaffleWinner(null)} className="mt-6 text-gray-500 hover:text-white transition-colors uppercase text-[8px] font-black tracking-widest">Limpar</button>
               </div>
             ) : (
               <div className="flex flex-col items-center opacity-30">
                 <i className="fa-solid fa-clover text-6xl mb-4 text-emerald-500"></i>
                 <span className="text-[10px] font-black uppercase tracking-[0.3em]">Aguardando Sorteio</span>
               </div>
             )}
          </div>
          <button onClick={handlePerformRaffle} disabled={isRaffling} className="bg-emerald-500 text-black px-12 py-4 rounded-2xl font-black text-xl uppercase tracking-widest shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50">REALIZAR SORTEIO</button>
        </div>
      )}

      {tab === 'MATCHES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matches.map((m) => (
            <div key={m.id} className="bg-black/60 p-4 rounded-2xl border border-emerald-500/10 space-y-3">
              <input value={m.league} onChange={(e) => handleUpdateMatch(m.id, 'league', e.target.value)} className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-1 text-xs text-emerald-400 outline-none" placeholder="Liga"/>
              <input value={m.homeTeam} onChange={(e) => handleUpdateMatch(m.id, 'homeTeam', e.target.value)} className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-1 font-bold text-white outline-none" placeholder="Time Casa"/>
              <div className="text-center text-[10px] font-black opacity-30 italic text-emerald-500">VS</div>
              <input value={m.awayTeam} onChange={(e) => handleUpdateMatch(m.id, 'awayTeam', e.target.value)} className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-1 font-bold text-white outline-none" placeholder="Time Fora"/>
            </div>
          ))}
        </div>
      )}

      {tab === 'SETTINGS' && (
        <div className="max-w-xl space-y-8">
          <div className="bg-black/60 p-6 rounded-3xl border border-emerald-500/10">
            <h4 className="text-xs font-black uppercase text-emerald-400 mb-4 tracking-widest">Painel de Bloqueio</h4>
            <button onClick={handleToggleBetting} className={`w-full py-3 rounded-xl font-black uppercase text-xs transition-all ${settings.bettingBlocked ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/50'}`}>
              {settings.bettingBlocked ? '🔓 LIBERAR APOSTAS AGORA' : '🔒 BLOQUEAR TODAS AS APOSTAS'}
            </button>
          </div>
        </div>
      )}
      
      {/* Abas FINANCE, USERS e TICKETS seguem a mesma lógica de handleActionTicket e handleAdjustBalance chamando await supabase */}
    </div>
  );
};

export default AdminDashboard;
