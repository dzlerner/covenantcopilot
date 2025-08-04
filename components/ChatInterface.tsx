'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
  sources?: string[];
}

export default function ChatInterface() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [messages, setMessages] = useState<Message[]>([]);
  const initialResponseFetched = useRef(false);

  useEffect(() => {
    if (initialQuery && !initialResponseFetched.current) {
      console.log('🔥 Fetching initial response for:', initialQuery);
      initialResponseFetched.current = true;
      // Add the initial user question
      const userMessage: Message = {
        id: '1',
        text: initialQuery,
        isUser: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages([userMessage]);

      // Get AI response for initial query
      const getInitialResponse = async () => {
        // Add loading message
        const loadingMessage: Message = {
          id: 'loading',
          text: 'Thinking...',
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages(prev => [...prev, loadingMessage]);

        try {
          const response = await fetch('/api/ask', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              message: initialQuery,
              conversationHistory: []
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to get response');
          }

          const aiResponse: Message = {
            id: 'ai-response-' + Date.now(),
            text: data.message,
            isUser: false,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };

          // Replace loading message with actual response
          setMessages(prev => prev.filter(msg => msg.id !== 'loading').concat(aiResponse));
        } catch (error) {
          console.error('Error getting initial AI response:', error);
          
          const errorMessage: Message = {
            id: 'error-response-' + Date.now(),
            text: 'Sorry, I encountered an error while processing your request. Please try again.',
            isUser: false,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };

          // Replace loading message with error message
          setMessages(prev => prev.filter(msg => msg.id !== 'loading').concat(errorMessage));
        }
      };

      getInitialResponse();
    }
  }, [initialQuery]);

  const handleSendMessage = async (messageText: string) => {
    console.log('🔥 Sending follow-up message:', messageText);
    const newMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, newMessage]);

    // Add a temporary loading message
    const loadingMessage: Message = {
      id: 'loading',
      text: 'Thinking...',
      isUser: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, loadingMessage]);

    try {
      // Build conversation history for context
      const conversationHistory = messages
        .filter(msg => msg.id !== 'loading') // Exclude loading messages
        .map(msg => ({
          role: msg.isUser ? 'user' : 'assistant',
          content: msg.text
        }));

      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: messageText,
          conversationHistory 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: data.message,
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      // Replace loading message with actual response
      setMessages(prev => prev.filter(msg => msg.id !== 'loading').concat(aiResponse));
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error while processing your request. Please try again.',
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      // Replace loading message with error message
      setMessages(prev => prev.filter(msg => msg.id !== 'loading').concat(errorMessage));
    }
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message.text}
              isUser={message.isUser}
              timestamp={message.timestamp}
              sources={message.sources}
            />
          ))}
        </div>
      </div>

      <ChatInput onSendMessage={handleSendMessage} />
    </>
  );
}

