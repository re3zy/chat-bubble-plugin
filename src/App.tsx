import { useEffect, useState, useCallback } from "react";
import "./App.css";
import {
  client,
  useConfig,
  useEditorPanelConfig,
  useActionTrigger,
  useVariable,
  useElementData,
  useElementColumns,
} from "@sigmacomputing/plugin";
import ChatInterface from "./components/ChatInterface";
import { ChatMessage } from "./types/chat.types";

// Define the structure of our chat data from Sigma - matching your CSV structure
interface SigmaChatData {
  Author?: string[];
  Message?: string[];
  Timestamp?: string[];
  email?: string[];
  RLS?: boolean[];
  ID?: string[];
}

function App() {
  // Configure the editor panel with all necessary inputs
  useEditorPanelConfig([
    // Data source configuration
    { name: "chatDataSource", type: "element", label: "Chat History Table" },
    { name: "authorColumn", type: "column", source: "chatDataSource", allowMultiple: false, label: "Author Column" },
    { name: "messageColumn", type: "column", source: "chatDataSource", allowMultiple: false, label: "Message Column" },
    { name: "timestampColumn", type: "column", source: "chatDataSource", allowMultiple: false, label: "Timestamp Column" },
    { name: "idColumn", type: "column", source: "chatDataSource", allowMultiple: false, label: "ID Column" },
    { name: "emailColumn", type: "column", source: "chatDataSource", allowMultiple: false, label: "Email Column (Optional)" },
    
    // Variable/Control configuration
    { 
      name: "promptControl", 
      type: "variable", 
      label: "Prompt Control (c_prompt-1)",
      allowedTypes: ["text"]
    },
    
    // Action trigger for the existing action chain
    {
      type: "action-trigger",
      name: "sendMessageAction",
      label: "Send Message Action (Your Action Chain)",
    },
    
    // UI Configuration
    { name: "chatTitle", type: "text", defaultValue: "AI Assistant", label: "Chat Title" },
    { name: "placeholder", type: "text", defaultValue: "Type your message...", label: "Input Placeholder" },
    { name: "showTimestamps", type: "checkbox", defaultValue: true, label: "Show Timestamps" },
    { name: "showUserEmail", type: "checkbox", defaultValue: false, label: "Show User Email" },
  ]);

  const config = useConfig();
  
  // Get chat data from Sigma
  const chatData = useElementData(config.chatDataSource) as SigmaChatData;
  const chatColumns = useElementColumns(config.chatDataSource);
  
  // Get the prompt control variable setter
  const [promptValue, setPromptValue] = useVariable(config.promptControl);
  
  // Action trigger
  const triggerSendMessage = useActionTrigger(config.sendMessageAction);
  
  // UI configuration
  const chatTitle = config.chatTitle || "AI Assistant";
  const placeholder = config.placeholder || "Type your message...";
  const showTimestamps = config.showTimestamps !== false;
  const showUserEmail = config.showUserEmail === true;
  
  // Local state for messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  
  // Transform Sigma data to our chat message format
  useEffect(() => {
    if (!chatData || !config.messageColumn || !config.authorColumn) {
      console.log("Chat data not yet available", { chatData, messageColumn: config.messageColumn, authorColumn: config.authorColumn });
      return;
    }
    
    const messageCol = config.messageColumn;
    const authorCol = config.authorColumn;
    const timestampCol = config.timestampColumn;
    const idCol = config.idColumn;
    const emailCol = config.emailColumn;
    
    const messageArray = chatData[messageCol] || [];
    const authorArray = chatData[authorCol] || [];
    const timestampArray = timestampCol ? (chatData[timestampCol] || []) : [];
    const idArray = idCol ? (chatData[idCol] || []) : [];
    const emailArray = emailCol ? (chatData[emailCol] || []) : [];
    
    console.log("Processing chat data:", {
      messageCount: messageArray.length,
      authors: authorArray,
      messages: messageArray
    });
    
    // Transform the data into ChatMessage format
    const transformedMessages: ChatMessage[] = messageArray
      .map((message, index) => {
        if (!message) return null;
        
        const author = String(authorArray[index] || '').toLowerCase();
        const email = emailArray[index] ? String(emailArray[index]) : undefined;
        
        // Check if author is "user" or contains user email/name
        const isUser = author === 'user' || 
                      author.includes('ram kaushik') || 
                      (email && author.includes(email.split('@')[0]));
        
        return {
          id: idArray[index] ? String(idArray[index]) : `msg-${index}`,
          content: String(message),
          sender: isUser ? 'user' : 'assistant',
          timestamp: timestampArray[index] ? new Date(timestampArray[index]) : new Date(),
          email: email,
        };
      })
      .filter((msg): msg is ChatMessage => msg !== null);
    
    setMessages(transformedMessages);
  }, [chatData, config.messageColumn, config.authorColumn, config.timestampColumn, config.idColumn, config.emailColumn]);
  
  // Handle sending a message
  const handleSendMessage = useCallback(async (message: string) => {
    if (!message.trim() || !triggerSendMessage) {
      console.log("Cannot send message:", { message: message.trim(), hasTrigger: !!triggerSendMessage });
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log("Sending message:", message);
      
      // Update the prompt control with the message
      if (config.promptControl && setPromptValue) {
        console.log("Updating prompt control:", config.promptControl);
        setPromptValue(message);
        
        // Small delay to ensure the control is updated
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Trigger the action chain
      // The action will read from the control we just updated
      await triggerSendMessage();
      
      console.log("Action triggered successfully");
      
      // Clear the prompt control after a short delay
      if (config.promptControl && setPromptValue) {
        setTimeout(() => {
          setPromptValue("");
        }, 200);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Show error in chat
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        content: 'Sorry, there was an error sending your message. Please make sure the Prompt Control is configured.',
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [triggerSendMessage, config.promptControl, setPromptValue]);
  
  // Debug logging
  useEffect(() => {
    console.log('Chat Plugin Status:', {
      isConfigured: !!(config.chatDataSource && config.messageColumn && config.authorColumn),
      hasActionTrigger: !!triggerSendMessage,
      hasPromptControl: !!config.promptControl,
      messageCount: messages.length,
      chatDataSource: config.chatDataSource,
      promptControl: config.promptControl,
      columns: {
        author: config.authorColumn,
        message: config.messageColumn,
        timestamp: config.timestampColumn,
      }
    });
  }, [config, messages, triggerSendMessage]);
  
  // Check if plugin is properly configured
  const isConfigured = config.chatDataSource && config.messageColumn && config.authorColumn && config.promptControl && triggerSendMessage;
  
  // Show configuration message if not properly set up
  if (!isConfigured) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 max-w-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Plugin Configuration Required</h2>
          <p className="text-gray-600 mb-6">Please configure the following in the plugin panel:</p>
          <ul className="text-left text-sm text-gray-600 space-y-2">
            {!config.chatDataSource && (
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <span><strong>Chat History Table:</strong> Select your "Chat History" table</span>
              </li>
            )}
            {!config.authorColumn && (
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <span><strong>Author Column:</strong> Select the "Author" column</span>
              </li>
            )}
            {!config.messageColumn && (
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <span><strong>Message Column:</strong> Select the "Message" column</span>
              </li>
            )}
            {!config.promptControl && (
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <span><strong>Prompt Control:</strong> Select your "c_prompt-1" control</span>
              </li>
            )}
            {!triggerSendMessage && (
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <span><strong>Send Message Action:</strong> Select your action chain</span>
              </li>
            )}
          </ul>
          <div className="mt-6 p-4 bg-blue-50 rounded-lg text-left">
            <p className="text-sm text-blue-800 mb-2">
              <strong>Setup Instructions:</strong>
            </p>
            <ol className="text-sm text-blue-700 list-decimal list-inside space-y-1">
              <li>Select your prompt control (c_prompt-1) in the "Prompt Control" dropdown</li>
              <li>Connect your action chain to "Send Message Action"</li>
              <li>Make sure your action reads from the prompt control in its first step</li>
            </ol>
            <p className="text-sm text-blue-700 mt-2">
              The plugin will update the control with the user's message before triggering your action.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full w-full">
      <ChatInterface
        messages={messages}
        onSendMessage={handleSendMessage}
        onClearChat={undefined} // Removed clear chat for now
        isLoading={isLoading}
        title={chatTitle}
        placeholder={placeholder}
        showTimestamps={showTimestamps}
        showUserEmail={showUserEmail}
      />
    </div>
  );
}

export default App;