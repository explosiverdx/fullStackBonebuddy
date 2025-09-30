  import React from 'react';
import HamburgerMenu from './HamburgerMenu';

const Header = () => {
  return (
    <header className="bg-gray-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <a href="/demo" className="text-white font-bold text-xl flex items-center">
              <div className="logo-circle" style={{ width: '3rem', height: '3rem', borderRadius: '9999px', border: '2px solid #111827', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
                <img src="/assets/BoneBuddy_Logo-modified.webp" alt="BoneBuddy logo" style={{ width: '2rem', height: '2rem', objectFit: 'contain' }} />
              </div>
              BoneBuddy
            </a>
          </div>
          <div className="hidden md:block">
            <nav className="ml-10 flex items-baseline space-x-4">
              <a href="/dashboard" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Dashboard</a>
              <a href="/team" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Team</a>
              <a href="/projects" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Projects</a>
              <a href="/about" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">About</a>
            </nav>
          </div>
          <div className="-mr-2 flex md:hidden">
            <HamburgerMenu />
          </div>
          {/* Hide hamburger menu on all screen sizes */}
          <style>{`
            @media (max-width: 10000px) {
              .md\\:hidden {
                display: none !important;
              }
            }
            header {
              position: fixed !important;
              width: 100% !important;
              top: 0 !important;
              z-index: 1050 !important;
            }
          `}</style>
        </div>
      </div>
    </header>
  );
};

export default Header;
