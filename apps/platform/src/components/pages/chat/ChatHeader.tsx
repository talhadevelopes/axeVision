import React from 'react';
import { User, Phone, Video } from 'lucide-react';
import type { Member } from '@axeVision/shared';
import { type ChatTarget } from '../../../pages/chat/types';

interface ChatHeaderProps {
  selected: ChatTarget;
  members: Member[];
  typingPeers: Set<string>;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ selected, members, typingPeers }) => {
  const selectedTitle = selected.kind === 'group'
    ? 'Group Chat'
    : `${members.find(m => m.memberId === (selected as any).peerMemberId)?.name || (selected as any).peerMemberId}`;

  return (
    <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
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
              members.find((mm) => mm.memberId === (selected as { kind: 'dm'; peerMemberId: string }).peerMemberId)?.role ||
              'Direct message'
            )}
          </p>
        </div>
      </div>
      <div className="flex gap-1">
        <button className="p-2 hover:bg-gray-50 rounded-lg"><Phone className="w-5 h-5 text-gray-600" /></button>
        <button className="p-2 hover:bg-gray-50 rounded-lg"><Video className="w-5 h-5 text-gray-600" /></button>
      </div>
    </div>
  );
};
