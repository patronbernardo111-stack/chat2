import React, { useState, useEffect, useRef, useCallback } from 'react';
import { chatAPI, contactsAPI } from './api';
import { Avatar } from './Avatar';
import { CameraModal } from './CameraModal';

interface Message {
  id: string;
  text?: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'location' | 'contact';
  sender_id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  reply_to?: string;
  file_url?: string;
  file_type?: string;
  file_size?: number;
  thumbnail_url?: string;
  duration?: number;
  location?: { lat: number; lng: number; address?: string };
  contact_data?: any;
  created_at: string;
  updated_at?: string;
  sender?: {
    id: string;
    phone: string;
    full_name: string;
    avatar_url?: string;
  };
}

interface Chat {
  id: string;
  type: 'private' | 'group';
  name?: string;
  avatar_url?: string;
  participants: Array<{
    user_id: string;
    phone?: string;
    full_name?: string;
    avatar_url?: string;
  }>;
  last_message?: Message;
  unread_count: number;
  updated_at: string;
}

interface User {
  id: string;
  phone: string;
  full_name: string;
  avatar_url?: string;
}

export const ChatView: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar chats
  useEffect(() => {
    loadChats();
  }, []);

  // Cargar mensajes cuando se selecciona un chat
  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.id);
      // Marcar como leídos
      if (selectedChat.unread_count > 0) {
        markAsRead(selectedChat.id);
      }
    }
  }, [selectedChat]);

  // Scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simular usuarios en línea
  useEffect(() => {
    const interval = setInterval(() => {
      // Simular cambios de estado online
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        // Simular que algunos usuarios se conectan/desconectan
        if (Math.random() > 0.7) {
          const randomUserId = Math.random().toString();
          if (newSet.has(randomUserId)) {
            newSet.delete(randomUserId);
          } else {
            newSet.add(randomUserId);
          }
        }
        return newSet;
      });
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const loadChats = async () => {
    try {
      setIsLoading(true);
      const data = await chatAPI.getChats();
      setChats(data || []);
    } catch (error) {
      console.error('Error cargando chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      const data = await chatAPI.getMessages(chatId);
      setMessages(data || []);
    } catch (error) {
      console.error('Error cargando mensajes:', error);
    }
  };

  const markAsRead = async (chatId: string) => {
    try {
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        await chatAPI.markAsRead(chatId, lastMessage.id);
      }
    } catch (error) {
      console.error('Error marcando como leído:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && !selectedChat) return;

    try {
      const messageData: any = {
        text: newMessage.trim(),
        type: 'text'
      };

      const sentMessage = await chatAPI.sendMessage(selectedChat.id, messageData);
      
      // Agregar mensaje a la lista
      setMessages(prev => [...prev, sentMessage]);
      setNewMessage('');
      
      // Actualizar último mensaje en la lista de chats
      setChats(prev => prev.map(chat => 
        chat.id === selectedChat.id 
          ? { ...chat, last_message: sentMessage, updated_at: new Date().toISOString() }
          : chat
      ));
    } catch (error) {
      console.error('Error enviando mensaje:', error);
    }
  };

  const sendFile = async (file: File) => {
    if (!selectedChat) return;

    try {
      // Subir archivo primero
      const uploadResult = await chatAPI.uploadFile(selectedChat.id, file);
      
      // Luego enviar mensaje con el archivo
      const messageData = {
        type: file.type.startsWith('image/') ? 'image' : 'file',
        file_url: uploadResult.file_url,
        file_type: file.type,
        file_size: file.size,
        thumbnail_url: uploadResult.thumbnail_url
      };

      const sentMessage = await chatAPI.sendMessage(selectedChat.id, messageData);
      setMessages(prev => [...prev, sentMessage]);
      
      // Actualizar chats
      setChats(prev => prev.map(chat => 
        chat.id === selectedChat.id 
          ? { ...chat, last_message: sentMessage, updated_at: new Date().toISOString() }
          : chat
      ));
    } catch (error) {
      console.error('Error enviando archivo:', error);
    }
  };

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await chatAPI.searchUsers(query);
      setSearchResults(results || []);
    } catch (error) {
      console.error('Error buscando usuarios:', error);
    }
  };

  const createPrivateChat = async (userId: string) => {
    try {
      const chat = await chatAPI.createPrivate(userId);
      setChats(prev => [chat, ...prev]);
      setSelectedChat(chat);
      setShowSearch(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error creando chat privado:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'short' 
      });
    }
  };

  const renderMessage = (message: Message) => {
    const isOwn = message.sender_id === message.sender?.id;
    const showAvatar = !isOwn || (selectedChat?.type === 'group');

    return (
      <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
        {showAvatar && (
          <div className="flex-shrink-0 mr-2">
            <Avatar 
              src={message.sender?.avatar_url} 
              name={message.sender?.full_name || 'Usuario'} 
              size="sm" 
            />
          </div>
        )}
        
        <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : ''}`}>
          <div className={`px-4 py-2 rounded-2xl ${
            isOwn 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-900'
          }`}>
            {message.type === 'text' && (
              <p className="text-sm whitespace-pre-wrap">{message.text}</p>
            )}
            
            {message.type === 'image' && message.file_url && (
              <div className="space-y-2">
                <img 
                  src={message.thumbnail_url || message.file_url} 
                  alt="Imagen" 
                  className="rounded-lg max-w-full cursor-pointer"
                  onClick={() => window.open(message.file_url, '_blank')}
                />
                {message.text && <p className="text-sm">{message.text}</p>}
              </div>
            )}
            
            {message.type === 'file' && (
              <div className="flex items-center space-x-2 p-2">
                <div className="w-10 h-10 bg-gray-300 rounded flex items-center justify-center">
                  <span className="text-xs">📄</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Archivo</p>
                  <p className="text-xs opacity-70">
                    {message.file_size ? `${(message.file_size / 1024).toFixed(1)} KB` : ''}
                  </p>
                </div>
              </div>
            )}
            
            {message.reply_to && (
              <div className="text-xs opacity-70 mb-1 border-l-2 border-gray-400 pl-2">
                Respondiendo a un mensaje
              </div>
            )}
          </div>
          
          <div className={`flex items-center space-x-1 mt-1 text-xs ${
            isOwn ? 'justify-end text-blue-200' : 'text-gray-500'
          }`}>
            <span>{formatTime(message.created_at)}</span>
            {isOwn && (
              <span className="ml-1">
                {message.status === 'sent' && '✓'}
                {message.status === 'delivered' && '✓✓'}
                {message.status === 'read' && '✓✓'}
                {message.status === 'failed' && '❌'}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderChatItem = (chat: Chat) => {
    const otherParticipant = chat.participants.find(p => p.user_id !== chat.participants[0]?.user_id);
    const chatName = chat.type === 'private' 
      ? otherParticipant?.full_name || 'Usuario'
      : chat.name || 'Grupo';
    
    const lastMessageText = chat.last_message?.type === 'text' 
      ? chat.last_message.text 
      : chat.last_message?.type === 'image' 
        ? '📷 Foto' 
        : chat.last_message?.type === 'file'
          ? '📄 Archivo'
          : 'Mensaje';

    return (
      <div
        key={chat.id}
        onClick={() => setSelectedChat(chat)}
        className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b ${
          selectedChat?.id === chat.id ? 'bg-blue-50' : ''
        }`}
      >
        <div className="flex-shrink-0 mr-3">
          <Avatar 
            src={chat.avatar_url || otherParticipant?.avatar_url} 
            name={chatName} 
            size="md" 
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-semibold text-gray-900 truncate">
              {chatName}
            </h3>
            <span className="text-xs text-gray-500 ml-2">
              {formatTime(chat.updated_at)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600 truncate">
              {lastMessageText}
            </p>
            {chat.unread_count > 0 && (
              <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 ml-2">
                {chat.unread_count}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (selectedChat) {
    const chatName = selectedChat.type === 'private'
      ? selectedChat.participants.find(p => p.user_id !== selectedChat.participants[0]?.user_id)?.full_name || 'Usuario'
      : selectedChat.name || 'Grupo';

    return (
      <div
        className="flex flex-col bg-white"
        style={{ height: '100dvh', maxHeight: '100dvh' }}
      >
        {/* Header — sticky so it stays visible when the keyboard opens */}
        <div
          className="flex items-center p-4 border-b bg-white z-10"
          style={{ position: 'sticky', top: 0, flexShrink: 0 }}
        >
          <button
            onClick={() => setSelectedChat(null)}
            className="mr-3 p-2 hover:bg-gray-100 rounded-full"
          >
            ←
          </button>
          
          <Avatar 
            src={selectedChat.avatar_url} 
            name={chatName} 
            size="md" 
          />
          
          <div className="ml-3 flex-1">
            <h2 className="font-semibold text-gray-900">{chatName}</h2>
            <p className="text-sm text-green-500">
              {selectedChat.type === 'group' ? `${selectedChat.participants.length} miembros` : 'En línea'}
            </p>
          </div>
          
          <button className="p-2 hover:bg-gray-100 rounded-full">
            ⋮
          </button>
        </div>

        {/* Messages — takes remaining space and scrolls internally */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ overscrollBehavior: 'contain' }}>
          {messages.map(renderMessage)}
          <div ref={messagesEndRef} />
        </div>

        {/* Input — stays above the keyboard */}
        <div className="border-t p-4 bg-white" style={{ flexShrink: 0 }}>
          <div className="flex items-center space-x-2">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) sendFile(file);
              }}
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              📎
            </button>
            
            <button
              onClick={() => setShowCamera(true)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              📷
            </button>
            
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Escribe un mensaje..."
              className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50"
            >
              Enviar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-gray-50" style={{ height: '100dvh', maxHeight: '100dvh' }}>
      {/* Header */}
      <div className="bg-white border-b p-4" style={{ position: 'sticky', top: 0, zIndex: 10, flexShrink: 0 }}>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-gray-900">Mensajes</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowSearch(true)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              🔍
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              ✏️
            </button>
          </div>
        </div>
        
        {showSearch && (
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchUsers(e.target.value);
              }}
              placeholder="Buscar usuarios..."
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            
            <button
              onClick={() => {
                setShowSearch(false);
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="absolute right-2 top-2 p-1 hover:bg-gray-100 rounded"
            >
              ✕
            </button>
            
            {searchResults.length > 0 && (
              <div className="absolute top-12 left-0 right-0 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto z-10">
                {searchResults.map(user => (
                  <div
                    key={user.id}
                    onClick={() => createPrivateChat(user.id)}
                    className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b"
                  >
                    <Avatar src={user.avatar_url} name={user.full_name} size="sm" />
                    <div className="ml-3">
                      <p className="font-medium">{user.full_name}</p>
                      <p className="text-sm text-gray-500">{user.phone}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : chats.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No tienes chats aún</p>
            <button
              onClick={() => setShowSearch(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Buscar usuarios para empezar
            </button>
          </div>
        ) : (
          chats.map(renderChatItem)
        )}
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <CameraModal
          onClose={() => setShowCamera(false)}
          onCapture={(file) => {
            sendFile(file);
            setShowCamera(false);
          }}
        />
      )}
    </div>
  );
};

export default ChatView;
