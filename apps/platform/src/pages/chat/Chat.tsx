import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { memberService, messagesService, presenceService } from '../../services/api';
import { getChatSocket } from '../../services/chatSocket';
import type { Member } from '@axeVision/shared';
import { Search, Phone, Video, User, Send, Paperclip, Smile } from 'lucide-react';

interface ChatMessage {
  _id: string;
  userId: string;
  type: 'group' | 'dm';
  fromMemberId: string;
  toMemberId?: string;
  conversationId?: string;
  content: string;
  createdAt: string | Date;
  readBy?: string[];
}

type ChatTarget = { kind: 'group' } | { kind: 'dm'; peerMemberId: string };

const ChatPage: React.FC = () => {
  const { user } = useAuthStore();
  const selfMemberId = user?.memberId || '';

  const [members, setMembers] = useState<Member[]>([]);
  const [online, setOnline] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<ChatTarget>({ kind: 'group' });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [typingPeers, setTypingPeers] = useState<Set<string>>(new Set());
  const [viewKey, setViewKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const socket = useMemo(() => getChatSocket(), []);
  const listRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<any>(null);
  const selectedRef = useRef<ChatTarget>(selected);
  const loadIdRef = useRef(0);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Initial data load (once)
  useEffect(() => {
    const init = async () => {
      try {
        const [membersRes, presenceRes] = await Promise.all([
          memberService.getMembersByUser(),
          presenceService.getOnline(),
        ]);
        
        // Correctly handle the member response structure
        const memberList = Array.isArray(membersRes) 
          ? membersRes 
          : (membersRes?.members || []);
          
        setMembers(memberList);
        setOnline(new Set(presenceRes.online || []));
      } catch (err) {
        console.error("Failed to initialize chat data:", err);
      }
    };
    init();
  }, []);

  // Socket listeners (rebind when selection changes to update scoping)
  useEffect(() => {
    const onPresenceList = (payload: { online: string[] }) => {
      setOnline(new Set(payload.online || []));
    };
    const onPresenceOnline = (p: { memberId: string }) => setOnline((prev) => new Set(prev).add(p.memberId));
    const onPresenceOffline = (p: { memberId: string }) => {
      setOnline((prev) => {
        const next = new Set(prev);
        next.delete(p.memberId);
        return next;
      });
    };
    const onGroupNew = (payload: { message: ChatMessage }) => {
      setMessages((prev) => (selected.kind === 'group' ? [...prev, payload.message] : prev));
      if (selected.kind === 'group') scrollToBottom();
    };
    const onDmNew = (payload: { message: ChatMessage }) => {
      const m = payload.message;
      if (selected.kind === 'dm') {
        if (m.type === 'dm' && (m.fromMemberId === selected.peerMemberId || m.toMemberId === selected.peerMemberId)) {
          setMessages((prev) => [...prev, m]);
          scrollToBottom();
        }
      }
    };

    const onTyping = (payload: { room: 'group' | 'dm'; memberId: string; typing: boolean; peerMemberId?: string }) => {
      setTypingPeers((prev) => {
        const next = new Set(prev);
        const inCurrentGroup = selected.kind === 'group' && payload.room === 'group';
        const inCurrentDm = selected.kind === 'dm' && payload.room === 'dm' && payload.peerMemberId === selected.peerMemberId;
        if (inCurrentGroup || inCurrentDm) {
          if (payload.typing) next.add(payload.memberId);
          else next.delete(payload.memberId);
        }
        return next;
      });
    };

    socket.on('presence:list', onPresenceList);
    socket.on('presence:online', onPresenceOnline);
    socket.on('presence:offline', onPresenceOffline);
    socket.on('group:new', onGroupNew);
    socket.on('dm:new', onDmNew);
    socket.on('typing', onTyping);
    socket.on('dm:read', (payload: { readerMemberId: string; lastCreatedAt: string; peerMemberId?: string }) => {
      const readerId = payload.readerMemberId;
      const cutoff = new Date(payload.lastCreatedAt).getTime();
      if (selected.kind === 'dm' && readerId === selected.peerMemberId) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.fromMemberId === selfMemberId && new Date(m.createdAt).getTime() <= cutoff) {
              const rb = m.readBy || [];
              if (!rb.includes(readerId)) return { ...m, readBy: [...rb, readerId] };
            }
            return m;
          })
        );
      }
    });

    return () => {
      socket.off('presence:list', onPresenceList);
      socket.off('presence:online', onPresenceOnline);
      socket.off('presence:offline', onPresenceOffline);
      socket.off('group:new', onGroupNew);
      socket.off('dm:new', onDmNew);
      socket.off('typing', onTyping);
      socket.off('dm:read');
    };
  }, [socket, selected.kind, (selected as any).peerMemberId]);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    const load = async () => {
      setTypingPeers(new Set());
      setMessages([]);
      setIsLoading(true);
      setHasMore(true);
      setViewKey((k) => k + 1);
      const myLoadId = ++loadIdRef.current;
      if (selected.kind === 'group') {
        const res = await messagesService.getGroupMessages({ limit: 50 });
        if (loadIdRef.current === myLoadId) {
          setMessages((res.messages || []).reverse());
          setHasMore((res.messages || []).length >= 50);
        }
      } else {
        const res = await messagesService.getDmMessages(selected.peerMemberId, { limit: 50 });
        if (loadIdRef.current === myLoadId) {
          setMessages((res.messages || []).reverse());
          setHasMore((res.messages || []).length >= 50);
          const lastIncoming = [...(res.messages || [])]
            .filter((m: any) => m.toMemberId === selfMemberId)
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
          if (lastIncoming) {
            socket.emit('dm:read', { peerMemberId: selected.peerMemberId, lastCreatedAt: lastIncoming.createdAt });
          }
        }
      }
      scrollToBottom();
      setIsLoading(false);
    };
    load().catch((e) => {
      console.error(e);
      setMessages([]);
      setIsLoading(false);
    });
  }, [selected]);

  const handleSend = () => {
    const content = input.trim();
    if (!content) return;
    if (selected.kind === 'group') {
      socket.emit('group:send', { content });
    } else {
      socket.emit('dm:send', { toMemberId: selected.peerMemberId, content });
    }
    setInput('');
    setShowMentions(false);
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    if (selected.kind === 'group') {
      socket.emit('typing:start', { room: 'group' });
    } else {
      socket.emit('typing:start', { room: 'dm', peerMemberId: (selected as any).peerMemberId });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (selected.kind === 'group') socket.emit('typing:stop', { room: 'group' });
      else socket.emit('typing:stop', { room: 'dm', peerMemberId: (selected as any).peerMemberId });
    }, 1200);

    if (selected.kind !== 'group') {
      setShowMentions(false);
      return;
    }
    const at = value.lastIndexOf('@');
    if (at >= 0) {
      if (at === 0 || /\s/.test(value[at - 1] || ' ')) {
        const rest = value.slice(at + 1);
        const space = rest.search(/\s/);
        const query = space === -1 ? rest : rest.slice(0, space);
        setMentionQuery(query);
        setShowMentions(true);
        return;
      }
    }
    setShowMentions(false);
  };

  const filteredMentions = members
    .filter((m) => m.memberId && m.memberId !== selfMemberId)
    .filter((m) =>
      mentionQuery.trim() === ''
        ? true
        : m.name.toLowerCase().includes(mentionQuery.toLowerCase())
    )
    .slice(0, 8);

  const pickMention = (m: Member) => {
    const at = input.lastIndexOf('@');
    if (at < 0) return;
    const rest = input.slice(at + 1);
    const space = rest.search(/\s/);
    const after = space === -1 ? '' : rest.slice(space);
    const before = input.slice(0, at);
    const inserted = `${before}@${m.name} ${after}`;
    setInput(inserted);
    setShowMentions(false);
  };

  const handleMentionNav = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showMentions || filteredMentions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setMentionIndex((i) => (i + 1) % filteredMentions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setMentionIndex((i) => (i - 1 + filteredMentions.length) % filteredMentions.length);
    } else if (e.key === 'Enter') {
      const m = filteredMentions[mentionIndex] || filteredMentions[0];
      if (m) {
        e.preventDefault();
        pickMention(m);
      }
    } else if (e.key === 'Escape') {
      setShowMentions(false);
    }
  };

  const onScrollList = async (e: React.UIEvent<HTMLDivElement>) => {
    if (!hasMore || isLoadingMore) return;
    const el = e.currentTarget;
    if (el.scrollTop < 60) {
      setIsLoadingMore(true);
      const earliest = messages[0]?.createdAt ? new Date(messages[0].createdAt).toISOString() : undefined;
      const prevHeight = el.scrollHeight;
      let older: any[] = [];
      if (selected.kind === 'group') {
        const res = await messagesService.getGroupMessages({ limit: 50, before: earliest });
        older = res.messages || [];
      } else {
        const res = await messagesService.getDmMessages(selected.peerMemberId, { limit: 50, before: earliest });
        older = res.messages || [];
      }
      if (older.length === 0) setHasMore(false);
      setMessages((prev) => [...older.reverse(), ...prev]);
      setTimeout(() => {
        const newHeight = el.scrollHeight;
        el.scrollTop = newHeight - prevHeight + el.scrollTop;
      }, 0);
      setIsLoadingMore(false);
    }
  };

  const selectedTitle = selected.kind === 'group' ? 'Group Chat' : `${members.find(m => m.memberId === selected.peerMemberId)?.name || selected.peerMemberId}`;

  const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatDate = (d: Date) => d.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });

  const renderContentWithMentions = (text: string) => {
    const names = members.map((m) => m.name).sort((a, b) => b.length - a.length).map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (names.length === 0) return <span>{text}</span>;
    const pattern = new RegExp(`@(${names.join('|')})`, 'g');
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const start = match.index;
      if (start > lastIndex) parts.push(<span key={lastIndex}>{text.slice(lastIndex, start)}</span>);
      parts.push(
        <span key={start} className="text-blue-600 font-medium">@{match[1]}</span>
      );
      lastIndex = pattern.lastIndex;
    }
    if (lastIndex < text.length) parts.push(<span key={lastIndex}>{text.slice(lastIndex)}</span>);
    return <>{parts}</>;
  };

  const filteredMembers = members
    .filter((m) => m.memberId && m.memberId !== selfMemberId)
    .filter((m) => 
      searchQuery.trim() === '' ? true : m.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Get unread count for each member (simplified - you can enhance this)
  const getUnreadCount = (memberId: string) => {
    return messages.filter(m => 
      m.type === 'dm' && 
      m.fromMemberId === memberId && 
      (!m.readBy || !m.readBy.includes(selfMemberId))
    ).length;
  };

  const getLastMessage = (memberId: string) => {
    // Find last message with this member
    const memberMessages = messages.filter(m => 
      m.type === 'dm' && (m.fromMemberId === memberId || m.toMemberId === memberId)
    );
    return memberMessages[memberMessages.length - 1]?.content || 'No messages yet';
  };

  const getLastMessageTime = (memberId: string) => {
    const memberMessages = messages.filter(m => 
      m.type === 'dm' && (m.fromMemberId === memberId || m.toMemberId === memberId)
    );
    const lastMsg = memberMessages[memberMessages.length - 1];
    if (!lastMsg) return '';
    const date = new Date(lastMsg.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-96 p-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>
        
        <div className="space-y-2 overflow-y-auto h-[calc(100vh-140px)]">
          {/* Group Chat Card */}
          <div
            onClick={() => {
              setSelected({ kind: 'group' });
              setMessages([]);
              setIsLoading(true);
              setHasMore(true);
              setViewKey((k) => k + 1);
            }}
            className={`bg-white rounded-xl p-4 cursor-pointer border border-gray-200 hover:shadow-md transition-shadow ${selected.kind === 'group' ? 'ring-2 ring-blue-500' : ''}`}
          >
            <div className="flex items-start gap-3">
              <div className="relative flex-shrink-0">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                  <User className="w-7 h-7 text-blue-600" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-gray-900">Group Chat</h3>
                  <span className="text-xs text-gray-400">Active</span>
                </div>
                <p className="text-sm text-gray-600 truncate">{members.length} members</p>
              </div>
            </div>
          </div>

          {/* Member Cards */}
          {filteredMembers.map(m => {
            const isOnline = online.has(m.memberId);
            const unread = getUnreadCount(m.memberId);
            
            return (
              <div
                key={m.memberId}
                onClick={() => {
                  setSelected({ kind: 'dm', peerMemberId: m.memberId });
                  setMessages([]);
                  setIsLoading(true);
                  setHasMore(true);
                  setViewKey((k) => k + 1);
                }}
                className={`bg-white rounded-xl p-4 cursor-pointer border border-gray-200 hover:shadow-md transition-shadow ${selected.kind === 'dm' && selected.peerMemberId === m.memberId ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                      <User className="w-7 h-7 text-blue-600" />
                    </div>
                    {isOnline && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-semibold text-gray-900">{m.name}</h3>
                      <span className="text-xs text-gray-400">{getLastMessageTime(m.memberId)}</span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{getLastMessage(m.memberId)}</p>
                  </div>
                  {unread > 0 && (
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-white">{unread}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">{selectedTitle}</h2>
                <p className="text-sm text-gray-500">
                  {typingPeers.size > 0 ? (
                    <>
                      {Array.from(typingPeers)
                        .map((id) => members.find((m) => m.memberId === id)?.name || id)
                        .join(', ')}{' '}
                      is typing...
                    </>
                  ) : selected.kind === 'group' ? (
                    `${members.length} members`
                  ) : (
                    online.has((selected as any).peerMemberId) ? 'Active now' : 'Offline'
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <button className="p-2 hover:bg-gray-50 rounded-lg"><Phone className="w-5 h-5 text-gray-600" /></button>
              <button className="p-2 hover:bg-gray-50 rounded-lg"><Video className="w-5 h-5 text-gray-600" /></button>
            </div>
          </div>
          
          {/* Messages */}
          <div key={viewKey} ref={listRef} onScroll={onScrollList} className="flex-1 overflow-y-auto p-6 space-y-4">
            {isLoading && messages.length === 0 && (
              <div className="text-sm text-gray-500 text-center">Loading messages...</div>
            )}
            {messages.map((m, idx) => {
              const mine = m.fromMemberId === selfMemberId;
              const current = new Date(m.createdAt);
              const prev = idx > 0 ? new Date(messages[idx - 1].createdAt) : null;
              const showDate = !prev || prev.toDateString() !== current.toDateString();
              
              return (
                <React.Fragment key={m._id}>
                  {showDate && (
                    <div className="flex justify-center my-2">
                      <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        {formatDate(current)}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-lg ${mine ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900'} rounded-2xl px-5 py-3 shadow-sm`}>
                      {!mine && (
                        <div className="text-xs opacity-70 mb-1 font-medium">
                          {members.find((mm) => mm.memberId === m.fromMemberId)?.name || m.fromMemberId}
                        </div>
                      )}
                      <p className="whitespace-pre-wrap break-words">
                        {selected.kind === 'group' ? renderContentWithMentions(m.content) : m.content}
                      </p>
                      <div className="flex items-center gap-2 justify-end mt-1">
                        <span className={`text-xs ${mine ? 'text-blue-100' : 'text-gray-500'}`}>{formatTime(current)}</span>
                        {selected.kind === 'dm' && mine && (
                          <span className="text-xs">
                            {m.readBy && m.readBy.includes((selected as any).peerMemberId) ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
            <div ref={bottomRef} />
          </div>
          
          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="relative">
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-2">
                <button className="p-2 hover:bg-white rounded-lg"><Paperclip className="w-5 h-5 text-gray-600" /></button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (showMentions && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === 'Escape')) {
                      handleMentionNav(e);
                      return;
                    }
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Write a message..."
                  className="flex-1 bg-transparent px-2 py-1 text-sm focus:outline-none"
                />
                <button className="p-2 hover:bg-white rounded-lg"><Smile className="w-5 h-5 text-gray-600" /></button>
                <button onClick={handleSend} className="p-3 bg-blue-500 hover:bg-blue-600 rounded-lg"><Send className="w-5 h-5 text-white" /></button>
              </div>
              
              {/* Mentions Dropdown */}
              {showMentions && selected.kind === 'group' && filteredMentions.length > 0 && (
                <div className="absolute bottom-full mb-2 left-0 right-0 max-h-48 overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg z-10">
                  {filteredMentions.map((m, idx) => (
                    <div
                      key={m.memberId}
                      className={`px-4 py-3 cursor-pointer flex items-center gap-3 ${idx === mentionIndex ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                      onClick={() => pickMention(m)}
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">@{m.name}</p>
                        <p className="text-xs text-gray-500">{online.has(m.memberId) ? 'Online' : 'Offline'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;