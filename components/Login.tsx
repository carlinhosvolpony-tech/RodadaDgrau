
import React, { useState } from 'react';
import { User, UserRole } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

const Login: React.FC<LoginProps> = ({ onLogin, users, setUsers }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isRegistering) {
      if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
        alert("Este nome de usuário já está em uso!");
        return;
      }
      
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        username,
        password,
        role: UserRole.CLIENT,
        balance: 0,
        createdAt: Date.now()
      };
      
      setUsers([...users, newUser]);
      onLogin(newUser);
    } else {
      const user = users.find(u => 
        u.username.toLowerCase() === username.toLowerCase() && 
        u.password === password
      );
      if (user) {
        onLogin(user);
      } else {
        alert("Usuário ou senha inválidos!");
      }
    }
  };

  return (
    <div className="stadium-bg min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md glass p-8 rounded-3xl shadow-2xl border border-emerald-500/20">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-black mx-auto mb-4 shadow-[0_0_25px_rgba(16,185,129,0.5)]">
            <i className="fa-solid fa-futbol text-4xl"></i>
          </div>
          <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase">D'GRAU<span className="text-emerald-500">APOSTAS</span></h1>
          <p className="text-emerald-500/60 text-[10px] uppercase font-bold tracking-[0.3em]">Onde o Jogo Acontece</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <div>
              <label className="text-[10px] font-black uppercase text-gray-500 ml-1">Nome de Exibição</label>
              <input required value={name} onChange={e => setName(e.target.value)} className="w-full bg-black/60 border border-emerald-500/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500 transition-all" placeholder="Ex: João Silva" />
            </div>
          )}

          <div>
            <label className="text-[10px] font-black uppercase text-gray-500 ml-1">Usuário</label>
            <input required type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-black/60 border border-emerald-500/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500 transition-all" placeholder="Digite seu usuário" autoCapitalize="none" />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-gray-500 ml-1">Senha</label>
            <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/60 border border-emerald-500/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500 transition-all" placeholder="••••••••" />
          </div>

          <button className="w-full py-4 bg-emerald-500 text-black font-black uppercase rounded-2xl shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
            {isRegistering ? 'Criar Cadastro' : 'Entrar Agora'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={() => setIsRegistering(!isRegistering)} className="text-[10px] font-black text-emerald-400 uppercase tracking-widest hover:text-emerald-300 transition-colors">
            {isRegistering ? 'Já sou cadastrado' : 'Não tenho conta, quero criar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
