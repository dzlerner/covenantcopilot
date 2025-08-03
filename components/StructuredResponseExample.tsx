'use client';

import ChatMessage from './ChatMessage';

export default function StructuredResponseExample() {
  const exampleStructuredResponse = JSON.stringify({
    title: "Fence Color Guidelines",
    answer: "Approved Colors: Fences in Highlands Ranch should generally be painted or stained in natural wood tones or colors that blend with the surrounding environment. This typically includes shades like browns, tans, or other earth tones. Approval Process: Before painting or staining your fence, you should submit a request to the HRCA Architectural Review Committee (ARC) for approval to ensure compliance with community standards.",
    whyThisMatters: "The purpose of these guidelines is to maintain a cohesive and aesthetically pleasing appearance throughout the community.",
    considerations: [
      "If your fence is part of a shared boundary, you may need to coordinate with your neighbor",
      "There might be specific guidelines if your property is within a sub-association with its own rules",
      "All work must be completed within 30 days of approval",
      "You must use exterior-grade paint or stain rated for your climate zone"
    ],
    disclaimer: "This is not legal advice. For official rulings, please consult your HOA directly or refer to the governing documents.",
    sources: [
      {
        label: "HRCA Residential Improvement Guidelines and Site Restrictions, Section 4.3 – Fence Standards",
        url: "https://hrcaonline.org/Property-Owners/Forms"
      },
      {
        label: "HRCA Design Guidelines – Approved Color Palette (Updated January 2024)",
        url: "https://hrcaonline.org/Property-Owners/Residential/Covenants-Improvements"
      },
      {
        label: "Colorado HOA Law – Architectural Review Requirements",
        url: "https://hrcaonline.org/Property-Owners/Architectural-Review"
      }
    ]
  });

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8 bg-gray-50 min-h-screen">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Structured Response Design</h1>
        <p className="text-gray-600">New design matches the professional HOA document style</p>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-700">User Question</h2>
        <ChatMessage
          message="What are the approved fence colors for Highlands Ranch?"
          isUser={true}
          timestamp="02:44 PM"
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-700">AI Response with New Structured Design</h2>
        <ChatMessage
          message={exampleStructuredResponse}
          isUser={false}
          timestamp="02:44 PM"
        />
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3">Design Features Implemented:</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>✅ <strong>Check mark icon</strong> for main answer title</li>
          <li>✅ <strong>Purple sparkles icon</strong> for &ldquo;Why This Matters&rdquo; section</li>
          <li>✅ <strong>Orange warning icon</strong> for &ldquo;Additional Considerations&rdquo;</li>
          <li>✅ <strong>Boxed disclaimer</strong> with clock icon and orange styling</li>
          <li>✅ <strong>Numbered source references</strong> with external link icons</li>
          <li>✅ <strong>Professional spacing and typography</strong></li>
          <li>✅ <strong>Hover effects</strong> on interactive elements</li>
          <li>✅ <strong>Consistent color scheme</strong> matching HOA document standards</li>
        </ul>
      </div>
    </div>
  );
}