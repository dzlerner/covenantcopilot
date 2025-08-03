'use client';

import { useRouter } from 'next/navigation';

export default function SuggestedQueries() {
  const router = useRouter();
  
  const suggestions = [
    "What paint color does my fence need to be?",
    "When do I have to take down my Christmas lights?",
    "Can I park an RV in my driveway?",
    "Do I need approval to build a shed?",
    "Are backyard chickens allowed?"
  ];

  const handleSuggestionClick = (suggestion: string) => {
    router.push(`/chat?q=${encodeURIComponent(suggestion)}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <p className="text-center text-gray-600 mb-6 text-lg">
        Try asking:
      </p>
      
      <div className="flex flex-wrap justify-center gap-3">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => handleSuggestionClick(suggestion)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm font-medium transition-colors border border-gray-200 hover:border-gray-300"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}