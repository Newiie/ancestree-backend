import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

const NavBar = () => {
  return (
    <div className="flex justify-between py-[0.5rem] px-[2rem] bg-white fixed top-0 w-full z-50">

      <div className='flex gap-[1rem] items-center'>
        <Image src={"/Image/doge.png"} alt='logo' height={35} width={35} />
        <Link className='text-nav hover:text-primary nav-text text-[0.9rem] font-medium transition-colors duration-200' href={"/"}>AncesTREE</Link>
        <Link className='text-nav hover:text-primary nav-text text-[0.9rem] font-medium transition-colors duration-200' href={"About"}>About</Link>
        <Link className='text-nav hover:text-primary nav-text text-[0.9rem] font-medium transition-colors duration-200' href={"Search"}>Search</Link>
        <Link className='text-nav hover:text-primary nav-text text-[0.9rem] font-medium transition-colors duration-200' href={"Records"}>Records</Link>
        <Link className='text-nav hover:text-primary nav-text text-[0.9rem] font-medium transition-colors duration-200' href={"Activities"}>Activities</Link>
        <Link className='text-nav hover:text-primary nav-text text-[0.9rem] font-medium transition-colors duration-200' href={"Memories"}>Memories</Link>
      </div>
      <div className='flex gap-[1rem] items-center justify-center'>
        <Link className='py-[0.5rem] px-[1rem] text-[0.9rem] rounded-[3px] text-primary bg-secondary-btn hover:text-white hover:bg-primary transition-colors duration-200' href={"/login"}>Sign In</Link>
        <Link className='py-[0.5rem] px-[1rem] text-[0.9rem] rounded-[3px] bg-primary hover:text-primary hover:bg-hover transition-colors duration-200' href={"/register"}>Sign Up</Link>
      </div>
    </div>
  )
}

export default NavBar
