'use client';

import Navigation from '@/components/Navigation';
import SearchInput from '@/components/SearchInput';
import SuggestedQueries from '@/components/SuggestedQueries';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <main className="flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Main heading */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
            Covenant Copilot
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 font-light">
            Ask your HOA anything.
          </p>
        </div>

        {/* Search input */}
        <div className="w-full mb-16">
          <SearchInput />
        </div>

        {/* Suggested queries */}
        <SuggestedQueries />
      </main>
    </div>
  );
}
