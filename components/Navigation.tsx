'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

export default function Navigation() {
  const [selectedHOA, setSelectedHOA] = useState("Highlands Ranch Community Association");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const hoaOptions = [
    "Highlands Ranch Community Association",
    "More HOAs coming soon"
  ];

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const selectHOA = (hoa: string) => {
    setSelectedHOA(hoa);
    setIsDropdownOpen(false);
  };

  return (
    <nav className="w-full bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Site name */}
          <div className="flex-shrink-0">
            <Link 
              href="/" 
              className="text-xl font-semibold text-gray-900 hover:text-gray-700 transition-colors"
            >
              Covenant Copilot
            </Link>
          </div>

          {/* Right side - HOA Dropdown */}
          <div className="relative">
            <button
              onClick={toggleDropdown}
              className="flex items-center space-x-2 bg-white border border-gray-300 rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <span className="truncate max-w-xs">{selectedHOA}</span>
              <ChevronDownIcon 
                className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
              />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                <div className="py-1">
                  {hoaOptions.map((hoa, index) => (
                    <button
                      key={index}
                      onClick={() => selectHOA(hoa)}
                      className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                        selectedHOA === hoa 
                          ? 'bg-blue-50 text-blue-900' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {hoa}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Hidden nav links - Hidden temporarily until pages are implemented */}
          <div className="hidden">
            <Link 
              href="/about" 
              className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
            >
              About
            </Link>
            <Link 
              href="/add" 
              className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
            >
              Add Your HOA
            </Link>
            <Link 
              href="/contact" 
              className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
            >
              Contact
            </Link>
            <Link 
              href="/privacy" 
              className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
            >
              Privacy Policy
            </Link>
          </div>

          {/* Hidden mobile menu button - Hidden temporarily until mobile functionality is implemented */}
          <div className="md:hidden hidden">
            <button
              type="button"
              className="text-gray-600 hover:text-gray-900 p-2"
              aria-label="Open main menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}