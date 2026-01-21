import React, { createContext, useContext, useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useLocation } from 'react-router-dom';

interface Message {
  _id?: string;
  user: {
    _id?: string;
    firstName: string;
    lastName: string;
    gender: string;
  };
  message: string;
  timestamp: Date;
}

interface ChatContextType {
  socket: Socket | null;
  messages: Message[];
  unreadCount: number;
  onlineUsers: number;
  sendMessage: (message: string) => void;
  markAsRead: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState(0);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!user) return;

    const newSocket = io('http://localhost:5001', {
      withCredentials: true
    });

    newSocket.on('connect', () => {
      console.log('Chat socket connected');
      newSocket.emit('join-chat', user.id);
    });

    newSocket.on('online-users', (count: number) => {
      setOnlineUsers(count);
    });

    newSocket.on('chat-message', (message: Message) => {
      setMessages((prev) => [...prev, message]);

      // Increment unread count if user is not on chat page
      if (location.pathname !== '/chat') {
        setUnreadCount((prev) => prev + 1);
      }
    });

    newSocket.on('chat-history', (history: Message[]) => {
      setMessages(history);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  // Mark messages as read when user navigates to chat page
  useEffect(() => {
    if (location.pathname === '/chat') {
      setUnreadCount(0);
    }
  }, [location.pathname]);

  const sendMessage = (message: string) => {
    if (!socket || !message.trim()) return;

    socket.emit('send-message', {
      message,
      userId: user?.id,
      userInfo: {
        firstName: user?.firstName,
        lastName: user?.lastName,
        gender: user?.gender
      }
    });
  };

  const markAsRead = () => {
    setUnreadCount(0);
  };

  return (
    <ChatContext.Provider
      value={{
        socket,
        messages,
        unreadCount,
        onlineUsers,
        sendMessage,
        markAsRead
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};
