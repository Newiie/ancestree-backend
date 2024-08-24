"use client";

import React, { FormEvent, useState } from 'react';
import { KeyRound, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import loginService from '../services/login';

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter(); 

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const user = await loginService.login({ username, password });
      console.log("USERS ", user);
      window.localStorage.setItem('loggedNoteappUser', JSON.stringify(user));
      router.push('/Dashboard');
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <form onSubmit={handleLogin} className="flex flex-col gap-[1rem] w-full">
      <label className="text-black" htmlFor="email">Email:</label>
      <div className="relative flex items-center">
        <User width={15} height={15} className="absolute left-3 text-primary" />
        <input
          type="text"
          id="email"
          name="email"
          className="text-primary py-[0.5rem] pl-10 pr-[1rem] border border-gray-300 rounded-[3px] focus:outline-none focus:ring-2 focus:ring-primary w-full"
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>

      <label className="text-black" htmlFor="password">Password:</label>
      <div className="relative flex items-center">
        <KeyRound width={15} height={15} className="absolute left-3 text-primary" />
        <input
          type="password"
          id="password"
          name="password"
          className="text-primary py-[0.5rem] pl-10 pr-[1rem] border border-gray-300 rounded-[3px] focus:outline-none focus:ring-2 focus:ring-primary w-full"
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <button className="py-[0.5rem] px-[1rem] text-[0.9rem] rounded-[3px] bg-primary hover:text-primary hover:bg-hover transition-colors duration-200 mt-[1rem]" type="submit">
        Login
      </button>
    </form>
  );
};

export default LoginForm;
