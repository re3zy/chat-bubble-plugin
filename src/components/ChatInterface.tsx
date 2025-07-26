import React, { useState, useRef, useEffect } from 'react';
import { ChatInterfaceProps, ChatMessage } from '../types/chat.types';
import { format } from 'date-fns';
import clsx from 'clsx';

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  onClearChat,
  isLoading = false,
  title = 'AI Assistant',
  placeholder = 'Type your message...',
  showTimestamps = true,
  showUserEmail = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const seenMessageIds = useRef<Set<string>>(new Set());
  
  // Track which messages are new
  const newMessageIds = messages
    .filter(msg => !seenMessageIds.current.has(msg.id))
    .map(msg => msg.id);
  
  // Update seen messages
  useEffect(() => {
    messages.forEach(msg => seenMessageIds.current.add(msg.id));
  }, [messages]);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isLoading) return;
    
    const message = inputValue.trim();
    setInputValue('');
    
    await onSendMessage(message);
    
    // Refocus input after sending
    inputRef.current?.focus();
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Submit on Enter (but not Shift+Enter for potential multi-line support)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };
  
  const formatTimestamp = (date: Date) => {
    return format(date, 'HH:mm');
  };
  
  return (
    <div className="chat-container">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        {onClearChat && (
          <button
            onClick={onClearChat}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            disabled={isLoading || messages.length === 0}
          >
            Clear Chat
          </button>
        )}
      </div>
      
      {/* Messages Area */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Start a conversation...</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <AnimatedMessageBubble
                key={message.id}
                message={message}
                showTimestamp={showTimestamps}
                showUserEmail={showUserEmail}
                formatTimestamp={formatTimestamp}
                isNew={newMessageIds.includes(message.id)}
                isLatestAssistantMessage={
                  message.sender === 'assistant' && 
                  index === messages.length - 1
                }
              />
            ))}
            {isLoading && <LoadingIndicator />}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Area */}
      <form onSubmit={handleSubmit} className="chat-input-container">
        <div className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            className={clsx(
              "flex-1 px-4 py-2 bg-gray-100 rounded-full",
              "text-gray-800 placeholder-gray-500",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all duration-200"
            )}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className={clsx(
              "px-6 py-2 rounded-full font-medium",
              "bg-blue-500 text-white",
              "hover:bg-blue-600 active:bg-blue-700",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            )}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Sending...
              </span>
            ) : (
              'Send'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// Animated Message Bubble Component with Typewriter Effect
interface AnimatedMessageBubbleProps {
  message: ChatMessage;
  showTimestamp: boolean;
  showUserEmail: boolean;
  formatTimestamp: (date: Date) => string;
  isLatestAssistantMessage: boolean;
  isNew: boolean;
}

const AnimatedMessageBubble: React.FC<AnimatedMessageBubbleProps> = ({
  message,
  showTimestamp,
  showUserEmail,
  formatTimestamp,
  isLatestAssistantMessage,
  isNew,
}) => {
  const isUser = message.sender === 'user';
  const shouldAnimate = !isUser && isNew && isLatestAssistantMessage;
  const [displayedText, setDisplayedText] = useState(shouldAnimate ? '' : message.content);
  const [currentIndex, setCurrentIndex] = useState(shouldAnimate ? 0 : message.content.length);
  const [isTyping, setIsTyping] = useState(shouldAnimate);
  
  useEffect(() => {
    if (isTyping && currentIndex < message.content.length) {
      const remainingText = message.content.slice(currentIndex);
      
      // Determine chunk size with some randomness for natural feel
      const getChunkSize = () => {
        // Look for natural breaking points
        const nextSpace = remainingText.indexOf(' ');
        const nextPunctuation = remainingText.search(/[.,!?;:\n]/);
        const nextNewline = remainingText.indexOf('\n');
        
        // Find the nearest natural break point
        const breakPoints = [nextSpace, nextPunctuation, nextNewline]
          .filter(point => point > 0)
          .sort((a, b) => a - b);
        
        if (breakPoints.length > 0) {
          const nearestBreak = breakPoints[0];
          
          // For very short segments, include the break character
          if (nearestBreak <= 3) {
            return nearestBreak + 1;
          }
          
          // For longer segments, chunk before the break
          if (nearestBreak <= 15) {
            // Random decision to break early or at the natural point
            const shouldBreakEarly = Math.random() > 0.7;
            if (shouldBreakEarly && nearestBreak > 5) {
              return Math.floor(nearestBreak * (0.3 + Math.random() * 0.5));
            }
            return nearestBreak;
          }
        }
        
        // No nearby break points, create artificial chunks
        const baseChunk = 2 + Math.floor(Math.random() * 8); // 2-9 characters
        const variation = Math.random();
        
        if (variation < 0.1) {
          // 10% chance of very small chunk (1-2 chars)
          return 1 + Math.floor(Math.random() * 2);
        } else if (variation < 0.3) {
          // 20% chance of larger chunk (10-20 chars)
          return 10 + Math.floor(Math.random() * 11);
        }
        
        return baseChunk;
      };
      
      const chunkSize = Math.min(getChunkSize(), remainingText.length);
      const chunk = remainingText.slice(0, chunkSize);
      
      // Determine delay based on chunk content and size
      const getDelay = () => {
        // Base delay that creates a feeling similar to LLM streaming
        const baseDelay = 30 + Math.random() * 50; // 30-80ms base
        
        // Check if we just finished a sentence
        const lastChar = chunk[chunk.length - 1];
        if (['.', '!', '?'].includes(lastChar)) {
          return baseDelay + 200 + Math.random() * 300; // 230-580ms pause after sentence
        }
        
        // Check for other punctuation
        if ([',', ';', ':'].includes(lastChar)) {
          return baseDelay + 100 + Math.random() * 100; // 130-280ms pause
        }
        
        // Newline gets a medium pause
        if (chunk.includes('\n')) {
          return baseDelay + 150 + Math.random() * 150; // 180-380ms pause
        }
        
        // Occasional random micro-pauses to simulate thinking
        if (Math.random() < 0.15) {
          return baseDelay + 50 + Math.random() * 150; // 80-280ms occasional pause
        }
        
        // Add slight variability based on chunk size
        const sizeMultiplier = 1 + (chunkSize / 20); // Longer chunks = slightly longer delay
        return baseDelay * sizeMultiplier;
      };
      
      const delay = getDelay();
      
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + chunk);
        setCurrentIndex(currentIndex + chunkSize);
      }, delay);
      
      return () => clearTimeout(timeout);
    } else if (currentIndex >= message.content.length && isTyping) {
      // Add a small final delay before removing the cursor
      setTimeout(() => {
        setIsTyping(false);
      }, 200);
    }
  }, [currentIndex, isTyping, message.content]);
  
  return (
    <div
      className={clsx(
        "flex flex-col",
        isUser ? "items-end" : "items-start"
      )}
    >
      {/* Show email above user messages if enabled */}
      {showUserEmail && isUser && message.email && (
        <p className="text-xs text-gray-500 mb-1 px-2">
          {message.email}
        </p>
      )}
      
      <div
        className={clsx(
          "chat-bubble",
          isUser ? "chat-bubble-user" : "chat-bubble-assistant",
          isTyping && !isUser && "assistant-typing"
        )}
      >
        <p className="whitespace-pre-wrap break-words">
          {displayedText}
          {isTyping && <span className="typewriter-cursor" />}
        </p>
        {showTimestamp && !isTyping && (
          <p
            className={clsx(
              "text-xs mt-1",
              isUser ? "text-blue-100" : "text-gray-500"
            )}
          >
            {formatTimestamp(message.timestamp)}
          </p>
        )}
      </div>
    </div>
  );
};

// Loading Indicator Component
const LoadingIndicator: React.FC = () => {
  return (
    <div className="flex justify-start">
      <div className="chat-bubble chat-bubble-assistant">
        <div className="typing-indicator">
          <span className="typing-dot" />
          <span className="typing-dot animation-delay-200" />
          <span className="typing-dot animation-delay-400" />
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;