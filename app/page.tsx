import NavBar from "@/components/NavBar";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative">
      {/* NavBar Fixed at the Top */}
      <NavBar />

      {/* Video Fullscreen Without Scrolling */}
      <div className="relative rounded-[3px]">
        <video className="absolute top-0 left-0 h-screen w-full object-cover" autoPlay loop muted>
          <source src="/videos/backgroundHome.mp4" type="video/mp4" />
        </video>

        {/* Content Over Video */}
        <div className="relative z-10 flex flex-col items-center gap-[1rem] justify-center h-screen text-white">
          <h1 className="text-[3rem] font-semibold">Welcome to AncesTREE</h1>
          <p className="text-lg">Unraveling Ancestral Lineages through Geographical History</p>
          <Link href="/get-started" className='py-[0.5rem] px-[1rem] text-[0.9rem] rounded-[3px] bg-primary hover:text-primary hover:bg-hover transition-colors duration-200' >
            GET STARTED
          </Link>
        </div>

        {/* Overlay for Darkening Video */}
        <div className="absolute inset-0 bg-black opacity-50 z-0"></div>
      </div>
      <video className="h-screen w-full object-cover" autoPlay loop muted>
          <source src="/videos/searchCard.mp4" type="video/mp4" />
      </video>
      <video className="h-screen w-full object-cover" autoPlay loop muted>
          <source src="/videos/recordCard.mp4" type="video/mp4" />
      </video>
      <video className="h-screen w-full object-cover" autoPlay loop muted>
          <source src="/videos/familyCard.mp4" type="video/mp4" />
      </video>
      <video className="h-screen w-full object-cover" autoPlay loop muted>
          <source src="/videos/createCard.mp4" type="video/mp4" />
      </video>
      
    </div>
  );
}
