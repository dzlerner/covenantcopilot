import { Suspense } from 'react';
import Navigation from '@/components/Navigation';
import ChatHeader from '@/components/ChatHeader';
import ChatInterface from '@/components/ChatInterface';

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navigation />
      <ChatHeader />
      
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      }>
        <ChatInterface />
      </Suspense>
    </div>
  );
}