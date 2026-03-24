import React from 'react';
import { Paperclip, Send, Smile, User } from 'lucide-react';
import type { Member } from '@axeVision/shared';
import { type ChatTarget } from '../../../pages/chat/types';

interface ChatInputProps {
  input: string;
  handleInputChange: (val: string) => void;
  handleSend: () => void;
  showMentions: boolean;
  filteredMentions: Member[];
  mentionIndex: number;
  pickMention: (m: Member) => void;
  handleMentionNav: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  selected: ChatTarget;
  online: Set<string>;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  handleInputChange,
  handleSend,
  showMentions,
  filteredMentions,
  mentionIndex,
  pickMention,
  handleMentionNav,
  selected,
  online
}) => {
  return (
    <div className="p-4 border-t border-gray-200 mt-auto flex-shrink-0">
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
  );
};
