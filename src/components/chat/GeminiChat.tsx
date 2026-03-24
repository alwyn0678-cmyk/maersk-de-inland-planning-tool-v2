import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Bot, User, Send, Loader2, Lightbulb, X, MessageCircle, Sparkles } from 'lucide-react';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Message {
  role: 'user' | 'model';
  content: string;
}

export function GeminiChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: '👋 **Hello! I am your Maersk AI Assistant.**\n\nI am here to help you with inland planning. If you get stuck, need guidance on routing, or want to check yard opening times (YOT) and customs rules, just ask me!\n\n*Try asking: "What is the YOT for Duisburg?" or "How does the customs deadline work for Rotterdam?"*' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const initChat = () => {
    if (!chatRef.current) {
      chatRef.current = ai.chats.create({
        model: 'gemini-3.1-pro-preview',
        config: {
          systemInstruction: 'You are an expert Maersk Inland Operations assistant. You help planners understand routing, schedules, yard opening times (YOT), and customs rules for Germany, Rotterdam, and Antwerp. You can also use Google Maps to find nearby depots or terminals. Keep answers concise, professional, and operational.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
          tools: [{ googleMaps: {} }],
        }
      });
    }
    return chatRef.current;
  };

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;

    const userMsg = text.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const chat = initChat();
      const response = await chat.sendMessage({ message: userMsg });
      
      let responseText = response.text || '';
      
      // Extract Maps URLs if available
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        const mapLinks = chunks
          .filter((chunk: any) => chunk.maps?.uri)
          .map((chunk: any) => `\n- [${chunk.maps.title || 'View on Google Maps'}](${chunk.maps.uri})`)
          .join('');
        if (mapLinks) {
          responseText += `\n\n**Map Links:**${mapLinks}`;
        }
      }

      setMessages(prev => [...prev, { role: 'model', content: responseText }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'model', content: 'Sorry, I encountered an error processing your request.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    "Explain YOT rules",
    "Rotterdam customs deadline",
    "Find nearest depot to 70173"
  ];

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.div 
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "h-14 w-14 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center border-2",
            isOpen 
              ? "bg-white text-slate-800 border-slate-200 hover:bg-slate-50" 
              : "bg-[#00243d] text-white border-[#42b0d5]/30 hover:bg-[#00243d]/90"
          )}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <div className="relative">
              <MessageCircle className="h-6 w-6" />
              <motion.div 
                className="absolute -top-1 -right-1"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Sparkles className="h-3 w-3 text-[#42b0d5] fill-[#42b0d5]" />
              </motion.div>
            </div>
          )}
        </Button>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-32px)]"
          >
            <Card className="flex flex-col h-[520px] shadow-2xl border-slate-200 overflow-hidden rounded-2xl bg-white/95 backdrop-blur-sm">
              <CardHeader className="bg-[#00243d] text-white py-4 px-5 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-[#42b0d5]/20 flex items-center justify-center border border-[#42b0d5]/30">
                    <Bot className="h-4 w-4 text-[#42b0d5]" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold tracking-tight">Maersk AI Assistant</CardTitle>
                    <div className="flex items-center text-[10px] text-[#42b0d5] font-medium uppercase tracking-wider">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400 mr-1.5 animate-pulse" />
                      Online & Ready
                    </div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              
              <CardContent className="flex-1 p-0 flex flex-col overflow-hidden bg-slate-50/30">
                <div className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200" ref={scrollRef}>
                  <div className="space-y-4">
                    {messages.map((msg, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className={cn(
                            "flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold",
                            msg.role === 'user' ? 'bg-blue-600 text-white ml-2' : 'bg-white border border-slate-200 text-slate-600 mr-2'
                          )}>
                            {msg.role === 'user' ? 'ME' : 'AI'}
                          </div>
                          <div className={cn(
                            "px-3.5 py-2.5 rounded-2xl text-sm shadow-sm",
                            msg.role === 'user' 
                              ? 'bg-blue-600 text-white rounded-tr-none' 
                              : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                          )}>
                            {msg.role === 'user' ? (
                              msg.content
                            ) : (
                              <div className="prose prose-sm prose-slate max-w-none prose-p:leading-relaxed prose-strong:text-blue-700">
                                <Markdown>{msg.content}</Markdown>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="flex max-w-[85%] flex-row items-end">
                          <div className="flex-shrink-0 h-7 w-7 rounded-full bg-white border border-slate-200 mr-2 flex items-center justify-center overflow-hidden shadow-sm">
                            <Bot className="h-4 w-4 text-blue-500" />
                          </div>
                          <div className="px-4 py-3 rounded-2xl rounded-bl-none bg-white border border-slate-100 text-slate-800 flex items-center shadow-sm space-x-1">
                            <motion.div 
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                              className="h-1.5 w-1.5 bg-blue-400 rounded-full" 
                            />
                            <motion.div 
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                              className="h-1.5 w-1.5 bg-blue-400 rounded-full" 
                            />
                            <motion.div 
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                              className="h-1.5 w-1.5 bg-blue-400 rounded-full" 
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {messages.length === 1 && !isLoading && (
                  <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                    {quickActions.map((action, idx) => (
                      <motion.button
                        key={idx}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSend(action)}
                        className="text-[11px] bg-white text-blue-600 hover:bg-blue-50 border border-blue-100 rounded-full px-3 py-1.5 flex items-center transition-colors shadow-sm font-medium"
                      >
                        <Lightbulb className="h-3 w-3 mr-1.5 text-blue-400" />
                        {action}
                      </motion.button>
                    ))}
                  </div>
                )}

                <div className="p-4 bg-white border-t border-slate-100">
                  <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center space-x-2 bg-slate-50 p-1 rounded-xl border border-slate-200 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm h-9"
                      disabled={isLoading}
                    />
                    <Button 
                      type="submit" 
                      size="icon" 
                      disabled={!input.trim() || isLoading} 
                      className="h-8 w-8 rounded-lg bg-[#00243d] hover:bg-[#00243d]/90 text-white shrink-0"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  </form>
                  <p className="text-[9px] text-center text-slate-400 mt-2 font-medium uppercase tracking-tighter">
                    Powered by Maersk Advanced AI
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

