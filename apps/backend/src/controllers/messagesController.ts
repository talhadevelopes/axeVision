import type { Response } from 'express';
import type { AuthRequest } from '../middleware/authMiddleware';
import { prisma } from '../utils/prisma';
import { ChatKind } from '../utils/response';

const parseBefore = (before?: string) => (before ? new Date(before) : undefined);

function toLeanMessage(m: {
  id: string;
  userId: string;
  type: string;
  fromMemberId: string;
  toMemberId: string | null;
  conversationId: string | null;
  content: string;
  readBy: string[];
  createdAt: Date;
}) {
  const { id, ...rest } = m;
  return { ...rest, _id: id };
}

export class MessagesController {
  //used in /chat to get the group history
  static async getGroupHistory(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const limit = Math.min(Number(req.query.limit) || 50, 200);
      const before = parseBefore(req.query.before as string | undefined);

      const messages = await prisma.chatMessage.findMany({
        where: {
          userId,
          type: ChatKind.group,
          ...(before ? { createdAt: { lt: before } } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return res.json({
        success: true,
        data: { messages: messages.map(toLeanMessage) },
      });
    } catch (err) {
      console.error('getGroupHistory error', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  //getting DM history
  static async getDmHistory(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const selfMemberId = req.memberId!;
      const peerMemberId = req.params.peerMemberId;
      const limit = Math.min(Number(req.query.limit) || 50, 200);
      const before = parseBefore(req.query.before as string | undefined);

      const pair = [selfMemberId, peerMemberId].sort().join(':');
      const messages = await prisma.chatMessage.findMany({
        where: {
          userId,
          type: ChatKind.dm,
          conversationId: pair,
          ...(before ? { createdAt: { lt: before } } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return res.json({
        success: true,
        data: { messages: messages.map(toLeanMessage) },
      });
    } catch (err) {
      console.error('getDmHistory error', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }
}