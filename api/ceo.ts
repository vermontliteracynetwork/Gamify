// The CEO Agent for the owner dashboard (/owner, CEO Agent; owner 2026-11-24).
// Runs the vendored CEO Agent engine (vendor/ceo-agent, MIT) server side so
// AI keys never reach the browser. Owner only: a signed-in Supabase session
// with two-step sign-in (aal2) that is the owner account.
// GET: who is on the team and whether a paid model key is set.
// POST { message, history }: one chat turn ("@marketing ..." asks a department).
// Vercel env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
// VITE_OWNER_EMAIL (optional), OPENROUTER_API_KEY (paid models; free ones work without).
import { createRequire } from 'node:module';
import path from 'node:path';

const SB_URL = process.env.VITE_SUPABASE_URL;
const ANON = process.env.VITE_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OWNER_EMAIL = process.env.VITE_OWNER_EMAIL?.trim().toLowerCase();

const NO_STORE = { 'Cache-Control': 'no-store' };
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: NO_STORE });

// The engine is CommonJS; load it from the project root (Vercel's working directory).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
let engine: Any = null;
function load(): Any {
  if (engine) return engine;
  const req = createRequire(path.join(process.cwd(), 'package.json'));
  const base = './vendor/ceo-agent/';
  engine = {
    server: req(`${base}lib/ceoAgentServer.js`),
    messages: req(`${base}lib/userMessages.js`),
    providers: req(`${base}lib/providers.js`),
    usage: req(`${base}ceo-core/UsageTracker.js`),
    role: req(`${base}ceo-core/resolveDepartmentRole.js`),
    client: req(`${base}ceo-core/resolveClientForModel.js`),
    skills: req(`${base}ceo-core/skillDispatch.js`),
  };
  return engine;
}

async function isOwner(request: Request): Promise<boolean> {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  if (!token || !SB_URL || !ANON) return false;
  try {
    const claims = JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64url').toString('utf8')) as { aal?: string };
    if (claims.aal !== 'aal2') return false;
  } catch { return false; }
  const res = await fetch(`${SB_URL}/auth/v1/user`, { headers: { apikey: ANON, Authorization: `Bearer ${token}` } });
  if (!res.ok) return false;
  const user = (await res.json()) as { id?: string; email?: string };
  if (OWNER_EMAIL && user.email?.toLowerCase() === OWNER_EMAIL) return true;
  if (!SERVICE || !user.id) return false;
  const admin: Record<string, string> = SERVICE.startsWith('sb_') ? { apikey: SERVICE } : { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` };
  const prof = await fetch(`${SB_URL}/rest/v1/profiles?select=is_owner&id=eq.${encodeURIComponent(user.id)}`, { headers: admin });
  if (!prof.ok) return false;
  const [row] = (await prof.json()) as { is_owner?: boolean }[];
  return !!row?.is_owner;
}

// Owner only, but still capped so a stuck button cannot run up a model bill.
const hits: number[] = [];
function tooFast(): boolean {
  const now = Date.now();
  while (hits.length && now - hits[0] > 60_000) hits.shift();
  if (hits.length >= 20) return true;
  hits.push(now);
  return false;
}

export async function GET(request: Request): Promise<Response> {
  if (!(await isOwner(request))) return json({ problem: 'owner' }, 401);
  const { server } = load();
  const { runtime, config } = server.getRuntime();
  if (!runtime) return json({ configured: false });
  const departments: Record<string, { department: string; agents: { id: string; name: string; title: string; reportsTo: string }[] }> = {};
  for (const a of runtime.supervisor.listAgents() as Any[]) {
    const dept = a.department || a.lane;
    if (!dept) continue;
    (departments[dept] ??= { department: dept, agents: [] }).agents.push({ id: a.id, name: a.id === 'ceo_agent' ? config.agentName : a.name, title: a.title, reportsTo: a.reports_to ?? '' });
  }
  return json({
    configured: true,
    agentName: config.agentName,
    principalName: config.principalName,
    costMode: config.costMode,
    paidKey: !!process.env.OPENROUTER_API_KEY,
    departments: Object.values(departments),
  });
}

export async function POST(request: Request): Promise<Response> {
  if (!(await isOwner(request))) return json({ problem: 'owner' }, 401);
  if (tooFast()) return json({ status: 'rate_limited', userMessage: 'Too many messages in a minute. Give it a moment and try again.' }, 429);
  const { server, messages, providers, usage, role, client, skills } = load();
  const { runtime, config } = server.getRuntime();
  if (!runtime) return json({ status: 'not_configured', userMessage: messages.friendlyMessageFor('not_configured', 'No config') });

  const body = (await request.json().catch(() => ({}))) as { message?: unknown; history?: unknown; tier?: unknown };
  const raw = typeof body.message === 'string' ? body.message.trim().slice(0, 8000) : '';
  if (!raw) return json({ error: 'message is required' }, 400);

  // "/skill {json}" runs a registered skill without a model call.
  const skill = await skills.dispatchSkillMessage(raw, { skillRegistry: runtime.skillRegistry, skillExecutor: runtime.skillExecutor, agentId: 'ceo_agent' });
  if (skill) {
    const ok = skill.result.status === 'ok';
    return json({ status: ok ? 'ok' : 'failed', kind: 'skill', agentName: skill.skillName, text: ok ? '```json\n' + JSON.stringify(skill.result.output, null, 2) + '\n```' : undefined, userMessage: ok ? undefined : skill.result.error });
  }

  // "@marketing write three captions" goes to that department head.
  let target: string | null = null;
  let message = raw;
  const at = raw.match(/^@(\S+)\s+([\s\S]+)/);
  if (at) { target = at[1].toLowerCase(); message = at[2]; }
  const base = { goal: message, task: message, project: 'gamify-owner', approved_by: 'ceo_agent' };
  let decision = runtime.routeTask({ ...base, assignedAgent: target ?? 'ceo_agent' });
  if (target && decision.status !== 'routed') decision = runtime.routeTask({ ...base, department: target });
  if (decision.status !== 'routed') return json({ status: decision.status, userMessage: messages.friendlyMessageFor(decision.status, decision.reason ?? '') });
  const agent = decision.agent;

  try {
    if (!(await server.ensureModelsResolved(runtime))) return json({ status: 'no_api_key', userMessage: messages.friendlyMessageFor('no_api_key', 'No provider') });
  } catch (err) {
    return json({ status: 'model_resolution_failed', userMessage: messages.friendlyMessageFor('model_resolution_failed', String(err)) });
  }

  // Without a paid key, every department answers on the free model roster.
  const tier = typeof body.tier === 'string' && providers.COST_TIERS.includes(body.tier) ? body.tier : config.costMode;
  const roleFor = process.env.OPENROUTER_API_KEY ? role.resolveRoleForAgent(agent, config.departmentModelDefaults) : 'free';
  const modelId = runtime.modelBroker.getApiModelId(roleFor, tier);
  if (!modelId) return json({ status: 'no_model', userMessage: messages.friendlyMessageFor('no_model', `No model for ${roleFor}/${tier}`) });

  const history = Array.isArray(body.history)
    ? (body.history as Any[]).filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim()).slice(-20).map((m) => ({ role: m.role, content: String(m.content).slice(0, 8000) }))
    : [];

  try {
    const { client: c, providerModelId } = client.resolveClientForModel(modelId, {
      openrouter: server.openRouterClient,
      anthropic: process.env.ANTHROPIC_API_KEY ? server.anthropicClient : null,
      openai: process.env.OPENAI_API_KEY ? server.openAIClient : null,
      google: process.env.GOOGLE_AI_STUDIO_API_KEY ? server.googleClient : null,
      xai: process.env.XAI_API_KEY ? server.xaiClient : null,
      opencode: server.openCodeZenClient,
    });
    const { text, usage: used } = await c.chatCompletion({
      model: providerModelId,
      messages: [{ role: 'system', content: server.buildSystemPrompt(config, agent) }, ...history, { role: 'user', content: message }],
    });
    usage.recordUsage(runtime.usageAudit, { model: modelId, role: roleFor, costTier: tier, agentId: agent.id, usage: used, pricing: runtime.modelBroker.getPricing(roleFor, tier) }).catch(() => {});
    return json({ status: 'ok', agentId: agent.id, agentName: agent.id === 'ceo_agent' ? config.agentName : agent.name, text, tier, model: modelId });
  } catch (err) {
    return json({ status: 'model_call_failed', userMessage: messages.friendlyMessageFor('model_call_failed', String(err)) });
  }
}
