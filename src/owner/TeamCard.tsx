import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Bell, Crown, MagnifyingGlass, type Icon, PaintBrush, PersonArmsSpread, Coins, SpeakerHigh, CheckSquare, Sparkle, Bank, RocketLaunch, GameController } from '@phosphor-icons/react';
import DashEmpty from './DashEmpty';
import { CEO_ID, TEAM, type AgentStatus, type TeamAgent } from './agents';

// The Team view (teacher, 2026-11-23, from her reference picture): every
// agent as a round picture on a soft blue map, joined by lines to whoever it
// reports to (the CEO in the middle, once built). Tap one to see what it is
// working on and what it needs from you.
const ICONS: Record<string, Icon> = {
  ceo: Crown, 'design-chair': PaintBrush, claudia: Sparkle, 'qa-tester': CheckSquare,
  'accessibility-specialist': PersonArmsSpread, 'economy-designer': Coins, 'sound-designer': SpeakerHigh, 'vermont-business-advisor': Bank, 'beta-lead': RocketLaunch, 'playtest-lead': GameController,
};
const STATUS: Record<AgentStatus, { label: string; color: string }> = {
  working: { label: 'Working', color: '#1f7a45' },
  waiting: { label: 'Needs you', color: '#c0392b' },
  idle: { label: 'Ready', color: '#7383ad' },
  planned: { label: 'Planned', color: '#7383ad' },
};

// Spots on the map (percent of width and height); the CEO sits in the middle.
function spots(list: TeamAgent[]): Record<string, { x: number; y: number }> {
  const out: Record<string, { x: number; y: number }> = { [CEO_ID]: { x: 50, y: 50 } };
  const others = list.filter((a) => a.id !== CEO_ID);
  others.forEach((a, i) => {
    const ang = (-Math.PI / 2) + (i / others.length) * Math.PI * 2 + 0.5;
    out[a.id] = { x: 50 + Math.cos(ang) * 34, y: 50 + Math.sin(ang) * 30 };
  });
  return out;
}

export default function TeamCard() {
  const [pick, setPick] = useState<string>(TEAM.find((a) => a.needsYou.length)?.id ?? CEO_ID);
  const pos = spots(TEAM);
  const agent = TEAM.find((a) => a.id === pick)!;
  const asks = TEAM.flatMap((a) => a.needsYou.map((n) => ({ a, n })));
  return (
    <div className="grid gap-6">
      <section className="dash-card" aria-labelledby="team-asks">
        <div className="dash-card-head"><h2 id="team-asks" className="flex items-center gap-2"><Bell weight="bold" size={18} />Needs your answer ({asks.length})</h2></div>
        {/* One card per agent, its color on the top edge (portal pass, 2026-11-27: "visual and simple views"). */}
        {asks.length === 0 ? <DashEmpty text="Nothing right now." icon={Bell} /> : (
          <ul className="list-none m-0 p-0 columns-[16rem] gap-3">
            {TEAM.filter((a) => a.needsYou.length).map((a) => (
              <li key={a.id} className="break-inside-avoid mb-3 rounded-[12px] border border-[var(--dash-line)] bg-white grid content-start gap-2 p-3" style={{ borderTop: `4px solid ${a.color}` }}>
                <button type="button" onClick={() => setPick(a.id)} className="justify-self-start text-left font-bold text-sm flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full grid place-items-center shrink-0" style={{ background: a.color }} aria-hidden="true">{(() => { const Ic = a.id === CEO_ID ? Crown : ICONS[a.id] ?? Sparkle; return <Ic weight="fill" size={16} color="#241c3d" />; })()}</span>
                  {a.name}
                </button>
                <ul className="grid gap-3 list-none m-0 p-0">
                  {a.needsYou.map((n) => (
                    <li key={n.text} className="text-sm leading-snug grid gap-1">
                      <span>{n.text}</span>
                      {n.link && (n.link.startsWith('http')
                        ? <a href={n.link} target="_blank" rel="noreferrer" className="dash-link justify-self-start !px-0">Open</a>
                        : <Link to={n.link} className="dash-link justify-self-start !px-0">Open</Link>)}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid xl:grid-cols-[minmax(0,1.6fr)_minmax(18rem,1fr)] gap-6 items-start">
        <section className="relative rounded-[14px] overflow-hidden aspect-[16/10]" style={{ background: '#c8dafc' }} aria-label="Agent team map">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {TEAM.filter((a) => a.reportsTo && pos[a.reportsTo]).map((a) => (
              <line key={a.id} x1={pos[a.id].x} y1={pos[a.id].y} x2={pos[a.reportsTo].x} y2={pos[a.reportsTo].y} stroke="#5aa894" strokeWidth="0.45" vectorEffect="non-scaling-stroke" style={{ strokeWidth: 3 }} strokeDasharray={a.reportsTo === CEO_ID && TEAM[0].status === 'planned' ? '6 5' : undefined} />
            ))}
          </svg>
          {TEAM.map((a, i) => {
            const Ic = a.id === CEO_ID ? MagnifyingGlass : ICONS[a.id] ?? Sparkle;
            const big = a.id === CEO_ID ? 7.5 : a.needsYou.length ? 8.5 : 6.5;
            const on = pick === a.id;
            return (
              <motion.button key={a.id} type="button" onClick={() => setPick(a.id)} aria-pressed={on} aria-label={`${a.name}: ${STATUS[a.status].label}`}
                className="absolute -translate-x-1/2 -translate-y-1/2 grid justify-items-center gap-1"
                style={{ left: `${pos[a.id].x}%`, top: `${pos[a.id].y}%` }}
                initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.05, type: 'spring', stiffness: 260, damping: 18 }} whileHover={{ scale: 1.06 }}>
                <span className="relative rounded-full grid place-items-center" style={{ width: `${big}vw`, height: `${big}vw`, minWidth: 56, minHeight: 56, maxWidth: 104, maxHeight: 104, background: a.id === CEO_ID ? '#fff' : a.color, boxShadow: on ? '0 0 0 4px #fff, 0 0 0 7px #5b4bc4' : '0 6px 16px rgba(36,28,61,0.18)' }}>
                  <Ic weight={a.id === CEO_ID ? 'bold' : 'fill'} size={a.id === CEO_ID ? 34 : 30} color={a.id === CEO_ID ? '#1f7a45' : '#241c3d'} />
                  {a.needsYou.length > 0 && <span className="absolute -top-1 -right-1 min-w-6 h-6 px-1.5 rounded-full text-xs font-bold text-white grid place-items-center" style={{ background: '#c0392b' }}>{a.needsYou.length}</span>}
                </span>
                <span className="text-xs font-bold bg-white/85 rounded-pill px-2 py-0.5 whitespace-nowrap">{a.name}</span>
              </motion.button>
            );
          })}
        </section>

        <section className="dash-card" aria-labelledby="agent-h">
          <div className="dash-card-head">
            <h2 id="agent-h">{agent.name}</h2>
            <span className="text-xs font-bold rounded-pill px-2.5 py-0.5 text-white" style={{ background: STATUS[agent.status].color }}>{STATUS[agent.status].label}</span>
          </div>
          <p className="text-sm text-muted -mt-2">{agent.role}</p>
          <div className="grid gap-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Working on</h3>
            {agent.workingOn.length ? <ul className="m-0 pl-5 text-sm grid gap-1">{agent.workingOn.map((w) => <li key={w}>{w}</li>)}</ul> : <p className="text-sm text-muted">Nothing right now; ready when called.</p>}
          </div>
          <div className="grid gap-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Needs you</h3>
            {agent.needsYou.length ? <ul className="m-0 pl-5 text-sm grid gap-1">{agent.needsYou.map((n) => <li key={n.text}>{n.text}</li>)}</ul> : <p className="text-sm text-muted">Nothing.</p>}
          </div>
          <p className="text-xs text-muted">Reports to: {TEAM.find((x) => x.id === agent.reportsTo)?.name ?? 'You'} · Updated {agent.updated}{agent.file ? ` · ${agent.file}` : ''}</p>
        </section>
      </div>
    </div>
  );
}
