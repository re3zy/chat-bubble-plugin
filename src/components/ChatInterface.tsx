import React, { useState, useRef, useEffect } from 'react';
import { ChatInterfaceProps, ChatMessage, ColorConfig } from '../types/chat.types';
import { format, isToday, isYesterday, isWithinInterval, subDays, isSameDay, isSameYear } from 'date-fns';
import clsx from 'clsx';

// Default color configuration
const DEFAULT_COLORS: ColorConfig = {
  backgroundColor: '#F2F2F7',
  userBubbleColor: '#007AFF',
  userTextColor: '#FFFFFF',
  assistantBubbleColor: '#E9E9EB',
  assistantTextColor: '#000000',
  headerBackgroundColor: '#FFFFFF',
  headerTextColor: '#1F2937',
  inputBackgroundColor: '#F3F4F6',
  inputTextColor: '#1F2937',
  buttonBackgroundColor: '#3B82F6',
  buttonTextColor: '#FFFFFF',
  timestampColor: '#6B7280',
  dayStampBackgroundColor: '#F3F4F6',
  dayStampTextColor: '#6B7280',
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  onClearChat,
  isLoading = false,
  placeholder = 'Type your message...',
  showUserEmail = false,
  colorConfig = DEFAULT_COLORS,
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
    return format(date, 'h:mm a'); // Using 12-hour format with AM/PM
  };
  
  // Function to generate the day stamp label
  const getDayStamp = (date: Date): string => {
    const messageDate = new Date(date);
    const now = new Date();
    
    if (isToday(messageDate)) {
      return 'Today';
    }
    
    if (isYesterday(messageDate)) {
      return 'Yesterday';
    }
    
    // Check if within the last 7 days
    const sevenDaysAgo = subDays(now, 7);
    if (isWithinInterval(messageDate, { start: sevenDaysAgo, end: now })) {
      return format(messageDate, 'EEEE'); // Full day name like "Monday"
    }
    
    // For older messages, show full date
    if (isSameYear(messageDate, now)) {
      return format(messageDate, 'EEE, MMM d'); // e.g., "Sat, Jul 5"
    } else {
      return format(messageDate, 'MMM d, yyyy'); // e.g., "Jul 5, 2023"
    }
  };
  
  // Function to determine if we should show a day stamp before this message
  const shouldShowDayStamp = (currentMessage: ChatMessage, previousMessage: ChatMessage | null): boolean => {
    if (!previousMessage) {
      // Always show day stamp for the first message
      return true;
    }
    
    const currentDate = new Date(currentMessage.timestamp);
    const previousDate = new Date(previousMessage.timestamp);
    
    // Show day stamp if the messages are on different days
    return !isSameDay(currentDate, previousDate);
  };
  
  return (
    <div className="chat-container" style={{ backgroundColor: colorConfig.backgroundColor }}>
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
            {messages.map((message, index) => {
              const previousMessage = index > 0 ? messages[index - 1] : null;
              const showDayStamp = shouldShowDayStamp(message, previousMessage);
              
              return (
                <React.Fragment key={message.id}>
                  {showDayStamp && (
                    <DayStamp 
                      date={message.timestamp} 
                      getDayStamp={getDayStamp}
                      formatTimestamp={formatTimestamp}
                      colorConfig={colorConfig}
                    />
                  )}
                  <AnimatedMessageBubble
                    message={message}
                    showUserEmail={showUserEmail}
                    formatTimestamp={formatTimestamp}
                    shouldAnimate={
                      message.sender === 'assistant' && 
                      index === messages.length - 1 &&
                      isMessageNew(message.timestamp)
                    }
                    colorConfig={colorConfig}
                  />
                </React.Fragment>
              );
            })}
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
      <form onSubmit={handleSubmit} className="chat-input-container border-t border-gray-200" style={{ backgroundColor: colorConfig.headerBackgroundColor }}>
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
              "flex-1 px-4 py-2 rounded-full",
              "placeholder-gray-500",
              "focus:outline-none focus:ring-2 focus:ring-offset-2",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all duration-200"
            )}
            style={{
              backgroundColor: colorConfig.inputBackgroundColor,
              color: colorConfig.inputTextColor,
              '--tw-ring-color': colorConfig.buttonBackgroundColor,
            } as React.CSSProperties}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading || shouldShowLoading}
            className={clsx(
              "px-6 py-2 rounded-full font-medium",
              "hover:opacity-90 active:opacity-80",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-offset-2"
            )}
            style={{
              backgroundColor: colorConfig.buttonBackgroundColor,
              color: colorConfig.buttonTextColor,
              '--tw-ring-color': colorConfig.buttonBackgroundColor,
            } as React.CSSProperties}
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

// Day Stamp Component
interface DayStampProps {
  date: Date;
  getDayStamp: (date: Date) => string;
  formatTimestamp: (date: Date) => string;
  colorConfig: ColorConfig;
}

const DayStamp: React.FC<DayStampProps> = ({ date, getDayStamp, formatTimestamp, colorConfig }) => {
  const dayLabel = getDayStamp(date);
  const timeLabel = formatTimestamp(date);
  
  return (
    <div className="flex justify-center my-4">
      <div 
        className="text-xs px-3 py-1 rounded-full"
        style={{ 
          backgroundColor: colorConfig.dayStampBackgroundColor,
          color: colorConfig.dayStampTextColor 
        }}
      >
        {dayLabel} {timeLabel}
      </div>
    </div>
  );
};

// Animated Message Bubble Component with Typewriter Effect
interface AnimatedMessageBubbleProps {
  message: ChatMessage;
  showUserEmail: boolean;
  formatTimestamp: (date: Date) => string;
  shouldAnimate: boolean;
  colorConfig: ColorConfig;
}

const AnimatedMessageBubble: React.FC<AnimatedMessageBubbleProps> = ({
  message,
  showUserEmail,
  formatTimestamp,
  shouldAnimate,
  colorConfig,
}) => {
  const isUser = message.sender === 'user';
  const [displayedText, setDisplayedText] = useState(shouldAnimate ? '' : message.content);
  const [currentIndex, setCurrentIndex] = useState(shouldAnimate ? 0 : message.content.length);
  const [isTyping, setIsTyping] = useState(shouldAnimate);
  
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
  }, [currentIndex, isTyping, message.content.length]);
  
  return (
    <div
      className={clsx(
        "group flex flex-col gap-0.5 mb-3",
        isUser ? "items-end" : "items-start"
      )}
    >
      {/* Timestamp - Always visible above the bubble */}
      <div className="text-xs px-2" style={{ color: colorConfig.timestampColor }}>
        {formatTimestamp(message.timestamp)}
      </div>
      
      {/* Show email above user messages if enabled */}
      {showUserEmail && isUser && message.email && (
        <p className="text-xs px-2 mb-1" style={{ color: colorConfig.timestampColor }}>
          {message.email}
        </p>
      )}
      
      {/* Message bubble */}
      <div
        className={clsx(
          "chat-bubble",
          isTyping && !isUser && "assistant-typing"
        )}
        style={{
          backgroundColor: isUser ? colorConfig.userBubbleColor : colorConfig.assistantBubbleColor,
          color: isUser ? colorConfig.userTextColor : colorConfig.assistantTextColor,
          borderBottomRightRadius: isUser ? '0.25rem' : undefined,
          borderBottomLeftRadius: !isUser ? '0.25rem' : undefined,
        }}
      >
        <p className="whitespace-pre-wrap break-words">
          {displayedText}
          {isTyping && <span className="typewriter-cursor" />}
        </p>
      </div>
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