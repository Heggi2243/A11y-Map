import React, { useState } from 'react';
import { LoginFormData } from '../types';

export const LoginForm: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      alert(`Logging in as ${formData.username}`);
      setLoading(false);
    }, 1000);
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="relative w-full max-w-md flex flex-col gap-6 p-8 z-10"
    >
      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor="username" className="sr-only">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            placeholder="USERNAME"
            value={formData.username}
            onChange={handleChange}
            className="w-full h-14 px-4 rounded-xl border-4 border-[#1e40af] bg-white font-fredoka font-bold text-[#1e40af] text-lg placeholder-[#1e40af]/50 focus:outline-none focus:ring-4 focus:ring-[#fcd34d] transition-all shadow-[4px_4px_0px_0px_#1e40af]"
          />
        </div>
        
        <div>
          <label htmlFor="password" className="sr-only">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="PASSWORD"
            value={formData.password}
            onChange={handleChange}
            className="w-full h-14 px-4 rounded-xl border-4 border-[#1e40af] bg-white font-fredoka font-bold text-[#1e40af] text-lg placeholder-[#1e40af]/50 focus:outline-none focus:ring-4 focus:ring-[#fcd34d] transition-all shadow-[4px_4px_0px_0px_#1e40af]"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full h-16 mt-2 rounded-full bg-[#1e40af] text-white font-titan text-2xl tracking-wide hover:bg-[#1e3a8a] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[4px_4px_0px_0px_#000000] border-2 border-transparent flex items-center justify-center"
      >
        {loading ? 'LOADING...' : 'ENTER'}
      </button>
      
      <div className="text-center">
         <a href="#" className="font-fredoka font-bold text-[#1e40af] hover:underline decoration-4 decoration-[#fcd34d]">Forgot Password?</a>
      </div>
    </form>
  );
};