import NavBar from '@/components/NavBar';
import React from 'react';
import Link from "next/link";
import { KeyRound, Mail, User } from 'lucide-react';

const Page = () => {
  return (
    <div className="relative">
      {/* NavBar Fixed at the Top */}
      <NavBar />

      <div className="flex flex-wrap">
        {/* SCREEN */}
        <div className="relative w-full lg:w-[65%]">
          <video className="absolute top-0 left-0 h-screen w-full object-cover" autoPlay loop muted>
            <source src="/videos/backgroundHome.mp4" type="video/mp4" />
          </video>

          {/* Content Over Video */}
          <div className="relative z-10 flex flex-col items-center gap-[1rem] justify-center h-screen text-white">
            <h1 className="text-[3rem] font-semibold">Welcome to AncesTREE</h1>
            <p className="text-lg">Unraveling Ancestral Lineages through Geographical History</p>
            <Link href={""} className="py-[0.5rem] px-[1rem] text-[0.9rem] rounded-[3px] bg-primary hover:text-primary hover:bg-hover transition-colors duration-200">
              GET STARTED
            </Link>
          </div>

          {/* Overlay for Darkening Video */}
          <div className="absolute inset-0 bg-black opacity-50 z-0"></div>
        </div>

        {/* LOGIN */}
        <div className="w-full lg:w-[35%] bg-[#658165] flex flex-col justify-center items-center px-[5rem]">
          <h1 className='text-black mb-[3rem] text-[2rem] font-[500]'>Register Now!</h1>
          <form action="" className="flex flex-col gap-[1rem] w-full">
            {/* Email Input */}
            <label className="text-black" htmlFor="email">Email:</label>
            <div className="relative flex items-center">
              <Mail width={15} height={15} className="absolute left-3 text-primary" />
              <input
                type="text"
                id="email"
                name="email"
                className="text-primary py-[0.5rem] pl-10 pr-[1rem] border border-gray-300 rounded-[3px] focus:outline-none focus:ring-2 focus:ring-primary w-full"
              />
            </div>
            
            {/* Username Input */}
            <label className="text-black" htmlFor="username">Username:</label>
            <div className="relative flex items-center">
              <User width={15} height={15} className="absolute left-3 text-primary" />
              <input
                type="text"
                id="username"
                name="username"
                className="text-primary py-[0.5rem] pl-10 pr-[1rem] border border-gray-300 rounded-[3px] focus:outline-none focus:ring-2 focus:ring-primary w-full"
              />
            </div>

            {/* Password Input */}
            <label className="text-black" htmlFor="password">Password:</label>
            <div className="relative flex items-center">
              <KeyRound width={15} height={15} className="absolute left-3 text-primary" />
              <input
                type="password"
                id="password"
                name="password"
                className="text-primary py-[0.5rem] pl-10 pr-[1rem] border border-gray-300 rounded-[3px] focus:outline-none focus:ring-2 focus:ring-primary w-full"
              />
            </div>

            <button className="py-[0.5rem] px-[1rem] text-[0.9rem] rounded-[3px] bg-primary hover:text-primary hover:bg-hover transition-colors duration-200 mt-[1rem]" type="submit">
              Register
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Page;
