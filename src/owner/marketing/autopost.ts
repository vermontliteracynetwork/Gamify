// Auto-posting (owner, 2026-11-24: "add a visual content planner that will be
// hooked up to auto post and such. we can use canva"). The rule that never
// bends (CLAUDE.md, marketing team): nothing posts, boosts or spends without
// the owner's OK. A post goes out on its own only when all four are true:
//   1. she approved it on /owner (Marketing),
//   2. its picture or video is ready (a Canva design, exported by the
//      publisher at posting time),
//   3. its platform account is connected (Waiting on you: mkt-autopost),
//   4. its date and time have come.
// The publisher itself runs on the server (a scheduled Supabase function,
// docs/marketing-autopost.md) because platform tokens must never reach a
// browser. This file is the shared rule, so the planner shows exactly what the
// publisher will do.
import type { Decision, Platform, Post } from './plan';
import { shownStatus } from './plan';

export interface Connection {
  platform: Platform | 'canva';
  label: string;
  api: string; // the official API the publisher uses
  needs: string; // what the owner has to do once
}

// Official posting APIs only (no unofficial bots or scrapers; marketing bible).
// Ads never auto-post: a paid change always waits for her OK in Ads Manager.
export const CONNECTIONS: Connection[] = [
  { platform: 'canva', label: 'Canva', api: 'Canva Connect API (designs and exports)', needs: 'Connect the Gamify Canva account (brand kit and templates)' },
  { platform: 'instagram', label: 'Instagram', api: 'Instagram Graph API, content publishing', needs: 'An Instagram business account linked to the Gamify Facebook Page' },
  { platform: 'facebook', label: 'Facebook', api: 'Facebook Pages API', needs: 'The Gamify Facebook Page and a Meta developer app' },
  { platform: 'pinterest', label: 'Pinterest', api: 'Pinterest API v5, create pin', needs: 'A Pinterest business account and an approved Pinterest app' },
  { platform: 'tiktok', label: 'TikTok', api: 'TikTok Content Posting API', needs: 'A TikTok business account and an audited TikTok developer app' },
];

export const AUTO_PLATFORMS: Platform[] = ['instagram', 'facebook', 'pinterest', 'tiktok'];

export type PublishState = 'needs-ok' | 'not-approved' | 'needs-design' | 'needs-connection' | 'ads-manual' | 'queued' | 'due' | 'posted';

export function publishState(post: Post, decisions: Record<string, Decision>, connected: Partial<Record<Connection['platform'], boolean>>, now = new Date()): PublishState {
  const s = shownStatus(post, decisions);
  if (s === 'posted' || s === 'reviewed') return 'posted';
  if (s === 'no' || s === 'changes') return 'not-approved';
  if (s !== 'approved' && s !== 'scheduled') return 'needs-ok';
  if (!AUTO_PLATFORMS.includes(post.platform)) return 'ads-manual';
  if (!post.design?.canva) return 'needs-design';
  if (!connected.canva || !connected[post.platform]) return 'needs-connection';
  return new Date(`${post.date}T${post.time}:00`) <= now ? 'due' : 'queued';
}

// The owner can move a post to another day on the planner; moves save with her
// settings and the team reads them in the hand-off.
export type Moves = Record<string, { date: string; time?: string }>;
export function withMoves(posts: Post[], moves: Moves): Post[] {
  return posts.map((p) => (moves[p.id] ? { ...p, date: moves[p.id].date, time: moves[p.id].time ?? p.time } : p));
}

// The picture's shape on each platform, for the visual preview.
export function aspectFor(post: Post): string {
  switch (post.format) {
    case 'reel': case 'story': case 'tiktok': case 'video-pin': return '9 / 16';
    case 'pin': return '2 / 3';
    case 'carousel': return '4 / 5';
    case 'search-ad': return '16 / 9';
    default: return '1 / 1';
  }
}
