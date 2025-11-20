import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, Bot, User, ArrowRight, AlertTriangle, X, Check } from 'lucide-react';
import { getStyleAdvice } from '../services/geminiService';
import { AIStatus, StyleRecommendation, ChatMessage } from '../types';
import { Button } from './Button';

interface AIStylistProps {
  onSelectStyle: (styleNote: string) => void;
}

interface RecommendationCardProps {
  rec: StyleRecommendation;
  index: number;
  onSelect: (rec: StyleRecommendation) => void;
}

// Sub-component for individual cards to handle Image Loading & Read More state independently
const RecommendationCard: React.FC<RecommendationCardProps> = ({ rec, index, onSelect }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-dark-900 border border-gold-500/30 rounded-xl overflow-hidden hover:border-gold-500 transition-all group flex flex-col shadow-lg shadow-black/20 text-left h-full">
        {/* Image Section */}
        <div className="h-48 w-full relative bg-dark-800 flex items-center justify-center overflow-hidden flex-shrink-0">
            {!imageLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 z-10 bg-dark-800">
                    <Loader2 className="w-8 h-8 animate-spin text-gold-500 mb-2" />
                    <span className="text-xs font-medium text-gray-400">Generating visual...</span>
                </div>
            )}
            <img 
                src={`https://image.pollinations.ai/prompt/${encodeURIComponent(rec.imageKeyword)}?width=400&height=300&nologo=true&seed=${index}`} 
                alt={rec.title}
                className={`w-full h-full object-cover object-top transition-all duration-700 ${imageLoaded ? 'opacity-80 group-hover:opacity-100 group-hover:scale-110' : 'opacity-0'}`}
                onLoad={() => setImageLoaded(true)}
                loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 p-4 z-20">
                <h4 className="font-bold text-white text-lg drop-shadow-md">{rec.title}</h4>
            </div>
        </div>
        
        {/* Content Section */}
        <div className="p-4 flex flex-col flex-1">
            <div className="flex-1 mb-4">
                <p className={`text-gray-400 text-sm leading-relaxed transition-all duration-300 ${isExpanded ? '' : 'line-clamp-4'}`}>
                    {rec.description}
                </p>
                {rec.description.length > 150 && (
                  <button 
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="text-gold-500 text-xs mt-2 hover:text-gold-400 font-semibold focus:outline-none"
                  >
                      {isExpanded ? 'Tutup' : 'Baca selengkapnya...'}
                  </button>
                )}
            </div>
            
            <button
                onClick={() => onSelect(rec)}
                className="w-full py-2 bg-gold-500 text-dark-900 hover:bg-gold-400 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 active:scale-95 mt-auto"
            >
                Pilih Gaya Ini <ArrowRight className="w-4 h-4" />
            </button>
        </div>
    </div>
  );
};

export const AIStylist: React.FC<AIStylistProps> = ({ onSelectStyle }) => {
  const [query, setQuery] = useState('');
  
  const INITIAL_MESSAGE: ChatMessage = { 
    role: 'model', 
    text: "Halo bro! Gue AI Stylist GantengMaksimal. Sebelum gue kasih saran potongan paling kece, kasih tau dulu dong bentuk wajah lo kayak gimana? (Bulat, Kotak, Oval?)" 
  };

  // Initial state: AI greets the user
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  
  const [status, setStatus] = useState<AIStatus>(AIStatus.IDLE);
  const [pendingStyle, setPendingStyle] = useState<StyleRecommendation | null>(null); // For confirmation modal
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Track first render to prevent initial auto-focus
  const isFirstRender = useRef(true);

  // Smart scroll logic
  const scrollToBottom = (force = false) => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      // Check if user is near bottom (within 100px)
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      
      if (force || isNearBottom) {
        chatContainerRef.current.scrollTo({
          top: scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  };

  // Auto resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`; // Max height 150px
    }
  };

  // Handle Key Press (Enter to send, Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleConsultation();
    }
  };

  // Effect for scrolling when messages change
  useEffect(() => {
    // Only force scroll if the last message is from user (they just sent it)
    // Otherwise (AI responded), only scroll if they were already at bottom
    const lastMsg = messages[messages.length - 1];
    const isUserMsg = lastMsg?.role === 'user';
    scrollToBottom(isUserMsg);
  }, [messages, status]);

  // Auto-focus input logic
  useEffect(() => {
    // Skip auto-focus on initial mount so user sees header first
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Logic: Focus input when AI finishes loading (becomes SUCCESS or ERROR) or goes back to IDLE
    if (status !== AIStatus.LOADING && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  }, [status]);

  const handleConsultation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    const userText = query;
    setQuery('');
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    setStatus(AIStatus.LOADING);

    // 1. Add User Message to UI & History
    const newHistory: ChatMessage[] = [
      ...messages,
      { role: 'user', text: userText }
    ];
    setMessages(newHistory);

    // 2. Call API with FULL history
    const aiResponse = await getStyleAdvice(newHistory);
    
    // 3. Handle Response
    if (aiResponse.type === 'recommendation' && aiResponse.data) {
      // AI gives recommendations (Cards)
      setMessages(prev => [
        ...prev, 
        { 
          role: 'model', 
          text: "Oke, berdasarkan info yang lo kasih, ini rekomendasi terbaik buat lo:",
          recommendations: aiResponse.data 
        }
      ]);
    } else {
      // AI continues conversation/interview (Text)
      setMessages(prev => [
        ...prev, 
        { 
          role: 'model', 
          text: aiResponse.text || "Sorry bro, bisa ulang lagi?" 
        }
      ]);
    }

    setStatus(AIStatus.SUCCESS);
  };

  // Handle Confirmation Flow
  const confirmSelection = () => {
    if (pendingStyle) {
      const formattedNote = `Gaya Pilihan: ${pendingStyle.title}\n\nDetail & Alasan:\n${pendingStyle.description}`;
      onSelectStyle(formattedNote);
      
      // Reset Chat
      setMessages([INITIAL_MESSAGE]);
      setPendingStyle(null);
    }
  };

  return (
    <>
      <div className="bg-dark-800 border border-dark-700 rounded-2xl shadow-2xl flex flex-col h-[500px] md:h-[600px] relative overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-dark-700 flex items-center gap-3 bg-dark-900/50 rounded-t-2xl flex-shrink-0">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Sparkles className="text-purple-400 w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">AI Hair Consultant</h3>
            <p className="text-gray-400 text-xs">Konsultasi dulu, ganteng kemudian.</p>
          </div>
        </div>

        {/* Chat Area */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-gold-500 text-dark-900' : 'bg-purple-500 text-white'
              }`}>
                {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              
              {/* Content */}
              <div className={`max-w-[90%] md:max-w-[85%] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                
                {/* Text Bubble */}
                <div className={`inline-block px-4 py-3 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-dark-700 text-white rounded-tr-none' 
                    : 'bg-dark-900 border border-dark-600 text-gray-200 rounded-tl-none'
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed text-left">{msg.text}</p>
                </div>

                {/* Recommendation Cards (Only if present) */}
                {msg.recommendations && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4">
                    {msg.recommendations.map((rec, i) => (
                      <RecommendationCard 
                        key={i} 
                        rec={rec} 
                        index={i} 
                        onSelect={(r) => setPendingStyle(r)} 
                      />
                    ))}
                  </div>
                )}

              </div>
            </div>
          ))}

          {status === AIStatus.LOADING && (
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center animate-pulse">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-dark-900/50 px-4 py-2 rounded-2xl rounded-tl-none">
                <div className="flex gap-1 items-center h-6">
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}/>
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}/>
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}/>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-dark-900/50 border-t border-dark-700 flex-shrink-0">
          <div className="relative flex items-end bg-dark-800 rounded-2xl border border-dark-600 focus-within:border-gold-500 focus-within:ring-1 focus-within:ring-gold-500 transition-all">
            <textarea
              ref={textareaRef}
              value={query}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Jawab pertanyaan AI..."
              rows={1}
              className="w-full bg-transparent text-white py-3 pl-4 pr-12 outline-none resize-none max-h-[150px] overflow-y-auto scrollbar-hide"
              disabled={status === AIStatus.LOADING}
            />
            <button
              onClick={() => handleConsultation()}
              disabled={status === AIStatus.LOADING || !query.trim()}
              className="absolute right-2 bottom-2 p-2 bg-gold-500 text-dark-900 rounded-xl hover:bg-gold-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-gold-500/20"
            >
              {status === AIStatus.LOADING ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-[10px] text-gray-500 mt-2 ml-1">Tekan Enter untuk kirim, Shift + Enter untuk baris baru</p>
        </div>
      </div>

      {/* Confirmation Modal */}
      {pendingStyle && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-dark-800 border border-gold-500/50 rounded-2xl max-w-md w-full p-6 shadow-2xl transform transition-all scale-100">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 bg-gold-500/20 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-gold-500" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-white mb-2">Konfirmasi Pilihan</h3>
              <p className="text-gray-300">
                Apakah Anda yakin ingin memilih gaya <span className="text-gold-500 font-bold">"{pendingStyle.title}"</span>?
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Chat akan dibersihkan dan saran akan otomatis disalin ke form booking.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="secondary" 
                onClick={() => setPendingStyle(null)}
                className="w-full"
              >
                Batal
              </Button>
              <Button 
                variant="primary" 
                onClick={confirmSelection}
                className="w-full"
              >
                Ya, Lanjut Booking
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};