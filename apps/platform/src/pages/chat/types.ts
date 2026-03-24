export interface ChatMessage {
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

export type ChatTarget = { kind: 'group' } | { kind: 'dm'; peerMemberId: string };
