export default function LoadingMessage() {
  return (
    <div className="flex justify-start mb-6">
      <div className="max-w-3xl">
        <div className="px-4 py-3 rounded-2xl bg-gray-100 text-gray-900 rounded-bl-md">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
            <span className="text-sm text-gray-600">Thinking...</span>
          </div>
        </div>
      </div>
    </div>
  );
}