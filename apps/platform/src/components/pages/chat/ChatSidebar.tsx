import React from 'react';
import { Search, User } from 'lucide-react';
import type { Member } from '@axeVision/shared';
import { type ChatTarget, type ChatMessage } from '../../../pages/chat/types';

interface ChatSidebarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selected: ChatTarget;
  onSelectChat: (target: ChatTarget) => void;
  members: Member[];
  messages: ChatMessage[];
  selfMemberId: string;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  searchQuery,
  setSearchQuery,
  selected,
  onSelectChat,
  members,
  messages,
  selfMemberId
}) => {
  const filteredMembers = members
    .filter((m) => m.memberId && m.memberId !== selfMemberId)
    .filter((m) =>
      searchQuery.trim() === '' ? true : m.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const getUnreadCount = (memberId: string) => {
    return 0; // Placeholder
  };

  const getLastMessage = (memberId: string) => {
    const memberMessages = messages.filter(m =>
      m.fromMemberId === memberId || m.toMemberId === memberId
    );
    return memberMessages[memberMessages.length - 1]?.content || 'No messages yet';
  };

  const getLastMessageTime = (memberId: string) => {
    const memberMessages = messages.filter(m =>
      m.fromMemberId === memberId || m.toMemberId === memberId
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
    <div className="w-96 p-4 flex-shrink-0">
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
          onClick={() => onSelectChat({ kind: 'group' })}
          className={`bg-white rounded-xl p-4 cursor-pointer border border-gray-200 hover:shadow-md transition-shadow ${selected.kind === 'group' ? 'ring-2 ring-blue-500' : ''}`}
        >
          <div className="flex items-start gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                <User className="w-7 h-7 text-blue-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-semibold text-gray-900">Group Chat</h3>
              </div>
              <p className="text-sm text-gray-600 truncate">{members.length} members</p>
            </div>
          </div>
        </div>

        {/* Member Cards */}
        {filteredMembers.map(m => {
          const unread = getUnreadCount(m.memberId);

          return (
            <div
              key={m.memberId}
              onClick={() => onSelectChat({ kind: 'dm', peerMemberId: m.memberId })}
              className={`bg-white rounded-xl p-4 cursor-pointer border border-gray-200 hover:shadow-md transition-shadow ${selected.kind === 'dm' && (selected as any).peerMemberId === m.memberId ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                    <User className="w-7 h-7 text-blue-600" />
                  </div>
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
  );
};
