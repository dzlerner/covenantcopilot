import { ArrowLeftIcon, UserIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface ChatHeaderProps {
  hoaName?: string;
}

export default function ChatHeader({ hoaName = "Highlands Ranch Community Association" }: ChatHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            href="/" 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Covenant Copilot</h1>
            <p className="text-sm text-gray-600">{hoaName}</p>
          </div>
        </div>
        
        {/* Account icon - Hidden temporarily until user features are implemented */}
        <div className="hidden">
          <UserIcon className="h-5 w-5 text-gray-600" />
        </div>
      </div>
    </div>
  );
}