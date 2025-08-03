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
  showUserEmail = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [userScrolled, setUserScrolled] = useState(false);
  const lastMessageCountRef = useRef(messages.length);
  
  // Track which messages are new based on timestamp
  // A message is "new" if it was created within the last 30 seconds
  const MESSAGE_AGE_THRESHOLD = 30000; // 30 seconds in milliseconds
  
  const isMessageNew = (timestamp: Date) => {
    const messageTime = new Date(timestamp).getTime();
    const currentTime = Date.now();
    const messageAge = currentTime - messageTime;
    return messageAge < MESSAGE_AGE_THRESHOLD;
  };
  
  // Determine if we should show the loading indicator
  // Show it only when the last message is from the user (waiting for ROBOT response)
  const shouldShowLoading = messages.length > 0 && 
    messages[messages.length - 1].sender === 'user';
  
  // Handle scroll events to detect if user has scrolled up
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10;
    
    setUserScrolled(!isAtBottom);
  };
  
  // Auto-scroll to bottom when new messages arrive and user hasn't scrolled up
  useEffect(() => {
    // Only scroll if we have new messages and user hasn't scrolled
    if (messages.length > lastMessageCountRef.current && !userScrolled) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
    lastMessageCountRef.current = messages.length;
  }, [messages.length, userScrolled]);
  
  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isLoading || shouldShowLoading) return;
    
    const message = inputValue.trim();
    setInputValue('');
    
    // Reset scroll position when user sends a message
    setUserScrolled(false);
    
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
      <div 
        ref={messagesContainerRef}
        className="chat-messages"
        onScroll={handleScroll}
      >
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
                showUserEmail={showUserEmail}
                formatTimestamp={formatTimestamp}
                shouldAnimate={
                  message.sender === 'assistant' && 
                  index === messages.length - 1 &&
                  isMessageNew(message.timestamp)
                }
              />
            ))}
            {shouldShowLoading && <LoadingIndicator />}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Scroll to bottom button (appears when user scrolls up) */}
      {userScrolled && (
        <button
          onClick={() => {
            setUserScrolled(false);
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="absolute bottom-20 right-4 bg-white border border-gray-300 rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-200"
          aria-label="Scroll to bottom"
        >
          <svg 
            className="w-5 h-5 text-gray-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 14l-7 7m0 0l-7-7m7 7V3" 
            />
          </svg>
        </button>
      )}
      
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
            disabled={isLoading || shouldShowLoading}
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
            disabled={!inputValue.trim() || isLoading || shouldShowLoading}
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
  showUserEmail: boolean;
  formatTimestamp: (date: Date) => string;
  shouldAnimate: boolean;
}

const AnimatedMessageBubble: React.FC<AnimatedMessageBubbleProps> = ({
  message,
  showUserEmail,
  formatTimestamp,
  shouldAnimate,
}) => {
  const isUser = message.sender === 'user';
  const [displayedText, setDisplayedText] = useState(shouldAnimate ? '' : message.content);
  const [currentIndex, setCurrentIndex] = useState(shouldAnimate ? 0 : message.content.length);
  const [isTyping, setIsTyping] = useState(shouldAnimate);
  const [isHovered, setIsHovered] = useState(false);
  
  useEffect(() => {
    // Only run animation logic if we're currently typing
    if (!isTyping || currentIndex >= message.content.length) {
      if (isTyping && currentIndex >= message.content.length) {
        // Animation complete
        setTimeout(() => {
          setIsTyping(false);
        }, 200);
      }
      return;
    }
    
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
      setCurrentIndex(prev => prev + chunkSize);
    }, delay);
    
    return () => clearTimeout(timeout);
  }, [currentIndex, isTyping, message.content.length]); // Fixed dependencies
  
  return (
    <div
      className={clsx(
        "group flex items-start gap-0",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* Timestamp on the left for assistant messages */}
      {!isUser && (
        <div 
          className={clsx(
            "text-xs text-gray-500 transition-all duration-500 ease-in-out whitespace-nowrap self-end mb-2 mr-2",
            isHovered && !isTyping ? "opacity-100 w-12" : "opacity-0 w-0 overflow-hidden"
          )}
        >
          {formatTimestamp(message.timestamp)}
        </div>
      )}
      
      <div 
        className={clsx(
          "flex flex-col transition-transform duration-500 ease-in-out",
          isUser && isHovered && "translate-x-[-1rem]",
          !isUser && isHovered && "translate-x-[1rem]"
        )}
      >
        {/* Show email above user messages if enabled */}
        {showUserEmail && isUser && message.email && (
          <p className="text-xs text-gray-500 mb-1 px-2 text-right">
            {message.email}
          </p>
        )}
        
        <div
          className={clsx(
            "chat-bubble",
            isUser ? "chat-bubble-user" : "chat-bubble-assistant",
            isTyping && !isUser && "assistant-typing"
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <p className="whitespace-pre-wrap break-words">
            {displayedText}
            {isTyping && <span className="typewriter-cursor" />}
          </p>
        </div>
      </div>
      
      {/* Timestamp on the right for user messages */}
      {isUser && (
        <div 
          className={clsx(
            "text-xs text-gray-500 transition-all duration-500 ease-in-out whitespace-nowrap self-end mb-2 ml-2",
            isHovered ? "opacity-100 w-12" : "opacity-0 w-0 overflow-hidden"
          )}
        >
          {formatTimestamp(message.timestamp)}
        </div>
      )}
    </div>
  );
};

// Loading Indicator Component
const LoadingIndicator: React.FC = () => {
  return (
    <div className="flex justify-start">
      <div className="chat-bubble chat-bubble-assistant flex items-center min-h-[2.5rem]">
        <div className="typing-indicator">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;