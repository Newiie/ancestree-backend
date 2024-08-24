import NavBar from '@/components/NavBar';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const LoginForm = dynamic(() => import('@/components/LoginForm'), { ssr: false });

const Page = () => {
  return (
    <div className="relative">
      <NavBar />

      <div className="flex flex-wrap">
        <div className="relative w-full lg:w-[65%]">
          <video className="absolute top-0 left-0 h-screen w-full object-cover" autoPlay loop muted>
            <source src="/videos/backgroundHome.mp4" type="video/mp4" />
          </video>
          <div className="relative z-10 flex flex-col items-center gap-[1rem] justify-center h-screen text-white">
            <h1 className="text-[3rem] font-semibold text-shadow">Welcome to AncesTREE</h1>
            <p className="text-lg">Unraveling Ancestral Lineages through Geographical History</p>
            <Link href="" className="py-[0.5rem] px-[1rem] text-[0.9rem] rounded-[3px] bg-primary hover:text-primary hover:bg-hover transition-colors duration-200">
              GET STARTED
            </Link>
          </div>
          <div className="absolute inset-0 bg-black opacity-50 z-0"></div>
        </div>

        <div className="w-full lg:w-[35%] bg-[#658165] flex flex-col justify-center items-center px-[5rem]">
          <h1 className='text-black mb-[3rem] text-[2rem] font-[500]'>Welcome Back!</h1>
          <LoginForm />
        </div>
      </div>
    </div>
  );
};

export default Page;
