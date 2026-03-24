import type { Response } from 'express';
import type { AuthRequest } from '../middleware/authMiddleware';
import { ChatMessage } from '../models';
import { Redis } from '@upstash/redis';

const parseBefore = (before?: string) => (before ? new Date(before) : undefined);

// We will pass a bound redis client accessor to avoid circular deps
let redis: Redis | null = null;
export const bindPresenceRedis = (client: Redis) => {
  redis = client;
};


export class MessagesController {
  //used in /chat to get the group history
  static async getGroupHistory(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const limit = Math.min(Number(req.query.limit) || 50, 200);
      const before = parseBefore(req.query.before as string | undefined);

      const query: any = { userId, type: 'group' };
      if (before) query.createdAt = { $lt: before };

      const messages = await ChatMessage.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return res.json({ success: true, data: { messages } });
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
      const query: any = { userId, type: 'dm', conversationId: pair };
      if (before) query.createdAt = { $lt: before };

      const messages = await ChatMessage.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return res.json({ success: true, data: { messages } });
    } catch (err) {
      console.error('getDmHistory error', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

   static async getOnline(req: AuthRequest, res: Response) {
      try {
        if (!redis) return res.status(500).json({ success: false, message: 'Presence not initialized' });
        const userId = req.userId!;
        const key = `online:${userId}`;
        const members = await redis.smembers(key);
        return res.json({ success: true, data: { online: members } });
      } catch (err) {
        console.error('getOnline error', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }
    }
}
