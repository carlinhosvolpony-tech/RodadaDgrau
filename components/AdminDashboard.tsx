
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
    const { error } = await supabase.from('matches').update({ [field]: value }).eq('id', id);
    if (error) alert("Erro ao atualizar partida: " + error.message);
  };

  const handleActionTicket = async (id: string, status: Ticket['status']) => {
    const { error } = await supabase.from('tickets').update({ status }).eq('id', id);
    if (error) alert("Erro ao atualizar bilhete: " + error.message);
  };

  const handleToggleBetting = async () => {
    const { error } = await supabase.from('app_settings').update({ betting_blocked: !settings.betting_blocked }).eq('id', 1);
    if (error) alert("Erro ao alterar status de apostas: " + error.message);
  };

  const handleUpdateSettings = async (field: keyof AppSettings, value: any) => {
    const { error } = await supabase.from('app_settings').update({ [field]: value }).eq('id', 1);
    if (error) alert("Erro ao atualizar configurações: " + error.message);
  };

  const handlePerformRaffle = () => {
    const eligible = tickets.filter(t => t.status === 'VALIDATED' || t.status === 'WON');
    if (eligible.length === 0) return alert("Sem bilhetes pagos ou validados para sortear!");
    
    setIsRaffling(true);
    setRaffleWinner(null);
    
    setTimeout(() => {
      const winner = eligible[Math.floor(Math.random() * eligible.length)];
      setRaffleWinner(winner);
      setIsRaffling(false);
    }, 2500);
  };

  const handleAdjustBalance = async (userId: string, type: 'ADD' | 'REMOVE') => {
    const amountStr = prompt(`Valor para ${type === 'ADD' ? 'ADICIONAR' : 'REMOVER'}:`);
    const amount = parseFloat(amountStr || '0');
    if (isNaN(amount) || amount <= 0) return;
    
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    const newBalance = type === 'ADD' ? user.balance + amount : user.balance - amount;
    const { error } = await supabase.from('users').update({ balance: newBalance }).eq('id', userId);
    if (error) alert("Erro ao ajustar saldo: " + error.message);
  };

  const handleActionRequest = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    const req = balanceRequests.find(r => r.id === id);
    if (!req) return;

    if (status === 'APPROVED') {
      const user = users.find(u => u.id === req.user_id);
      if (user) {
        await supabase.from('users').update({ balance: user.balance + req.amount }).eq('id', user.id);
      }
    }
    const { error } = await supabase.from('balance_requests').update({ status }).eq('id', id);
    if (error) alert("Erro ao processar pedido: " + error.message);
  };

  return (
    <div className="max-w-6xl mx-auto glass p-6 rounded-3xl border border-emerald-500/20">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h2 className="text-2xl font-black uppercase italic text-white flex items-center gap-3">
          <i className="fa-solid fa-screwdriver-wrench text-emerald-500"></i>
          PAINEL DE <span className="text-emerald-500">CONTROLE</span>
        </h2>
        <div className="flex gap-1 bg-black/50 p-1 rounded-xl overflow-x-auto border border-emerald-500/10 max-w-full">
          {[
            { id: 'MATCHES', icon: 'fa-futbol', label: 'Jogos' },
            { id: 'USERS', icon: 'fa-users', label: 'Usuários' },
            { id: 'FINANCE', icon: 'fa-money-bill-transfer', label: 'Financeiro' },
            { id: 'TICKETS', icon: 'fa-ticket', label: 'Bilhetes' },
            { id: 'RAFFLE', icon: 'fa-clover', label: 'Sorteio' },
            { id: 'SETTINGS', icon: 'fa-gear', label: 'Ajustes' },
          ].map((item) => (
            <button 
              key={item.id} 
              onClick={() => setTab(item.id as any)} 
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all whitespace-nowrap ${tab === item.id ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-emerald-500/60 hover:bg-white/5'}`}
            >
              <i className={`fa-solid ${item.icon}`}></i> {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ABA DE JOGOS */}
      {tab === 'MATCHES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-300">
          {matches.map((m) => (
            <div key={m.id} className="bg-black/60 p-4 rounded-2xl border border-emerald-500/10 space-y-3 relative group">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] font-black text-emerald-500/40 uppercase">#{m.id}</span>
                <input 
                  value={m.date} 
                  onChange={(e) => handleUpdateMatch(m.id, 'date', e.target.value)}
                  className="bg-transparent text-[10px] text-gray-500 font-bold text-right outline-none border-b border-transparent focus:border-emerald-500/30"
                />
              </div>
              <input 
                value={m.league} 
                onChange={(e) => handleUpdateMatch(m.id, 'league', e.target.value)} 
                className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-1.5 text-xs text-emerald-400 outline-none focus:border-emerald-500" 
                placeholder="Liga/Campeonato"
              />
              <div className="space-y-2">
                <input 
                  value={m.home_team} 
                  onChange={(e) => handleUpdateMatch(m.id, 'home_team', e.target.value)} 
                  className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-2 font-bold text-white outline-none focus:border-emerald-500" 
                  placeholder="Time Casa"
                />
                <div className="text-center text-[10px] font-black opacity-30 italic text-emerald-500">VERSUS</div>
                <input 
                  value={m.away_team} 
                  onChange={(e) => handleUpdateMatch(m.id, 'away_team', e.target.value)} 
                  className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-2 font-bold text-white outline-none focus:border-emerald-500" 
                  placeholder="Time Fora"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ABA DE USUÁRIOS */}
      {tab === 'USERS' && (
         <div className="space-y-4 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {users.map(u => (
                 <div key={u.id} className="bg-black/40 border border-emerald-500/10 p-5 rounded-2xl flex justify-between items-center hover:border-emerald-500/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg ${u.role === UserRole.ADMIN ? 'bg-red-500/20 text-red-500' : u.role === UserRole.BOOKIE ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-white font-bold text-sm">{u.name} <span className="text-gray-500 text-xs font-normal">(@{u.username})</span></div>
                        <div className="flex gap-2 mt-1">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${u.role === UserRole.ADMIN ? 'bg-red-500/20 text-red-500' : u.role === UserRole.BOOKIE ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'}`}>{u.role}</span>
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-white/5 text-gray-400">Saldo: R$ {u.balance.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => handleAdjustBalance(u.id, 'ADD')} className="bg-emerald-500 text-black w-8 h-8 rounded-lg flex items-center justify-center hover:scale-110 transition-transform"><i className="fa-solid fa-plus"></i></button>
                       <button onClick={() => handleAdjustBalance(u.id, 'REMOVE')} className="bg-red-500 text-white w-8 h-8 rounded-lg flex items-center justify-center hover:scale-110 transition-transform"><i className="fa-solid fa-minus"></i></button>
                    </div>
                 </div>
              ))}
            </div>
         </div>
      )}

      {/* ABA DE FINANCEIRO (PEDIDOS DE SALDO) */}
      {tab === 'FINANCE' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl mb-6">
            <h3 className="text-emerald-500 font-black uppercase text-xs mb-1">Resumo Financeiro</h3>
            <p className="text-gray-400 text-[10px]">Gerencie solicitações de depósito de usuários e cambistas.</p>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {balanceRequests.filter(r => r.status === 'PENDING').length === 0 ? (
              <div className="text-center py-10 text-gray-500 italic text-sm">Nenhum pedido pendente.</div>
            ) : (
              balanceRequests.filter(r => r.status === 'PENDING').map(req => (
                <div key={req.id} className="bg-black/60 p-4 rounded-2xl border border-emerald-500/10 flex justify-between items-center">
                  <div>
                    <span className="text-white font-bold">{req.user_name}</span>
                    <span className="block text-emerald-400 font-black text-lg">R$ {req.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => handleActionRequest(req.id, 'APPROVED')} className="bg-emerald-500 text-black px-4 py-2 rounded-xl font-black text-xs uppercase hover:bg-emerald-400">Aprovar</button>
                    <button onClick={() => handleActionRequest(req.id, 'REJECTED')} className="bg-red-500/20 text-red-500 border border-red-500/50 px-4 py-2 rounded-xl font-black text-xs uppercase hover:bg-red-500 hover:text-white">Recusar</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ABA DE TICKETS (BILHETES) */}
      {tab === 'TICKETS' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="text-emerald-500/50 text-[10px] font-black uppercase tracking-widest">
                  <th className="px-4 py-2">ID</th>
                  <th className="px-4 py-2">Usuário</th>
                  <th className="px-4 py-2">Prêmio</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t.id} className="bg-black/40 hover:bg-emerald-950/20 transition-all group">
                    <td className="px-4 py-3 text-xs font-mono text-emerald-500/80 rounded-l-2xl">#{t.id}</td>
                    <td className="px-4 py-3 text-xs font-bold text-white">{t.user_name}</td>
                    <td className="px-4 py-3 text-xs font-black text-emerald-400">R$ {t.potential_prize.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                        t.status === 'VALIDATED' ? 'bg-green-500/20 text-green-500' : 
                        t.status === 'WON' ? 'bg-yellow-400 text-black' : 
                        t.status === 'LOST' ? 'bg-red-500/20 text-red-500' : 'bg-gray-500/20 text-gray-500'
                      }`}>{t.status}</span>
                    </td>
                    <td className="px-4 py-3 rounded-r-2xl">
                      <div className="flex gap-2">
                        {t.status === 'PENDING' && (
                          <button onClick={() => handleActionTicket(t.id, 'VALIDATED')} className="bg-emerald-500 text-black px-2 py-1 rounded text-[8px] font-black uppercase">Validar</button>
                        )}
                        <button onClick={() => handleActionTicket(t.id, 'WON')} className="bg-yellow-400 text-black px-2 py-1 rounded text-[8px] font-black uppercase">Venceu</button>
                        <button onClick={() => handleActionTicket(t.id, 'LOST')} className="bg-red-500 text-white px-2 py-1 rounded text-[8px] font-black uppercase">Perdeu</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA DE SORTEIO */}
      {tab === 'RAFFLE' && (
        <div className="flex flex-col items-center py-10 animate-in zoom-in duration-500">
           <div className="w-48 h-48 bg-emerald-500/10 rounded-full border-4 border-dashed border-emerald-500/30 flex items-center justify-center mb-8 relative">
              <i className={`fa-solid fa-clover text-6xl text-emerald-500 ${isRaffling ? 'animate-spin' : ''}`}></i>
              {isRaffling && <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping"></div>}
           </div>
           
           <h3 className="text-2xl font-black text-white uppercase italic mb-2">Sorteio de <span className="text-emerald-500">Prêmios</span></h3>
           <p className="text-gray-500 text-center max-w-sm mb-8 text-sm">Selecione um bilhete aleatório entre os bilhetes pagos e validados do sistema.</p>

           <button 
             disabled={isRaffling}
             onClick={handlePerformRaffle}
             className="bg-emerald-500 text-black px-10 py-4 rounded-2xl font-black text-lg uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50"
           >
             {isRaffling ? 'SORTEANDO...' : 'REALIZAR SORTEIO'}
           </button>

           {raffleWinner && (
             <div className="mt-12 p-8 bg-emerald-500 text-black rounded-3xl text-center shadow-[0_0_50px_rgba(16,185,129,0.4)] animate-in slide-in-from-bottom-10">
                <div className="text-[10px] font-black uppercase opacity-60">Ganhador do Sorteio!</div>
                <div className="text-4xl font-black mb-2 uppercase">{raffleWinner.user_name}</div>
                <div className="text-xl font-mono font-bold">BILHETE: #{raffleWinner.id}</div>
                <button 
                  onClick={() => setRaffleWinner(null)}
                  className="mt-4 text-[10px] font-black uppercase underline decoration-black/20"
                >
                  Fechar Resultado
                </button>
             </div>
           )}
        </div>
      )}

      {/* ABA DE AJUSTES */}
      {tab === 'SETTINGS' && (
        <div className="max-w-xl mx-auto space-y-8 animate-in fade-in duration-300">
          <div className="bg-black/60 p-6 rounded-3xl border border-emerald-500/10">
            <h4 className="text-xs font-black uppercase text-emerald-400 mb-4 tracking-widest flex items-center gap-2">
              <i className="fa-solid fa-power-off"></i> Status das Apostas
            </h4>
            <button 
              onClick={handleToggleBetting} 
              className={`w-full py-4 rounded-xl font-black uppercase text-sm transition-all border-2 ${settings.betting_blocked ? 'bg-red-500/20 text-red-500 border-red-500/50' : 'bg-emerald-500/20 text-emerald-500 border-emerald-500/50'}`}
            >
              {settings.betting_blocked ? '🔓 LIBERAR PARA APOSTAR' : '🔒 BLOQUEAR NOVAS APOSTAS'}
            </button>
            <p className="text-[10px] text-gray-600 mt-2 text-center uppercase font-bold">Dica: Bloqueie quando os jogos começarem.</p>
          </div>

          <div className="bg-black/60 p-6 rounded-3xl border border-emerald-500/10 space-y-4">
            <h4 className="text-xs font-black uppercase text-emerald-400 mb-2 tracking-widest flex items-center gap-2">
              <i className="fa-solid fa-sliders"></i> Parâmetros do Sistema
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-500 ml-1">Valor do Bilhete (R$)</label>
                <input 
                  type="number" 
                  defaultValue={settings.ticket_price}
                  onBlur={(e) => handleUpdateSettings('ticket_price', parseFloat(e.target.value))}
                  className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3 text-white font-black outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-gray-500 ml-1">Prêmio do Jackpot (R$)</label>
                <input 
                  type="number" 
                  defaultValue={settings.jackpot_prize}
                  onBlur={(e) => handleUpdateSettings('jackpot_prize', parseFloat(e.target.value))}
                  className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3 text-white font-black outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-gray-500 ml-1">Chave PIX Principal (Admin)</label>
                <input 
                  type="text" 
                  defaultValue={settings.pix_key}
                  onBlur={(e) => handleUpdateSettings('pix_key', e.target.value)}
                  className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3 text-white font-mono text-sm outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
