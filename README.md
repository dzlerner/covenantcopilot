# Covenant Copilot

A Next.js application that provides an AI-powered chatbot for HOA (Homeowners Association) questions and guidelines.

## Features

- Clean, minimalist landing page
- Interactive chat interface powered by OpenAI ChatGPT
- **RAG-powered responses** using Supabase vector search
- **Structured markdown responses** with proper formatting
- Responsive design for all devices
- TypeScript throughout for type safety
- Tailwind CSS for styling

## Tech Stack

- **Framework**: Next.js 15.4.5 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: OpenAI GPT-4o with RAG (Retrieval Augmented Generation)
- **Vector Database**: Supabase with pgvector
- **Document Processing**: PDF parsing + web crawling
- **Markdown Rendering**: react-markdown with GitHub Flavored Markdown
- **Icons**: Heroicons

## Getting Started

### Prerequisites

- Node.js 18+ installed
- An OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd covenantcopilot
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory and add your OpenAI API key:
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

To get an OpenAI API key:
- Visit [OpenAI's API platform](https://platform.openai.com/api-keys)
- Sign up or log in to your account
- Create a new API key
- Copy and paste it into your `.env.local` file

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
covenantcopilot/
├── app/
│   ├── api/chat/          # OpenAI ChatGPT API route
│   ├── chat/              # Chat interface page
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Homepage
│   └── globals.css        # Global styles
├── components/
│   ├── Navigation.tsx     # Top navigation bar
│   ├── SearchInput.tsx    # Homepage search input
│   ├── SuggestedQueries.tsx # Suggestion buttons
│   ├── ChatHeader.tsx     # Chat page header
│   ├── ChatMessage.tsx    # Individual chat messages
│   ├── ChatInput.tsx      # Chat input field
│   └── ChatInterface.tsx  # Main chat logic
└── public/               # Static assets
```

## Usage

### Homepage
- Enter a question in the search box
- Click one of the suggested queries
- Both actions will navigate to the chat interface

### Enhanced Chat Interface
- **Structured responses** with markdown formatting
- **Source-backed answers** from actual HRCA documents
- **Professional formatting** with headings, bullets, bold text
- **Clickable links** to original HRCA sources
- Ask follow-up questions with conversation context
- Navigate back to homepage using the back arrow

### Markdown Features
- **Bold text** for important terms and requirements
- Bullet points and numbered lists for clarity
- Headings for organized information sections
- `Code formatting` for specific measurements and color codes
- > Blockquotes for direct policy quotes
- [Clickable links](https://hrcaonline.org) to HRCA documents

## API Configuration

The ChatGPT integration uses optimized parameters for HOA-specific responses:
- **Model**: `gpt-4o` (high accuracy, fast, cost-efficient)
- **Temperature**: `0.2` (low randomness for consistent responses)
- **Max tokens**: `3072` (detailed responses with full citations)
- **Top_p**: `1` (standard diversity setting)
- **Frequency_penalty**: `0.0` (allows proper term repetition)
- **Presence_penalty**: `0.0` (maintains factual grounding)

These parameters are specifically tuned for accurate HOA regulation responses. You can modify these settings in `app/api/chat/route.ts`.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your `OPENAI_API_KEY` in the Vercel dashboard under Environment Variables
4. Deploy

### Other Platforms

Ensure you set the `OPENAI_API_KEY` environment variable on your deployment platform.

## Development

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

### Start Production Server

```bash
npm run start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.