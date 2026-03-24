import React from 'react';
import type { Member } from '@axeVision/shared';
import { type ChatTarget, type ChatMessage } from '../../../pages/chat/types';

interface MessageListProps {
  messages: ChatMessage[];
  selected: ChatTarget;
  members: Member[];
  selfMemberId: string;
  isLoading: boolean;
  hasMore: boolean;
  onScrollList: (e: React.UIEvent<HTMLDivElement>) => Promise<void>;
  listRef: React.MutableRefObject<HTMLDivElement | null>;
  bottomRef: React.MutableRefObject<HTMLDivElement | null>;
  viewKey: number;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  selected,
  members,
  selfMemberId,
  isLoading,
  hasMore,
  onScrollList,
  listRef,
  bottomRef,
  viewKey
}) => {
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

  return (
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
  );
};
