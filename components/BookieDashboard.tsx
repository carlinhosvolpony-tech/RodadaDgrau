
import React, { useState } from 'react';
import { User, Ticket, AppSettings, UserRole, BalanceRequest } from '../types';
import { supabase } from '../supabaseClient';

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

const BookieDashboard: React.FC<BookieDashboardProps> = ({ currentUser, users, tickets, balanceRequests, settings }) => {
  const [tab, setTab] = useState<'FINANCE' | 'CLIENTS' | 'SETTINGS'>('FINANCE');
  const [clientForm, setClientForm] = useState({ name: '', username: '', password: '' });
  const [bookiePix, setBookiePix] = useState(currentUser.pix_key || '');

  const myClients = users.filter(u => u.parent_id === currentUser.id);
  const myTickets = tickets.filter(t => t.parent_id === currentUser.id);
  const myBalanceReqs = balanceRequests.filter(r => r.parent_id === currentUser.id);
  
  const totalTicketsVolume = myTickets.reduce((acc, t) => acc + t.cost, 0);
  const totalBalanceAdded = myClients.reduce((acc, c) => acc + (c.total_deposits_by_bookie || 0), 0);
  const commission = totalTicketsVolume * 0.20;
  const adminDue = (totalTicketsVolume + totalBalanceAdded) - commission;

  const handleSaveSettings = async () => {
    await supabase.from('users').update({ pix_key: bookiePix }).eq('id', currentUser.id);
    alert("Configurações salvas!");
  };

  const handleAddBalance = async (userId: string) => {
    const amountStr = prompt("Valor do saldo:");
    const amount = parseFloat(amountStr || '0');
    if (isNaN(amount) || amount <= 0) return;

    const user = users.find(u => u.id === userId);
    if (user) {
      const newBalance = user.balance + amount;
      const newTotal = (user.total_deposits_by_bookie || 0) + amount;
      await supabase.from('users').update({ balance: newBalance, total_deposits_by_bookie: newTotal }).eq('id', userId);
    }
  };

  const handleActionRequest = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    const req = myBalanceReqs.find(r => r.id === id);
    if (!req) return;
    if (status === 'APPROVED') {
       const user = users.find(u => u.id === req.user_id);
       if (user) {
         await supabase.from('users').update({ 
           balance: user.balance + req.amount, 
           total_deposits_by_bookie: (user.total_deposits_by_bookie || 0) + req.amount 
         }).eq('id', user.id);
       }
    }
    await supabase.from('balance_requests').update({ status }).eq('id', id);
  };

  const handleActionTicket = async (id: string, status: Ticket['status']) => {
    await supabase.from('tickets').update({ status }).eq('id', id);
  };

  const handleRegisterClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      name: clientForm.name,
      username: clientForm.username,
      password: clientForm.password,
      role: UserRole.CLIENT,
      balance: 0,
      created_at: Date.now(),
      parent_id: currentUser.id,
      total_deposits_by_bookie: 0
    };
    await supabase.from('users').insert([newUser]);
    setClientForm({ name: '', username: '', password: '' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex gap-4 overflow-x-auto pb-2 border-b border-emerald-500/10">
        <button onClick={() => setTab('FINANCE')} className={`px-6 py-2 rounded-xl font-black uppercase text-xs transition-all ${tab === 'FINANCE' ? 'bg-emerald-500 text-black' : 'text-emerald-500/60'}`}>Financeiro</button>
        <button onClick={() => setTab('CLIENTS')} className={`px-6 py-2 rounded-xl font-black uppercase text-xs transition-all ${tab === 'CLIENTS' ? 'bg-emerald-500 text-black' : 'text-emerald-500/60'}`}>Clientes</button>
        <button onClick={() => setTab('SETTINGS')} className={`px-6 py-2 rounded-xl font-black uppercase text-xs transition-all ${tab === 'SETTINGS' ? 'bg-emerald-500 text-black' : 'text-emerald-500/60'}`}>Ajustes</button>
      </div>

      {tab === 'FINANCE' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass p-6 rounded-3xl">
              <h3 className="text-xs font-black uppercase text-emerald-400 mb-4">Solicitações Pendentes</h3>
              <div className="space-y-3">
                {myBalanceReqs.filter(r => r.status === 'PENDING').map(r => (
                  <div key={r.id} className="bg-black/60 p-3 rounded-xl flex justify-between items-center border border-emerald-500/10">
                    <div>
                      <div className="font-bold text-xs text-white">{r.user_name}</div>
                      <div className="text-emerald-400 font-black text-sm">R$ {r.amount.toFixed(2)}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleActionRequest(r.id, 'APPROVED')} className="bg-emerald-600 w-8 h-8 rounded-lg text-white"><i className="fa-solid fa-check"></i></button>
                      <button onClick={() => handleActionRequest(r.id, 'REJECTED')} className="bg-red-600 w-8 h-8 rounded-lg text-white"><i className="fa-solid fa-xmark"></i></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="glass p-6 rounded-3xl">
              <h3 className="text-xs font-black uppercase text-emerald-400 mb-4">Validar Bilhetes</h3>
              <div className="space-y-3">
                {myTickets.filter(t => t.status === 'PENDING').map(t => (
                  <div key={t.id} className="bg-black/60 p-3 rounded-xl flex justify-between items-center border border-emerald-500/10">
                    <div>
                      <div className="font-black text-emerald-400 text-xs">#{t.id}</div>
                      <div className="text-[10px] text-gray-500 font-black">{t.user_name}</div>
                    </div>
                    <button onClick={() => handleActionTicket(t.id, 'VALIDATED')} className="bg-emerald-500 text-black px-4 py-1.5 rounded-lg text-[10px] font-black uppercase">Validar</button>
                  </div>
                ))}
              </div>
            </div>
        </div>
      )}

      {tab === 'CLIENTS' && (
        <div className="space-y-6">
          <form onSubmit={handleRegisterClient} className="glass p-6 rounded-3xl grid grid-cols-1 md:grid-cols-4 gap-3">
              <input required placeholder="Nome" value={clientForm.name} onChange={e => setClientForm({ ...clientForm, name: e.target.value })} className="bg-black/50 border border-emerald-500/20 rounded-xl px-4 py-2 text-white text-sm" />
              <input required placeholder="Usuário" value={clientForm.username} onChange={e => setClientForm({ ...clientForm, username: e.target.value })} className="bg-black/50 border border-emerald-500/20 rounded-xl px-4 py-2 text-white text-sm" />
              <input required type="password" placeholder="Senha" value={clientForm.password} onChange={e => setClientForm({ ...clientForm, password: e.target.value })} className="bg-black/50 border border-emerald-500/20 rounded-xl px-4 py-2 text-white text-sm" />
              <button className="bg-emerald-500 text-black font-black uppercase rounded-xl py-2 text-xs">Cadastrar</button>
          </form>

          <div className="space-y-3">
            {myClients.map(c => (
              <div key={c.id} className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-emerald-500/10">
                <span className="text-white font-bold">{c.name}</span>
                <div className="flex items-center gap-4">
                  <span className="text-emerald-400 font-black">R$ {c.balance.toFixed(2)}</span>
                  <button onClick={() => handleAddBalance(c.id)} className="bg-emerald-500/10 text-emerald-500 w-8 h-8 rounded-lg"><i className="fa-solid fa-plus"></i></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'SETTINGS' && (
        <div className="glass p-8 rounded-3xl">
          <label className="text-[10px] font-black uppercase text-gray-500">Minha Chave PIX</label>
          <input type="text" value={bookiePix} onChange={e => setBookiePix(e.target.value)} className="w-full bg-black/50 border border-emerald-500/20 rounded-xl px-4 py-3 text-white font-mono text-sm mb-4" />
          <button onClick={handleSaveSettings} className="w-full py-3 bg-emerald-500 text-black font-black uppercase rounded-xl">Salvar</button>
        </div>
      )}
    </div>
  );
};

export default BookieDashboard;
