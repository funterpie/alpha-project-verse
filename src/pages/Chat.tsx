import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Message = Tables<'chat_messages'>;

export default function Chat() {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadMessages = async () => {
      const { data } = await supabase.from('chat_messages').select('*').order('created_at', { ascending: true });
      setMessages(data || []);
    };
    loadMessages();

    // Real-time subscription
    const channel = supabase
      .channel('chat-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!text.trim() || !user || !profile) return;
    await supabase.from('chat_messages').insert({
      sender_id: user.id,
      sender_name: profile.display_name,
      content: text.trim(),
    });
    setText('');
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('');

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-foreground">Team Chat</h2>
        <p className="text-sm text-muted-foreground">Group conversation • Real-time</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 border border-border rounded-xl p-4 bg-card/50 mb-4">
        {messages.map(m => {
          const isMe = m.sender_id === user?.id;
          return (
            <div key={m.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isMe ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                {getInitials(m.sender_name)}
              </div>
              <div className={`max-w-[70%] ${isMe ? 'text-right' : ''}`}>
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className={`text-xs font-medium ${isMe ? 'text-primary' : 'text-foreground'}`}>{m.sender_name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className={`inline-block text-sm px-3 py-2 rounded-xl ${isMe ? 'bg-primary/10 text-foreground' : 'bg-muted text-foreground'}`}>
                  {m.content}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2">
        <Input value={text} onChange={e => setText(e.target.value)} placeholder="Type a message..." className="flex-1"
          onKeyDown={e => e.key === 'Enter' && send()} />
        <Button onClick={send} size="icon" className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
