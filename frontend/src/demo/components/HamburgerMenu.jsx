import React, { useState, useEffect } from 'react';

const menuItems = [
  { label: 'Home', link: '#' },
  { label: 'Change address', link: '#' },
  { label: 'Privacy policy', link: '#' },
  { label: 'Help', link: '#' },
  { label: 'Change Mobile no', link: '#' },
];

const HamburgerMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen((prev) => !prev);
  };

  // Prevent scrolling when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Hamburger Icon */}
      <div className="relative z-[1001] block">
        <button
          onClick={toggleMenu}
          className="w-10 h-10 bg-white shadow-md rounded-md flex flex-col justify-center items-center space-y-1 p-2 focus:outline-none"
        >
          <div className={`w-6 h-0.5 bg-gray-700 transition-transform ${isOpen ? 'rotate-45 translate-y-1.5' : ''}`}></div>
          <div className={`w-6 h-0.5 bg-gray-700 transition-opacity ${isOpen ? 'opacity-0' : ''}`}></div>
          <div className={`w-6 h-0.5 bg-gray-700 transition-transform ${isOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></div>
        </button>
      </div>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity ${
          isOpen ? 'opacity-100 z-[999]' : 'opacity-0 pointer-events-none'
        }`}
        onClick={toggleMenu}
        aria-hidden="true"
      />

      {/* Menu Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-64 max-w-full sm:w-72 bg-white/80 backdrop-blur-sm shadow-lg z-[1000] p-4 transition-all duration-300 ease-in-out transform ${
          isOpen ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'
        }`}
      >
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold">
              DH
            </div>
            <div className="ml-3 flex-1">
              <div className="text-lg font-semibold">Dr.Arif Hussain</div>
              <div className="text-sm text-gray-500">8881119890</div>
            </div>
            <button className="text-blue-600 text-sm font-medium hover:underline">
              Edit
            </button>
          </div>
          <nav>
            <ul>
              {menuItems.map((item) => (
                <li key={item.label} className="border-b border-gray-200 last:border-b-0">
                  <a
                    href={item.link}
                    onClick={toggleMenu}
                    className="flex w-full items-center justify-between rounded-md py-3 px-1 hover:bg-gray-100"
                  >
                    <span className="text-gray-800">{item.label}</span>
                    <span className="text-gray-400">{'>'}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
      </div>
    </>
  );
};

export default HamburgerMenu;
