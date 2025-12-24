
import React, { useState } from 'react';
import { User, Match, Ticket, AppSettings, UserRole, BalanceRequest } from '../types';

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
  users, setUsers, matches, setMatches, tickets, setTickets, balanceRequests, setBalanceRequests, settings, setSettings, currentUser, setCurrentUser 
}) => {
  const [tab, setTab] = useState<'MATCHES' | 'USERS' | 'TICKETS' | 'FINANCE' | 'SETTINGS'>('MATCHES');
  const [newPassword, setNewPassword] = useState('');

  const handleUpdateMatch = (id: string, field: keyof Match, value: string) => {
    setMatches(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleActionTicket = (id: string, status: Ticket['status']) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  const handleActionRequest = (id: string, status: 'APPROVED' | 'REJECTED') => {
    const req = balanceRequests.find(r => r.id === id);
    if (!req) return;

    if (status === 'APPROVED') {
      setUsers(prev => prev.map(u => u.id === req.userId ? { ...u, balance: u.balance + req.amount } : u));
    }
    
    setBalanceRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    alert(status === 'APPROVED' ? "Crédito liberado!" : "Solicitação recusada.");
  };

  const handleAdjustBalance = (userId: string, type: 'ADD' | 'REMOVE') => {
    const actionLabel = type === 'ADD' ? 'adicionar' : 'remover';
    const amountStr = prompt(`Quanto de saldo deseja ${actionLabel}?`);
    const amount = parseFloat(amountStr || '0');
    
    if (isNaN(amount) || amount <= 0) {
      alert("Valor inválido");
      return;
    }

    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const newBalance = type === 'ADD' ? u.balance + amount : u.balance - amount;
        if (newBalance < 0 && type === 'REMOVE') {
            alert("O saldo não pode ficar negativo.");
            return u;
        }
        return { ...u, balance: newBalance };
      }
      return u;
    }));
    alert(`Saldo ajustado com sucesso.`);
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser.id) {
        alert("Você não pode excluir a si mesmo!");
        return;
    }
    if (window.confirm("Tem certeza que deseja excluir este usuário? Todos os dados vinculados serão mantidos no histórico, mas o acesso será removido.")) {
        setUsers(prev => prev.filter(u => u.id !== userId));
        alert("Usuário removido.");
    }
  };

  const handleRegisterUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const role = formData.get('role') as UserRole;
    const parentId = formData.get('parentId') as string;

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.get('name') as string,
      username: formData.get('username') as string,
      password: formData.get('password') as string,
      role,
      parentId: role === UserRole.CLIENT && parentId !== "none" ? parentId : undefined,
      balance: 0,
      createdAt: Date.now()
    };

    setUsers(prev => [...prev, newUser]);
    alert("Usuário criado!");
    e.currentTarget.reset();
  };

  const changeAdminPassword = () => {
    if (!newPassword) return;
    const updatedUser = { ...currentUser, password: newPassword };
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    setCurrentUser(updatedUser);
    setNewPassword('');
    alert("Senha alterada com sucesso!");
  };

  // Cálculos financeiros
  const bookies = users.filter(u => u.role === UserRole.BOOKIE);
  const directTickets = tickets.filter(t => !t.parentId);
  const totalDirectVolume = directTickets.reduce((acc, t) => acc + t.cost, 0);

  const settlementData = bookies.map(b => {
    const bTickets = tickets.filter(t => t.parentId === b.id);
    const total = bTickets.reduce((acc, t) => acc + t.cost, 0);
    const bClients = users.filter(u => u.parentId === b.id);
    const recargas = bClients.reduce((acc, c) => acc + (c.totalDepositsByBookie || 0), 0);
    const totalComRecargas = total + recargas;
    const comm = total * 0.20;
    return { ...b, total, recargas, totalComRecargas, comm, due: totalComRecargas - comm };
  });

  const totalAdminDue = settlementData.reduce((acc, b) => acc + b.due, 0) + totalDirectVolume;

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

      {tab === 'FINANCE' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass p-5 rounded-3xl border-l-4 border-l-emerald-500">
              <span className="text-[10px] text-gray-500 font-bold uppercase">A Receber Total</span>
              <div className="text-xl font-black text-emerald-400">R$ {totalAdminDue.toFixed(2)}</div>
            </div>
            <div className="glass p-5 rounded-3xl border-l-4 border-l-blue-500">
              <span className="text-[10px] text-gray-500 font-bold uppercase">Vendas Diretas</span>
              <div className="text-xl font-black text-white">R$ {totalDirectVolume.toFixed(2)}</div>
            </div>
          </div>

          <section>
            <h3 className="text-sm font-black text-emerald-400 uppercase mb-4 tracking-widest">Créditos Pendentes (Clientes Diretos)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {balanceRequests.filter(r => r.status === 'PENDING' && !r.parentId).map(r => (
                <div key={r.id} className="bg-black/60 p-4 rounded-2xl border border-emerald-500/10 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-white">{r.userName}</div>
                    <div className="text-xl font-black text-emerald-400">R$ {r.amount.toFixed(2)}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleActionRequest(r.id, 'APPROVED')} className="bg-emerald-600 p-2 rounded-lg hover:bg-emerald-500 text-white"><i className="fa-solid fa-check"></i></button>
                    <button onClick={() => handleActionRequest(r.id, 'REJECTED')} className="bg-red-600 p-2 rounded-lg hover:bg-red-500 text-white"><i className="fa-solid fa-xmark"></i></button>
                  </div>
                </div>
              ))}
              {balanceRequests.filter(r => r.status === 'PENDING' && !r.parentId).length === 0 && <p className="text-gray-600 text-sm italic">Sem solicitações de clientes diretos.</p>}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-black text-emerald-400 uppercase mb-4 tracking-widest">Fechamento Cambistas</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[10px] text-emerald-500/60 uppercase font-black border-b border-white/5">
                  <tr>
                    <th className="px-4 py-2">Cambista</th>
                    <th className="px-4 py-2">Apostas</th>
                    <th className="px-4 py-2">Recargas</th>
                    <th className="px-4 py-2">Comissão</th>
                    <th className="px-4 py-2">Repasse</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {settlementData.map(b => (
                    <tr key={b.id} className="border-b border-white/5">
                      <td className="px-4 py-3 font-bold text-white">{b.name}</td>
                      <td className="px-4 py-3 text-white">R$ {b.total.toFixed(2)}</td>
                      <td className="px-4 py-3 text-white">R$ {b.recargas.toFixed(2)}</td>
                      <td className="px-4 py-3 text-red-400">- R$ {b.comm.toFixed(2)}</td>
                      <td className="px-4 py-3 font-black text-emerald-400">R$ {b.due.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {tab === 'MATCHES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matches.map((m, idx) => (
            <div key={m.id} className="bg-black/60 p-4 rounded-2xl border border-emerald-500/10 space-y-3">
              <input value={m.league} onChange={(e) => handleUpdateMatch(m.id, 'league', e.target.value)} className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-1 text-xs text-emerald-400 outline-none focus:border-emerald-500" placeholder="Liga"/>
              <input value={m.homeTeam} onChange={(e) => handleUpdateMatch(m.id, 'homeTeam', e.target.value)} className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-1 font-bold text-white outline-none focus:border-emerald-500" placeholder="Time Casa"/>
              <div className="text-center text-[10px] font-black opacity-30 italic text-emerald-500">VS</div>
              <input value={m.awayTeam} onChange={(e) => handleUpdateMatch(m.id, 'awayTeam', e.target.value)} className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-1 font-bold text-white outline-none focus:border-emerald-500" placeholder="Time Fora"/>
              <input value={m.date} onChange={(e) => handleUpdateMatch(m.id, 'date', e.target.value)} className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-1 text-[10px] text-gray-500 outline-none focus:border-emerald-500" placeholder="Data/Hora"/>
            </div>
          ))}
        </div>
      )}

      {tab === 'USERS' && (
        <div className="space-y-8">
          <div className="bg-emerald-500/5 p-6 rounded-2xl border border-emerald-500/20">
            <h3 className="font-black mb-4 uppercase text-emerald-400">Cadastrar Usuário</h3>
            <form onSubmit={handleRegisterUser} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input name="name" required placeholder="Nome" className="bg-black/50 border border-emerald-500/20 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-emerald-500" />
              <input name="username" required placeholder="Usuário" className="bg-black/50 border border-emerald-500/20 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-emerald-500" />
              <input name="password" required type="password" placeholder="Senha" className="bg-black/50 border border-emerald-500/20 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-emerald-500" />
              <select name="role" className="bg-black/50 border border-emerald-500/20 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-emerald-500">
                <option value={UserRole.CLIENT}>Apostador</option>
                <option value={UserRole.BOOKIE}>Cambista</option>
                <option value={UserRole.ADMIN}>Administrador</option>
              </select>
              <select name="parentId" className="bg-black/50 border border-emerald-500/20 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-emerald-500">
                <option value="none">Direto Admin (Controle Total)</option>
                {bookies.map(b => <option key={b.id} value={b.id}>Cambista: {b.name}</option>)}
              </select>
              <button className="bg-emerald-500 text-black font-black uppercase rounded-xl py-2 text-xs">Criar</button>
            </form>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-[10px] text-emerald-500/60 uppercase border-b border-emerald-500/10">
                <tr><th className="px-4 py-2">Nome</th><th className="px-4 py-2">Tipo</th><th className="px-4 py-2">Saldo</th><th className="px-4 py-2 text-right">Ações</th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-emerald-500/5 transition-all">
                    <td className="px-4 py-3 text-white">{u.name}<br/><span className="text-[10px] text-gray-500 font-mono">@{u.username}</span></td>
                    <td className="px-4 py-3"><span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded ${u.role === UserRole.ADMIN ? 'bg-purple-500/20 text-purple-400' : u.role === UserRole.BOOKIE ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{u.role}</span></td>
                    <td className="px-4 py-3 text-emerald-400 font-bold">R$ {u.balance.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handleAdjustBalance(u.id, 'ADD')} className="w-8 h-8 flex items-center justify-center bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-black transition-all"><i className="fa-solid fa-plus text-[10px]"></i></button>
                        <button onClick={() => handleAdjustBalance(u.id, 'REMOVE')} className="w-8 h-8 flex items-center justify-center bg-amber-500/10 text-amber-500 rounded-lg hover:bg-amber-500 hover:text-white transition-all"><i className="fa-solid fa-minus text-[10px]"></i></button>
                        <button onClick={() => handleDeleteUser(u.id)} className="w-8 h-8 flex items-center justify-center bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"><i className="fa-solid fa-trash-can text-[10px]"></i></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'TICKETS' && (
        <div className="space-y-4">
          <h3 className="text-sm font-black text-emerald-400 uppercase mb-4 tracking-widest">Bilhetes Globais / Diretos</h3>
          {tickets.filter(t => !t.parentId).map(t => (
            <div key={t.id} className="bg-black/60 p-4 rounded-2xl flex justify-between items-center border border-emerald-500/10">
              <div>
                <span className="font-black text-emerald-400">#{t.id}</span>
                <div className="text-xs text-white">{t.userName} <span className="text-[10px] text-gray-500 uppercase">(DIRETO)</span></div>
                <div className="text-[10px] text-gray-500">{new Date(t.date).toLocaleString()}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleActionTicket(t.id, 'VALIDATED')} className="bg-emerald-600 px-3 py-1 rounded text-xs font-bold hover:bg-emerald-500 text-white">Validar</button>
                <button onClick={() => handleActionTicket(t.id, 'WON')} className="bg-emerald-500 text-black px-3 py-1 rounded text-xs font-bold hover:bg-emerald-400">Ganhou</button>
                <button onClick={() => handleActionTicket(t.id, 'LOST')} className="bg-red-600 px-3 py-1 rounded text-xs font-bold hover:bg-red-500 text-white">Perdeu</button>
              </div>
            </div>
          ))}
          {tickets.filter(t => !t.parentId).length === 0 && <p className="text-center py-10 text-gray-600 italic">Nenhum bilhete direto pendente.</p>}
        </div>
      )}

      {tab === 'SETTINGS' && (
        <div className="max-w-xl space-y-8">
          <div className="bg-black/60 p-6 rounded-3xl border border-emerald-500/10">
            <h4 className="text-xs font-black uppercase text-emerald-400 mb-4 tracking-widest">Segurança Admin</h4>
            <div className="flex gap-2">
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nova Senha Admin" className="flex-1 bg-black/50 border border-emerald-500/20 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-emerald-500" />
              <button onClick={changeAdminPassword} className="bg-emerald-500 text-black px-6 font-black uppercase rounded-xl text-xs">Mudar</button>
            </div>
          </div>

          <div className="bg-black/60 p-6 rounded-3xl border border-emerald-500/10">
            <h4 className="text-xs font-black uppercase text-emerald-400 mb-4 tracking-widest">Configurações PIX</h4>
            <input value={settings.pixKey} onChange={(e) => setSettings({ ...settings, pixKey: e.target.value })} className="w-full bg-black/50 border border-emerald-500/20 rounded-xl px-4 py-2 text-emerald-400 font-mono text-sm mb-4 outline-none focus:border-emerald-500" />
            <button onClick={() => setSettings({ ...settings, bettingBlocked: !settings.bettingBlocked })} className={`w-full py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all ${settings.bettingBlocked ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/50'}`}>
              {settings.bettingBlocked ? 'LIBERAR APOSTAS' : 'BLOQUEAR APOSTAS'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
