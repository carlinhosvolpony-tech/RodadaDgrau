
import React, { useState } from 'react';
import { User, Ticket, AppSettings, UserRole, BalanceRequest } from '../types';

interface BookieDashboardProps {
  currentUser: User;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  tickets: Ticket[];
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
  balanceRequests: BalanceRequest[];
  setBalanceRequests: React.Dispatch<React.SetStateAction<BalanceRequest[]>>;
  settings: AppSettings;
}

const BookieDashboard: React.FC<BookieDashboardProps> = ({ currentUser, setCurrentUser, users, setUsers, tickets, setTickets, balanceRequests, setBalanceRequests, settings }) => {
  const [tab, setTab] = useState<'FINANCE' | 'CLIENTS' | 'SETTINGS'>('FINANCE');
  const [clientForm, setClientForm] = useState({ name: '', username: '', password: '' });
  const [bookiePix, setBookiePix] = useState(currentUser.pixKey || '');

  const myClients = users.filter(u => u.parentId === currentUser.id);
  const myTickets = tickets.filter(t => t.parentId === currentUser.id);
  const myBalanceReqs = balanceRequests.filter(r => r.parentId === currentUser.id);
  
  const totalTicketsVolume = myTickets.reduce((acc, t) => acc + t.cost, 0);
  const totalBalanceAdded = myClients.reduce((acc, c) => acc + (c.totalDepositsByBookie || 0), 0);
  const commission = totalTicketsVolume * 0.20;
  const adminDue = (totalTicketsVolume + totalBalanceAdded) - commission;

  const handleSaveSettings = () => {
    const updatedUser = { ...currentUser, pixKey: bookiePix };
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    alert("Configurações salvas! Seus clientes agora verão sua chave PIX.");
  };

  const handleAddBalance = (userId: string) => {
    const amountStr = prompt("Quanto de saldo deseja adicionar para este cliente?");
    const amount = parseFloat(amountStr || '0');
    
    if (isNaN(amount) || amount <= 0) {
      alert("Valor inválido");
      return;
    }

    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return { 
          ...u, 
          balance: u.balance + amount,
          totalDepositsByBookie: (u.totalDepositsByBookie || 0) + amount 
        };
      }
      return u;
    }));
    alert(`R$ ${amount.toFixed(2)} adicionados com sucesso!`);
  };

  const handleActionRequest = (id: string, status: 'APPROVED' | 'REJECTED') => {
    const req = myBalanceReqs.find(r => r.id === id);
    if (!req) return;
    if (status === 'APPROVED') {
      setUsers(prev => prev.map(u => u.id === req.userId ? { ...u, balance: u.balance + req.amount, totalDepositsByBookie: (u.totalDepositsByBookie || 0) + req.amount } : u));
    }
    setBalanceRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const handleActionTicket = (id: string, status: Ticket['status']) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  const handleRegisterClient = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: clientForm.name,
      username: clientForm.username,
      password: clientForm.password,
      role: UserRole.CLIENT,
      balance: 0,
      createdAt: Date.now(),
      parentId: currentUser.id,
      totalDepositsByBookie: 0
    };
    setUsers(prev => [...prev, newUser]);
    setClientForm({ name: '', username: '', password: '' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex gap-4 overflow-x-auto pb-2 border-b border-emerald-500/10">
        <button onClick={() => setTab('FINANCE')} className={`px-6 py-2 rounded-xl font-black uppercase text-xs tracking-widest transition-all whitespace-nowrap ${tab === 'FINANCE' ? 'bg-emerald-500 text-black' : 'text-emerald-500/60 hover:text-emerald-400'}`}>Financeiro</button>
        <button onClick={() => setTab('CLIENTS')} className={`px-6 py-2 rounded-xl font-black uppercase text-xs tracking-widest transition-all whitespace-nowrap ${tab === 'CLIENTS' ? 'bg-emerald-500 text-black' : 'text-emerald-500/60 hover:text-emerald-400'}`}>Clientes</button>
        <button onClick={() => setTab('SETTINGS')} className={`px-6 py-2 rounded-xl font-black uppercase text-xs tracking-widest transition-all whitespace-nowrap ${tab === 'SETTINGS' ? 'bg-emerald-500 text-black' : 'text-emerald-500/60 hover:text-emerald-400'}`}>Ajustes</button>
      </div>

      {tab === 'FINANCE' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass p-5 rounded-3xl border-l-4 border-l-emerald-500">
              <span className="text-[10px] text-gray-500 font-black uppercase">Bilhetes</span>
              <div className="text-xl font-black text-white">R$ {totalTicketsVolume.toFixed(2)}</div>
            </div>
            <div className="glass p-5 rounded-3xl border-l-4 border-l-blue-500">
              <span className="text-[10px] text-gray-500 font-black uppercase">Recargas</span>
              <div className="text-xl font-black text-white">R$ {totalBalanceAdded.toFixed(2)}</div>
            </div>
            <div className="glass p-5 rounded-3xl border-l-4 border-l-emerald-400 bg-emerald-400/5">
              <span className="text-[10px] text-emerald-500 font-black uppercase">Comissão</span>
              <div className="text-xl font-black text-emerald-400">R$ {commission.toFixed(2)}</div>
            </div>
            <div className="glass p-5 rounded-3xl border-l-4 border-l-green-500">
              <span className="text-[10px] text-gray-500 font-black uppercase">A Repassar</span>
              <div className="text-xl font-black text-green-400">R$ {adminDue.toFixed(2)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass p-6 rounded-3xl">
              <h3 className="text-xs font-black uppercase text-emerald-400 mb-4 tracking-widest">Solicitações PIX</h3>
              <div className="space-y-3">
                {myBalanceReqs.filter(r => r.status === 'PENDING').map(r => (
                  <div key={r.id} className="bg-black/60 p-3 rounded-xl flex justify-between items-center border border-emerald-500/10">
                    <div>
                      <div className="font-bold text-xs text-white">{r.userName}</div>
                      <div className="text-emerald-400 font-black text-sm">R$ {r.amount.toFixed(2)}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleActionRequest(r.id, 'APPROVED')} className="bg-emerald-600 w-8 h-8 rounded-lg hover:bg-emerald-500 text-white"><i className="fa-solid fa-check text-xs"></i></button>
                      <button onClick={() => handleActionRequest(r.id, 'REJECTED')} className="bg-red-600 w-8 h-8 rounded-lg hover:bg-red-500 text-white"><i className="fa-solid fa-xmark text-xs"></i></button>
                    </div>
                  </div>
                ))}
                {myBalanceReqs.filter(r => r.status === 'PENDING').length === 0 && <p className="text-[10px] text-gray-600 text-center uppercase font-black py-4 italic">Nenhuma solicitação</p>}
              </div>
            </div>

            <div className="glass p-6 rounded-3xl">
              <h3 className="text-xs font-black uppercase text-emerald-400 mb-4 tracking-widest">Validar Bilhetes</h3>
              <div className="space-y-3">
                {myTickets.filter(t => t.status === 'PENDING').map(t => (
                  <div key={t.id} className="bg-black/60 p-3 rounded-xl flex justify-between items-center border border-emerald-500/10">
                    <div>
                      <div className="font-black text-emerald-400 text-xs">#{t.id}</div>
                      <div className="text-[10px] text-gray-500 font-black">{t.userName}</div>
                    </div>
                    <button onClick={() => handleActionTicket(t.id, 'VALIDATED')} className="bg-emerald-500 text-black px-4 py-1.5 rounded-lg text-[10px] font-black uppercase">Validar</button>
                  </div>
                ))}
                {myTickets.filter(t => t.status === 'PENDING').length === 0 && <p className="text-[10px] text-gray-600 text-center uppercase font-black py-4 italic">Nenhum bilhete pendente</p>}
              </div>
            </div>
          </div>
        </>
      )}

      {tab === 'CLIENTS' && (
        <div className="space-y-6">
          <div className="glass p-6 rounded-3xl border border-emerald-500/20">
            <h4 className="text-xs font-black uppercase text-emerald-400 mb-4 tracking-widest">Novo Cliente</h4>
            <form onSubmit={handleRegisterClient} className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input required placeholder="Nome" value={clientForm.name} onChange={e => setClientForm({ ...clientForm, name: e.target.value })} className="bg-black/50 border border-emerald-500/20 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-emerald-500" />
              <input required placeholder="Usuário" value={clientForm.username} onChange={e => setClientForm({ ...clientForm, username: e.target.value })} className="bg-black/50 border border-emerald-500/20 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-emerald-500" />
              <input required type="password" placeholder="Senha" value={clientForm.password} onChange={e => setClientForm({ ...clientForm, password: e.target.value })} className="bg-black/50 border border-emerald-500/20 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-emerald-500" />
              <button className="bg-emerald-500 text-black font-black uppercase rounded-xl py-2 text-xs">Cadastrar</button>
            </form>
          </div>

          <div className="glass p-6 rounded-3xl">
            <h4 className="text-xs font-black uppercase text-gray-400 mb-4 tracking-widest">Lista de Clientes</h4>
            <div className="space-y-3">
              {myClients.map(c => (
                <div key={c.id} className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-emerald-500/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-black uppercase">{c.name.charAt(0)}</div>
                    <div>
                      <div className="font-bold text-white text-sm">{c.name}</div>
                      <div className="text-[10px] text-emerald-500 font-mono">@{c.username}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="text-[9px] text-gray-500 font-bold uppercase block">Saldo</span>
                      <div className="text-emerald-400 font-black">R$ {c.balance.toFixed(2)}</div>
                    </div>
                    <button onClick={() => handleAddBalance(c.id)} className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-black w-8 h-8 rounded-lg transition-all"><i className="fa-solid fa-plus text-xs"></i></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'SETTINGS' && (
        <div className="glass p-8 rounded-3xl border border-emerald-500/20">
          <h4 className="text-xs font-black uppercase text-emerald-400 mb-4 tracking-widest">Ajustes da Conta</h4>
          <div className="space-y-6 max-w-md">
            <div>
              <label className="text-[10px] font-black uppercase text-gray-500 ml-1">Minha Chave PIX</label>
              <input type="text" value={bookiePix} onChange={e => setBookiePix(e.target.value)} placeholder="Ex: CPF ou E-mail" className="w-full bg-black/50 border border-emerald-500/20 rounded-xl px-4 py-3 text-white font-mono text-sm outline-none focus:border-emerald-500" />
            </div>
            <button onClick={handleSaveSettings} className="w-full py-3 bg-emerald-500 text-black font-black uppercase rounded-xl hover:scale-[1.02] transition-all shadow-lg shadow-emerald-500/20">Salvar Dados</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookieDashboard;
