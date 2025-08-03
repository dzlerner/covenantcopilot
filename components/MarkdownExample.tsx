'use client';

import ChatMessage from './ChatMessage';

export default function MarkdownExample() {
  const exampleMarkdown = `**No, blue is not an approved fence color** for Highlands Ranch properties.

## Why Earth-Tone Colors Are Required

HRCA requires all fences to be painted in approved earth-tone colors to maintain neighborhood aesthetic consistency and property values.

## Approved Colors

• **Desert Sand** (\`Sherwin Williams SW 6169\`)
• **Balanced Beige** (\`Sherwin Williams SW 7037\`)  
• **Natural Linen** (\`Sherwin Williams SW 9109\`)
• **Accessible Beige** (\`Sherwin Williams SW 7036\`)

## Important Requirements

• Must use **exterior-grade paint**
• Requires **ARC approval** before any color changes
• Fence must be maintained in good condition

## Edge Cases

If your fence borders a commercial area or has unique circumstances, contact the ARC directly as exceptions may apply on a case-by-case basis.

> All fence modifications require prior approval from the Architectural Review Committee as stated in Section 4.3 of the Design Guidelines.

## Sources

• [HRCA Design Guidelines Section 4.3](https://hrcaonline.org/guidelines)
• Approved Color Palette (Updated January 2024)

**Disclaimer**: This is not legal advice. For official rulings, please consult your HOA directly or refer to the governing documents.`;

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Markdown Rendering Example</h1>
      
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-700">User Question</h2>
        <ChatMessage
          message="What paint colors are approved for fences in Highlands Ranch?"
          isUser={true}
          timestamp="02:06 PM"
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-700">AI Response with Markdown</h2>
        <ChatMessage
          message={exampleMarkdown}
          isUser={false}
          timestamp="02:06 PM"
          sources={['HRCA Design Guidelines Section 4.3', 'Approved Color Palette']}
        />
      </div>
    </div>
  );
}