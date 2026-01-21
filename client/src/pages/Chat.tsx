import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { Send, Users, MessageCircle } from 'lucide-react';

const Chat = () => {
  const { user } = useAuth();
  const { messages, onlineUsers, sendMessage: sendChatMessage, markAsRead } = useChat();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Mark messages as read when component mounts
    markAsRead();
    scrollToBottom();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    sendChatMessage(newMessage);
    setNewMessage('');
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Chat Proclamatori</h1>
            <p className="page-subtitle">Comunica con gli altri proclamatori</p>
          </div>
        </div>
      </motion.div>

      {/* Chat Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-0 overflow-hidden flex flex-col"
        style={{ height: 'calc(100vh - 280px)', minHeight: '520px' }}
      >
        {/* Chat Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-black/20 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-white/80" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Chat generale</p>
              <p className="text-xs text-white/60">Messaggi in tempo reale</p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 bg-green-400/15 text-green-200 border border-green-400/20 rounded-lg">
            <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">{onlineUsers} online</span>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-4 px-5 py-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/50 px-6">
              <MessageCircle className="w-16 h-16 mb-4" />
              <p className="font-semibold">Nessun messaggio ancora</p>
              <p className="text-sm text-white/60">Inizia la conversazione!</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const msgUserId = typeof msg.user === 'object' ? (msg.user._id || msg.user) : msg.user;
              const isMyMessage = user?.id === msgUserId;
              const showAvatar =
                index === 0 ||
                (typeof messages[index - 1].user === 'object' && typeof msg.user === 'object' &&
                 messages[index - 1].user?.firstName !== msg.user?.firstName);

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-md ${
                      isMyMessage ? 'items-end' : 'items-start'
                    } flex flex-col`}
                  >
                    {showAvatar && !isMyMessage && typeof msg.user === 'object' && (
                                        <span className="text-xs font-medium text-white/70 mb-1 ml-2">
                        {msg.user.firstName} {msg.user.lastName} (
                        {msg.user.gender === 'male' ? 'Fratello' : 'Sorella'})
                      </span>
                    )}
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        isMyMessage
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/10'
                          : 'bg-black/20 text-white border border-white/10'
                      }`}
                    >
                      <p className="break-words">{msg.message}</p>
                    </div>
                                      <span className="text-xs text-white/50 mt-1 mx-2">
                      {new Date(msg.timestamp).toLocaleTimeString('it-IT', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="sticky bottom-0 border-t border-white/10 bg-black/20 backdrop-blur-xl p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Scrivi un messaggio..."
              className="input-field flex-1"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="btn-primary px-5 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Invia"
            >
              <Send className="w-5 h-5" />
              <span className="hidden sm:inline">Invia</span>
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Chat;
