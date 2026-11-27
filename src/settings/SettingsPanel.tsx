import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeacher } from '../auth/session';
import { ChalkboardTeacher, ChatCircleDots, CornersIn, CornersOut, GameController, GearSix, Leaf, PersonArmsSpread, Sparkle, SpeakerHigh, TextAa, X, type Icon } from '@phosphor-icons/react';
import { canVibrate } from '../engine/feedback';
import HintButton from '../engine/HintButton';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { TellGamify } from '../ui/TellGamify';
import ReportButton from '../ui/ReportButton';
import PinGate from './PinGate';
import { ChoiceRow, Slider, Toggle } from '../ui/fields';
import { applyCalm, PRESETS, type Level, type PlayerSettings, type PresetId } from './settings';
import { useSettings } from './SettingsContext';
import Title from '../ui/Title';
import { getMirrorCode, setMirrorCode } from '../live/mirror';
import { makeGameCode } from '../data/gameCodes';
import { getGame } from '../games/registry';
import { setStageColor, STAGE_SWATCHES, useStageColor } from '../theme/stageColor';

// The gear button: same corner (top right, top left when left-handed), same
// look in every game and on the question screen (product plan 4A). It sits
// in the game's own top row so it never covers game content.
// Full screen for smart boards and projectors (teacher, 2026-10-29): hides
// the browser's bars so the game fills the board. Hidden where the browser
// cannot do it (phones).
export function FullScreenButton({ small = false }: { small?: boolean }) {
  const [on, setOn] = useState(() => typeof document !== 'undefined' && !!document.fullscreenElement);
  useEffect(() => {
    const sync = () => setOn(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);
  if (typeof document === 'undefined' || !document.fullscreenEnabled) return null;
  const toggle = () => { void (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(() => {}); };
  return (
    <button type="button" onClick={toggle} aria-label={t(on ? 'settings.fullscreenOff' : 'settings.fullscreen')}
      className={`${small ? 'tool-round w-11 h-11' : 'w-14 h-14 border-bold bg-surface'} shrink-0 rounded-full border-border flex items-center justify-center active:scale-95 motion-safe:transition`}
      style={small ? undefined : { boxShadow: 'var(--shadow-sticker)' }}>
      {on ? <CornersIn weight="bold" size={small ? 20 : 28} /> : <CornersOut weight="bold" size={small ? 20 : 28} />}
    </button>
  );
}

// The Report button rides beside every gear (owner, 2026-11-24: a report
// button on every game and every small menu of buttons).
export function GearButton({ onClick, small = false }: { onClick: () => void; small?: boolean }) {
  return (
    <>
    <ReportButton small={small} />
    <button
      type="button"
      onClick={onClick}
      aria-label={t('settings.open')}
      className={`${small ? 'tool-round w-11 h-11' : 'w-14 h-14 bg-surface border-bold border-border'} shrink-0 rounded-full flex items-center justify-center active:scale-95 motion-safe:transition`}
      style={small ? undefined : { boxShadow: 'var(--shadow-sticker)' }}
    >
      <GearSix weight="bold" size={small ? 20 : 30} />
    </button>
    </>
  );
}

// Close leaves the game for the teacher's game list; students have nowhere
// to wander (standing rule), so they never see it.
function CloseButton() {
  const navigate = useNavigate();
  const teacher = useTeacher();
  if (!teacher) return null;
  return (
    <button type="button" onClick={() => navigate('/play')} aria-label={t('settings.closeGame')} title={t('settings.closeGame')} className="w-14 h-14 bg-surface border-bold border-border shrink-0 rounded-full flex items-center justify-center active:scale-95 motion-safe:transition" style={{ boxShadow: 'var(--shadow-sticker)' }}>
      <X weight="bold" size={28} />
    </button>
  );
}

// A game's top row: gear in the player's corner, anything else beside it.
// `hint` (a game id, or the tip lines) adds the lightbulb tips button beside the gear (teacher, 2026-11-24).
export function GameTopRow({ onSettings, children, hint }: { onSettings: () => void; children?: ReactNode; hint?: string | string[] }) {
  const { settings } = useSettings();
  return (
    // Settings, Full screen, then Close (Universal views, approved 2026-11-25);
    // Report rides beside them on every game (owner, 2026-11-24).
    <div className={`game-top flex items-center gap-2 mb-4 ${settings.leftHanded ? 'flex-row' : 'flex-row-reverse'}`}>
      <CloseButton />
      <ReportButton />
      <FullScreenButton />
      {hint && <HintButton {...(typeof hint === 'string' ? { gameId: hint } : { tips: hint })} small={false} />}
      <button type="button" onClick={onSettings} aria-label={t('settings.open')} className="w-14 h-14 bg-surface border-bold border-border shrink-0 rounded-full flex items-center justify-center active:scale-95 motion-safe:transition" style={{ boxShadow: 'var(--shadow-sticker)' }}>
        <GearSix weight="bold" size={30} />
      </button>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

type TabId = 'quick' | 'access' | 'sound' | 'calm' | 'reading' | 'play' | 'teacher' | 'tell';
const TABS: { id: TabId; icon: Icon; label: StringKey }[] = [
  { id: 'quick', icon: Sparkle, label: 'settings.tab.quick' },
  // Accessibility lives in Settings, on every screen (teacher, 2026-11-24).
  { id: 'access', icon: PersonArmsSpread, label: 'settings.tab.access' },
  { id: 'sound', icon: SpeakerHigh, label: 'settings.tab.sound' },
  { id: 'calm', icon: Leaf, label: 'settings.tab.calm' },
  { id: 'reading', icon: TextAa, label: 'settings.tab.reading' },
  { id: 'play', icon: GameController, label: 'settings.tab.play' },
  { id: 'teacher', icon: ChalkboardTeacher, label: 'settings.tab.teacher' }, // behind the teacher PIN
  { id: 'tell', icon: ChatCircleDots, label: 'settings.tab.tell' },
];

export function SettingsPanel({ open, onClose, context }: { open: boolean; onClose: () => void; context?: string }) {
  const { settings: s, update } = useSettings();
  const ref = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState<TabId>('quick');
  const [unlocked, setUnlocked] = useState(false);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
    if (!open) setUnlocked(false); // the Teacher tab locks again when settings close
  }, [open]);

  const set = <K extends keyof PlayerSettings>(k: K, v: PlayerSettings[K]) => update({ ...s, [k]: v });

  return (
    // The approved Settings panel (Universal views 14, 2026-11-25): a centered
    // box over the dimmed game, the title in Grow Year, a vertical tab list
    // on the left (laptop and iPad), wrapping two-across chips on a phone so
    // every tab is in reach; the picked tab is Mint with an ink ring.
    <dialog
      ref={ref}
      onClose={onClose}
      aria-label={t('settings.title')}
      className="settings-panel m-auto w-[min(55rem,calc(100vw-2rem))] h-[min(40rem,calc(100dvh-2rem))] max-h-[calc(100dvh-2rem)] rounded-[1.75rem] border-heavy border-border bg-surface p-0 backdrop:bg-[rgba(29,26,51,0.5)] overflow-hidden"
      style={{ boxShadow: '0 6px 0 var(--ink)' }}
    >
      <div className="h-full flex flex-col">
      <div className="relative shrink-0 flex items-center justify-center px-16 pt-4 pb-3 sm:pt-5">
        <h2 className="title-bubble text-[clamp(2rem,6vw,3.25rem)] leading-none text-center"><Title text={t('settings.title')} /></h2>
        <button type="button" onClick={onClose} aria-label={t('settings.close')} className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border-std border-border flex items-center justify-center bg-surface active:scale-95" style={{ boxShadow: '0 3px 0 var(--ink)' }}>
          <X weight="bold" size={22} />
        </button>
      </div>

      <div className="flex-1 min-h-0 grid grid-rows-[auto_minmax(0,1fr)] sm:grid-rows-1 sm:grid-cols-[13rem_minmax(0,1fr)] gap-3 sm:gap-5 px-4 sm:px-6 pb-4 sm:pb-6">
      <div role="tablist" aria-label={t('settings.title')} className="grid grid-cols-2 sm:grid-cols-1 gap-1.5 sm:gap-2 content-start">
        {TABS.map(({ id, icon: Icon, label }) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
            className={`min-h-11 sm:min-h-12 px-3 rounded-input border-std flex items-center gap-2 font-bold text-sm sm:text-base text-left
              ${tab === id ? 'bg-mint border-border shadow-[inset_0_0_0_1px_var(--ink)]' : 'bg-surface border-border sm:border-transparent hover:bg-surface-2'}`}>
            <Icon weight="bold" size={20} aria-hidden="true" className="shrink-0" />{t(label)}
          </button>
        ))}
      </div>

      <div className="min-h-0 overflow-y-auto px-1 py-1 grid gap-4 content-start" role="tabpanel">
        {tab === 'quick' && (
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(PRESETS) as PresetId[]).map((id) => (
              <button key={id} type="button" onClick={() => update(PRESETS[id](s))}
                className="min-h-14 px-3 rounded-input border-std border-border bg-surface-2 font-bold active:scale-95">
                {t(`preset.${id}` as StringKey)}
              </button>
            ))}
          </div>
        )}

        {tab === 'access' && (
        <div className="grid sm:grid-cols-2 gap-3 items-start">
          <div className="grid gap-3">
            <Choice label={t('settings.textSize')} value={s.textSize} options={['normal', 'large', 'larger']} onChange={(v) => set('textSize', v)} />
            <Toggle label={t('settings.readingComfort')} value={s.readingComfort} onChange={(v) => set('readingComfort', v)} />
            <Toggle label={t('settings.highContrast')} value={s.highContrast} onChange={(v) => set('highContrast', v)} />
            <Toggle label={t('settings.colorSafe')} value={s.colorSafe} onChange={(v) => set('colorSafe', v)} />
          </div>
          <div className="grid gap-3">
            <Slider label={t('settings.voice')} min={0} max={5} value={s.voice} disabled={s.allSoundOff} show={(v) => (v === 0 ? t('settings.off') : String(v))} onChange={(v) => set('voice', v as Level)} />
            <Choice label={t('settings.voiceRate')} value={s.voiceRate} options={['slow', 'normal', 'fast']} onChange={(v) => set('voiceRate', v)} />
            <Toggle label={t('settings.calm')} value={s.calm} onChange={(v) => update(applyCalm(s, v))} />
            <Toggle label={t('settings.dim')} value={s.dim} onChange={(v) => set('dim', v)} />
          </div>
        </div>
        )}
        {tab === 'sound' && (
          <>
            <Toggle label={t('settings.allSoundOff')} value={s.allSoundOff} onChange={(v) => set('allSoundOff', v)} />
            <Slider label={t('settings.effects')} min={0} max={5} value={s.effects} disabled={s.allSoundOff} show={(v) => (v === 0 ? t('settings.off') : String(v))} onChange={(v) => set('effects', v as Level)} />
            <Slider label={t('settings.music')} min={0} max={5} value={s.music} disabled={s.allSoundOff} show={(v) => (v === 0 ? t('settings.off') : String(v))} onChange={(v) => set('music', v as Level)} />
            <Slider label={t('settings.voice')} min={0} max={5} value={s.voice} disabled={s.allSoundOff} show={(v) => (v === 0 ? t('settings.off') : String(v))} onChange={(v) => set('voice', v as Level)} />
            <Choice label={t('settings.voiceRate')} value={s.voiceRate} options={['slow', 'normal', 'fast']} onChange={(v) => set('voiceRate', v)} />
            {canVibrate() && <Toggle label={t('settings.haptics')} value={s.haptics} onChange={(v) => set('haptics', v)} />}
          </>
        )}

        {tab === 'calm' && (
          <>
            <Toggle label={t('settings.calm')} value={s.calm} onChange={(v) => update(applyCalm(s, v))} />
            <Choice label={t('settings.motion')} value={s.motion} options={['full', 'gentle', 'still']} onChange={(v) => set('motion', v)} />
            <Choice label={t('settings.celebrations')} value={s.celebrations} options={['big', 'small', 'off']} onChange={(v) => set('celebrations', v)} />
            <Choice label={t('settings.backgrounds')} value={s.backgrounds} options={['moving', 'still', 'plain']} onChange={(v) => set('backgrounds', v)} />
            <Choice label={t('settings.gifs')} value={s.gifs ?? 'moving'} options={['moving', 'still']} onChange={(v) => set('gifs', v)} />
            <Toggle label={t('settings.screenShake')} value={s.screenShake} onChange={(v) => set('screenShake', v)} />
            <Toggle label={t('settings.dim')} value={s.dim} onChange={(v) => set('dim', v)} />
          </>
        )}

        {tab === 'reading' && (
          <>
            <Choice label={t('settings.textSize')} value={s.textSize} options={['normal', 'large', 'larger']} onChange={(v) => set('textSize', v)} />
            <Toggle label={t('settings.autoRead')} value={s.autoRead} onChange={(v) => set('autoRead', v)} />
            <Toggle label={t('settings.readingComfort')} value={s.readingComfort} onChange={(v) => set('readingComfort', v)} />
            <Toggle label={t('settings.highContrast')} value={s.highContrast} onChange={(v) => set('highContrast', v)} />
            <Toggle label={t('settings.colorSafe')} value={s.colorSafe} onChange={(v) => set('colorSafe', v)} />
          </>
        )}

        {tab === 'play' && (
          <>
            <Choice label={t('settings.timers')} value={s.timers} options={['off', 'relaxed', 'normal']} onChange={(v) => set('timers', v)} />
            <Choice label={t('settings.gameSpeed')} value={s.gameSpeed} options={['slow', 'normal', 'fast']} onChange={(v) => set('gameSpeed', v)} />
            <Toggle label={t('settings.tapOnly')} value={s.tapOnly} onChange={(v) => set('tapOnly', v)} />
            <Toggle label={t('settings.leftHanded')} value={s.leftHanded} onChange={(v) => set('leftHanded', v)} />
            {context && getGame(context) && <StageColorPicker gameId={context} />}
          </>
        )}

        {tab === 'teacher' && !unlocked && <PinGate onUnlock={() => setUnlocked(true)} />}
        {tab === 'teacher' && unlocked && (
          <>
            <p className="text-sm font-bold">{t('settings.accommodationsNote')}</p>
            <Slider label={t('settings.readFirst')} min={0} max={10} value={s.readFirstSeconds}
              show={(v) => (v === 0 ? t('opt.0s') : t('settings.seconds', { count: v }))} onChange={(v) => set('readFirstSeconds', v)} />
            <Toggle label={t('settings.shuffle')} value={s.shuffleAnswers} onChange={(v) => set('shuffleAnswers', v)} />
            <Slider label={t('settings.tries')} min={1} max={4} value={s.triesPerQuestion} show={(v) => String(v)} onChange={(v) => set('triesPerQuestion', v as 1 | 2 | 3 | 4)} />
            <span className="font-bold">{t('settings.toolsAllowed')}</span>
            {(['listen', 'calculator', 'scratchpad', 'highlighter', 'timesTable'] as const).map((tool) => (
              <Toggle key={tool} label={t(tool === 'listen' ? 'q.listenTool' : (`q.${tool}` as StringKey))} value={s.tools[tool]}
                onChange={(v) => update({ ...s, tools: { ...s.tools, [tool]: v } })} />
            ))}
            {context && SHARE_GAMES.includes(context) && <MirrorControl gameId={context} />}
          </>
        )}

        {tab === 'tell' && <TellGamify context={context} />}
      </div>
      </div>
      </div>
    </dialog>
  );
}

function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: T[]; onChange: (v: T) => void }) {
  return <ChoiceRow label={label} value={value} options={options.map((o) => ({ value: o, label: t(`opt.${o}` as StringKey) }))} onChange={onChange} />;
}

// Share Mirror: a code a student types on their own device to see the big
// screen's question close up (teacher tab, behind the PIN).
const SHARE_GAMES = ['game-show', 'pinball', 'castle-quest', 'bowling', 'road-hop', 'lunch-rush'];
function MirrorControl({ gameId }: { gameId: string }) {
  const [code, setCode] = useState(getMirrorCode());
  return (
    <div className="grid gap-2 rounded-input border-std border-border p-3">
      <span className="font-bold">{t('mirror.teacherTitle')}</span>
      <span className="text-sm font-semibold">{t('mirror.teacherHint')}</span>
      {code ? (
        <>
          <span className="font-display text-4xl tracking-[0.15em]" aria-label={t('host.codeIs', { code })}>{code}</span>
          <span className="text-sm font-semibold">{t('mirror.teacherHow', { host: window.location.host })}</span>
          <button type="button" onClick={() => { setMirrorCode(''); setCode(''); }} className="justify-self-start min-h-11 px-4 rounded-pill border-std border-border bg-white font-bold">{t('mirror.stop')}</button>
        </>
      ) : (
        <button type="button" onClick={async () => { const c = (await makeGameCode(gameId, '', 'mirror')).code; setMirrorCode(c); setCode(c); }} className="justify-self-start min-h-11 px-4 rounded-pill border-std border-border bg-accent font-bold">{t('mirror.start')}</button>
      )}
    </div>
  );
}

// The background color behind this game (teacher, 2026-11-01): the theme's
// own, a brand color, or any color.
function StageColorPicker({ gameId }: { gameId: string }) {
  const color = useStageColor(gameId);
  const swatch = (c: string | null, label: string) => (
    <button key={label} type="button" role="radio" aria-checked={(color ?? null) === c} aria-label={label} data-tip={label} onClick={() => setStageColor(gameId, c)}
      className={`w-11 h-11 rounded-full border-bold border-border flex items-center justify-center font-bold text-xs ${(color ?? null) === c ? 'ring-4 ring-accent' : ''}`}
      style={c ? { background: c } : { background: 'linear-gradient(135deg, #fffaf0 50%, #ddd6ff 50%)' }}>{c ? '' : 'A'}</button>
  );
  return (
    <div className="grid gap-2">
      <span className="font-bold">{t('settings.stageColor')}</span>
      <span className="text-sm font-semibold text-muted -mt-1">{t('settings.stageColorHint')}</span>
      <div className="flex flex-wrap gap-2 items-center" role="radiogroup" aria-label={t('settings.stageColor')}>
        {swatch(null, t('settings.stageColorTheme'))}
        {STAGE_SWATCHES.map((c) => swatch(c, c))}
        <label className="w-11 h-11 rounded-full border-bold border-border overflow-hidden relative cursor-pointer" data-tip={t('settings.stageColorCustom')} style={{ background: 'conic-gradient(#ff6b6b, #ffd93d, #6bcb77, #4d96ff, #b06bff, #ff6b6b)' }}>
          <span className="sr-only">{t('settings.stageColorCustom')}</span>
          <input type="color" className="absolute inset-0 opacity-0 cursor-pointer" value={color ?? '#ddd6ff'} onChange={(e) => setStageColor(gameId, e.target.value)} />
        </label>
      </div>
    </div>
  );
}
