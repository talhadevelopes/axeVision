import type { Server, Socket } from 'socket.io';
import { prisma } from './prisma';
import { ChatKind } from '../utils/response';
import { verifyToken } from './jwt';

interface JwtPayload {
  userId: string;
  memberId: string;
  memberType?: string;
}

const ORG_ROOM = (userId: string) => `org:${userId}`;
const MEMBER_ROOM = (memberId: string) => `member:${memberId}`;
const DM_KEY = (a: string, b: string) => [a, b].sort().join(':');

export const initChatSockets = (io: Server) => {
  // Authenticate every socket connection
  io.use((socket, next) => {
    try {
      const auth = socket.handshake.auth as any;
      let token: string | undefined = auth?.token;
      if (!token) {
        const header = socket.handshake.headers['authorization'];
        if (typeof header === 'string' && header.startsWith('Bearer ')) {
          token = header.substring('Bearer '.length);
        }
      }
      if (!token) return next(new Error('Unauthorized'));
      const decoded = verifyToken<JwtPayload>(token);
      (socket as any).userId = decoded.userId;
      (socket as any).memberId = decoded.memberId;
      (socket as any).memberType = decoded.memberType;
      next();
    } catch (err) {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId as string;
    const memberId = (socket as any).memberId as string;
    if (!userId || !memberId) {
      socket.disconnect(true);
      return;
    }

    // Join rooms
    const orgRoom = ORG_ROOM(userId);
    const selfRoom = MEMBER_ROOM(memberId);
    socket.join(orgRoom);
    socket.join(selfRoom);

    // Group message send
    socket.on('group:send', async (payload: { content: string }) => {
      try {
        const content = String(payload?.content || '').trim();
        if (!content) return;
        const doc = await prisma.chatMessage.create({
          data: {
            userId,
            type: ChatKind.group,
            fromMemberId: memberId,
            content,
          },
        });
        const message = {
          _id: doc.id,
          userId: doc.userId,
          type: doc.type,
          fromMemberId: doc.fromMemberId,
          content: doc.content,
          createdAt: doc.createdAt,
        };
        io.to(orgRoom).emit('group:new', { message });
      } catch (err) {
        console.error('group:send error', err);
      }
    });

    // Typing indicators
    socket.on('typing:start', async (payload: { room: 'group' | 'dm'; peerMemberId?: string }) => {
      try {
        if (payload.room === 'group') {
          socket.to(orgRoom).emit('typing', { room: 'group', memberId, typing: true });
        } else if (payload.room === 'dm') {
          const toMemberId = String(payload?.peerMemberId || '').trim();
          if (!toMemberId) return;
          const recipient = await prisma.member.findFirst({
            where: { memberId: toMemberId, userId },
          });
          if (!recipient) return;
          io.to(MEMBER_ROOM(toMemberId)).emit('typing', { room: 'dm', memberId, typing: true, peerMemberId: memberId });
        }
      } catch (err) {
        console.error('typing:start error', err);
      }
    });

    socket.on('typing:stop', async (payload: { room: 'group' | 'dm'; peerMemberId?: string }) => {
      try {
        if (payload.room === 'group') {
          socket.to(orgRoom).emit('typing', { room: 'group', memberId, typing: false });
        } else if (payload.room === 'dm') {
          const toMemberId = String(payload?.peerMemberId || '').trim();
          if (!toMemberId) return;
          const recipient = await prisma.member.findFirst({
            where: { memberId: toMemberId, userId },
          });
          if (!recipient) return;
          io.to(MEMBER_ROOM(toMemberId)).emit('typing', { room: 'dm', memberId, typing: false, peerMemberId: memberId });
        }
      } catch (err) {
        console.error('typing:stop error', err);
      }
    });

    // Read receipts for DMs
    socket.on('dm:read', async (payload: { peerMemberId: string; lastCreatedAt: string }) => {
      try {
        const peerMemberId = String(payload?.peerMemberId || '').trim();
        const lastCreatedAt = new Date(payload?.lastCreatedAt);
        if (!peerMemberId || isNaN(lastCreatedAt.getTime())) return;
        const recipient = await prisma.member.findFirst({
          where: { memberId: peerMemberId, userId },
        });
        if (!recipient) return;
        const conversationId = DM_KEY(memberId, peerMemberId);
        const toMark = await prisma.chatMessage.findMany({
          where: {
            userId,
            type: ChatKind.dm,
            conversationId,
            fromMemberId: peerMemberId,
            createdAt: { lte: lastCreatedAt },
          },
        });
        for (const doc of toMark) {
          if (doc.readBy.includes(memberId)) continue;
          await prisma.chatMessage.update({
            where: { id: doc.id },
            data: { readBy: { set: [...doc.readBy, memberId] } },
          });
        }
        const notify = { peerMemberId: memberId, readerMemberId: memberId, lastCreatedAt };
        io.to(MEMBER_ROOM(peerMemberId)).emit('dm:read', notify);
        io.to(selfRoom).emit('dm:read', notify);
      } catch (err) {
        console.error('dm:read error', err);
      }
    });

    // Direct message send
    socket.on('dm:send', async (payload: { toMemberId: string; content: string }) => {
      try {
        const toMemberId = String(payload?.toMemberId || '').trim();
        const content = String(payload?.content || '').trim();
        if (!toMemberId || !content) return;

        const recipient = await prisma.member.findFirst({
          where: { memberId: toMemberId, userId },
        });
        if (!recipient) return;

        const conversationId = DM_KEY(memberId, toMemberId);
        const doc = await prisma.chatMessage.create({
          data: {
            userId,
            type: ChatKind.dm,
            fromMemberId: memberId,
            toMemberId,
            conversationId,
            content,
          },
        });
        const message = {
          _id: doc.id,
          userId: doc.userId,
          type: doc.type,
          fromMemberId: doc.fromMemberId,
          toMemberId: doc.toMemberId,
          conversationId: doc.conversationId,
          content: doc.content,
          createdAt: doc.createdAt,
        };
        io.to(MEMBER_ROOM(toMemberId)).emit('dm:new', { message });
        io.to(selfRoom).emit('dm:new', { message });
      } catch (err) {
        console.error('dm:send error', err);
      }
    });
  });
};
