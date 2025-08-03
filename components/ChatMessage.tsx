import QuestionAnswerCard from './QuestionAnswerCard';

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp: string;
  sources?: string[];
}

interface StructuredResponse {
  title: string;
  answer: string;
  whyThisMatters?: string;
  considerations?: string[];
  disclaimer: string;
  sources?: { label: string; url: string; }[];
}

function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

function parseStructuredResponse(message: string): StructuredResponse | null {
  // Try to parse as JSON first
  if (isValidJSON(message)) {
    try {
      const parsed = JSON.parse(message);
      if (parsed.title && parsed.answer && parsed.disclaimer) {
        return parsed as StructuredResponse;
      }
    } catch {
      // Fall through to fallback
    }
  }

  // Look for JSON within the message
  const jsonMatch = message.match(/\{[\s\S]*\}/);
  if (jsonMatch && isValidJSON(jsonMatch[0])) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.title && parsed.answer && parsed.disclaimer) {
        return parsed as StructuredResponse;
      }
    } catch {
      // Fall through to fallback
    }
  }

  return null;
}

export default function ChatMessage({ message, isUser, timestamp, sources }: ChatMessageProps) {
  const structuredData = !isUser ? parseStructuredResponse(message) : null;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className="max-w-4xl w-full">
        <div
          className={`px-6 py-4 rounded-2xl ${
            isUser
              ? 'bg-gray-900 text-white rounded-br-md max-w-2xl ml-auto'
              : 'bg-white border border-gray-200 rounded-bl-md shadow-sm'
          }`}
        >
          {isUser ? (
            <p className="text-sm font-medium">{message}</p>
          ) : structuredData ? (
            <QuestionAnswerCard
              title={structuredData.title}
              answer={structuredData.answer}
              whyThisMatters={structuredData.whyThisMatters}
              considerations={structuredData.considerations}
              disclaimer={structuredData.disclaimer}
              sources={structuredData.sources}
            />
          ) : (
            // Fallback for non-structured responses
            <div className="space-y-3">
              <p className="text-sm leading-relaxed text-gray-900">{message}</p>
              
              {sources && sources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">Sources:</p>
                  <ul className="space-y-1">
                    {sources.map((source, index) => (
                      <li key={index} className="text-xs text-gray-500">
                        • {source}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2 px-2">
          {timestamp}
        </p>
      </div>
    </div>
  );
}