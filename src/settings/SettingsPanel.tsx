import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChalkboardTeacher, ChatCircleDots, GameController, GearSix, Leaf, Sparkle, SpeakerHigh, TextAa, X, type Icon } from '@phosphor-icons/react';
import { canVibrate } from '../engine/feedback';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { TellGamify } from '../ui/TellGamify';
import PinGate from './PinGate';
import { ChoiceRow, Slider, Toggle } from '../ui/fields';
import { applyCalm, PRESETS, type Level, type PlayerSettings, type PresetId } from './settings';
import { useSettings } from './SettingsContext';
import Title from '../ui/Title';
import { getMirrorCode, setMirrorCode } from '../live/mirror';
import { makeGameCode } from '../data/gameCodes';

// The gear button: same corner (top right, top left when left-handed), same
// look in every game and on the question screen (product plan 4A). It sits
// in the game's own top row so it never covers game content.
export function GearButton({ onClick, small = false }: { onClick: () => void; small?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t('settings.open')}
      className={`${small ? 'w-11 h-11' : 'w-14 h-14'} shrink-0 rounded-full bg-surface border-[2.5px] border-border flex items-center justify-center active:scale-95 motion-safe:transition`}
      style={small ? undefined : { boxShadow: 'var(--shadow-sticker)' }}
    >
      <GearSix weight="bold" size={small ? 20 : 30} />
    </button>
  );
}

// A game's top row: gear in the player's corner, anything else beside it.
export function GameTopRow({ onSettings, children }: { onSettings: () => void; children?: ReactNode }) {
  const { settings } = useSettings();
  return (
    <div className={`flex items-center gap-3 mb-4 ${settings.leftHanded ? 'flex-row' : 'flex-row-reverse'}`}>
      <GearButton onClick={onSettings} />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

type TabId = 'quick' | 'sound' | 'calm' | 'reading' | 'play' | 'teacher' | 'tell';
const TABS: { id: TabId; icon: Icon; label: StringKey }[] = [
  { id: 'quick', icon: Sparkle, label: 'settings.tab.quick' },
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
    <dialog
      ref={ref}
      onClose={onClose}
      aria-label={t('settings.title')}
      className="m-auto w-[min(640px,calc(100vw-32px))] max-h-[calc(100dvh-32px)] rounded-panel border-[2.5px] border-border bg-surface p-0 backdrop:bg-black/40"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-3 bg-surface border-b-[2px] border-border-soft">
        <h2 className="font-display text-2xl font-bold flex items-center gap-2"><GearSix weight="bold" size={26} /><Title text={t('settings.title')} /></h2>
        <button type="button" onClick={onClose} aria-label={t('settings.close')} className="w-12 h-12 rounded-full border-[2px] border-border flex items-center justify-center bg-surface-2">
          <X weight="bold" size={22} />
        </button>
      </div>

      <div role="tablist" aria-label={t('settings.title')} className="flex gap-1.5 overflow-x-auto px-4 py-2 border-b-[2px] border-border-soft bg-surface">
        {TABS.map(({ id, icon: Icon, label }) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
            className={`shrink-0 min-h-14 min-w-16 px-2.5 rounded-input border-[2px] flex flex-col items-center justify-center gap-0.5 font-bold text-xs
              ${tab === id ? 'bg-accent border-border' : 'bg-surface border-transparent hover:bg-surface-2'}`}>
            <Icon weight="bold" size={22} aria-hidden="true" />{t(label)}
          </button>
        ))}
      </div>

      <div className="px-5 py-4 grid gap-4" role="tabpanel">
        {tab === 'quick' && (
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(PRESETS) as PresetId[]).map((id) => (
              <button key={id} type="button" onClick={() => update(PRESETS[id](s))}
                className="min-h-14 px-3 rounded-input border-[2px] border-border bg-surface-2 font-bold active:scale-95">
                {t(`preset.${id}` as StringKey)}
              </button>
            ))}
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
            <Toggle label={t('settings.screenShake')} value={s.screenShake} onChange={(v) => set('screenShake', v)} />
            <Toggle label={t('settings.dim')} value={s.dim} onChange={(v) => set('dim', v)} />
          </>
        )}

        {tab === 'reading' && (
          <>
            <ChoiceRow label={t('settings.language')} value={s.language} options={[{ value: 'en', label: 'English' }, { value: 'es', label: 'Español' }]} onChange={(v) => set('language', v)} />
            <Choice label={t('settings.textSize')} value={s.textSize} options={['normal', 'large', 'larger']} onChange={(v) => set('textSize', v)} />
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
    </dialog>
  );
}

function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: T[]; onChange: (v: T) => void }) {
  return <ChoiceRow label={label} value={value} options={options.map((o) => ({ value: o, label: t(`opt.${o}` as StringKey) }))} onChange={onChange} />;
}

// Share Mirror: a code a student types on their own device to see the big
// screen's question close up (teacher tab, behind the PIN).
const SHARE_GAMES = ['game-show', 'peg-drop', 'bowling', 'road-hop', 'lunch-rush'];
function MirrorControl({ gameId }: { gameId: string }) {
  const [code, setCode] = useState(getMirrorCode());
  return (
    <div className="grid gap-2 rounded-input border-[2px] border-border p-3">
      <span className="font-bold">{t('mirror.teacherTitle')}</span>
      <span className="text-sm font-semibold">{t('mirror.teacherHint')}</span>
      {code ? (
        <>
          <span className="font-display text-4xl tracking-[0.15em]" aria-label={t('host.codeIs', { code })}>{code}</span>
          <span className="text-sm font-semibold">{t('mirror.teacherHow', { host: window.location.host })}</span>
          <button type="button" onClick={() => { setMirrorCode(''); setCode(''); }} className="justify-self-start min-h-11 px-4 rounded-pill border-[2px] border-border bg-surface-2 font-bold">{t('mirror.stop')}</button>
        </>
      ) : (
        <button type="button" onClick={async () => { const c = (await makeGameCode(gameId, '', 'mirror')).code; setMirrorCode(c); setCode(c); }} className="justify-self-start min-h-11 px-4 rounded-pill border-[2px] border-border bg-accent font-bold">{t('mirror.start')}</button>
      )}
    </div>
  );
}
