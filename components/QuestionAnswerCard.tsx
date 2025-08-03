import { CheckCircle, Sparkles, AlertTriangle, Clock, ExternalLink } from 'lucide-react';

interface Source {
  label: string;
  url: string;
}

interface QuestionAnswerCardProps {
  title: string;
  answer: string;
  whyThisMatters?: string;
  considerations?: string[];
  disclaimer: string;
  sources?: Source[];
}

export default function QuestionAnswerCard({
  title,
  answer,
  whyThisMatters,
  considerations,
  disclaimer,
  sources = []
}: QuestionAnswerCardProps) {
  return (
    <div className="space-y-6">
      {/* Main Answer Section */}
      <div>
        <h2 className="text-lg font-semibold flex items-center text-gray-900 mb-3">
          <CheckCircle className="text-green-500 mr-2 h-5 w-5" />
          {title}
        </h2>
        <p className="text-gray-700 leading-relaxed">
          {answer}
        </p>
      </div>

      {/* Why This Matters Section */}
      {whyThisMatters && (
        <div>
          <h3 className="text-base font-semibold flex items-center text-gray-900 mb-2">
            <Sparkles className="text-purple-500 mr-2 h-4 w-4" />
            Why This Matters
          </h3>
          <p className="text-gray-700 leading-relaxed">
            {whyThisMatters}
          </p>
        </div>
      )}

      {/* Additional Considerations Section */}
      {considerations && considerations.length > 0 && (
        <div>
          <h3 className="text-base font-semibold flex items-center text-gray-900 mb-3">
            <AlertTriangle className="text-orange-500 mr-2 h-4 w-4" />
            Additional Considerations
          </h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <ul className="space-y-2">
              {considerations.map((consideration, index) => (
                <li key={index} className="flex items-start text-gray-700">
                  <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                  {consideration}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Disclaimer Section */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-start">
          <Clock className="text-orange-500 mr-2 h-4 w-4 mt-0.5 flex-shrink-0" />
          <div className="text-orange-800">
            <span className="font-semibold">Disclaimer:</span>{' '}
            <span className="text-orange-700">{disclaimer}</span>
          </div>
        </div>
      </div>

      {/* Sources & References Section */}
      {sources && sources.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm text-gray-500 mb-3 flex items-center">
            <ExternalLink className="mr-2 h-4 w-4" />
            Sources & References
          </h4>
          <div className="space-y-2">
            {sources.map((source, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                <span className="bg-gray-300 text-gray-700 text-xs font-medium rounded-full px-2 py-1 min-w-[24px] text-center">
                  {index + 1}
                </span>
                <a 
                  href={source.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm leading-relaxed flex-1 hover:underline"
                >
                  {source.label}
                  <ExternalLink className="inline ml-1 h-3 w-3" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}