import { useEffect, useRef, type ReactNode } from 'react';
import { GearSix, X } from '@phosphor-icons/react';
import { canVibrate } from '../engine/feedback';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { TellGamify } from '../ui/TellGamify';
import { applyCalm, PRESETS, type Level, type PlayerSettings, type PresetId } from './settings';
import { useSettings } from './SettingsContext';

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

export function SettingsPanel({ open, onClose, context }: { open: boolean; onClose: () => void; context?: string }) {
  const { settings: s, update } = useSettings();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
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
        <h2 className="font-display text-2xl font-bold flex items-center gap-2"><GearSix weight="bold" size={26} />{t('settings.title')}</h2>
        <button type="button" onClick={onClose} aria-label={t('settings.close')} className="w-12 h-12 rounded-full border-[2px] border-border flex items-center justify-center bg-surface-2">
          <X weight="bold" size={22} />
        </button>
      </div>

      <div className="px-5 py-4 grid gap-6">
        <Group title={t('settings.presets')}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(Object.keys(PRESETS) as PresetId[]).map((id) => (
              <button key={id} type="button" onClick={() => update(PRESETS[id](s))}
                className="min-h-12 px-3 rounded-input border-[2px] border-border bg-surface-2 font-bold active:scale-95">
                {t(`preset.${id}` as StringKey)}
              </button>
            ))}
          </div>
        </Group>

        <Group title={t('settings.sound')}>
          <Toggle label={t('settings.allSoundOff')} value={s.allSoundOff} onChange={(v) => set('allSoundOff', v)} />
          <LevelPicker label={t('settings.effects')} value={s.effects} disabled={s.allSoundOff} onChange={(v) => set('effects', v)} />
          <LevelPicker label={t('settings.music')} value={s.music} disabled={s.allSoundOff} onChange={(v) => set('music', v)} />
          <LevelPicker label={t('settings.voice')} value={s.voice} disabled={s.allSoundOff} onChange={(v) => set('voice', v)} />
          <Choice label={t('settings.voiceRate')} value={s.voiceRate} options={['slow', 'normal', 'fast']} onChange={(v) => set('voiceRate', v)} />
          {canVibrate() && <Toggle label={t('settings.haptics')} value={s.haptics} onChange={(v) => set('haptics', v)} />}
        </Group>

        <Group title={t('settings.look')}>
          <Toggle label={t('settings.calm')} value={s.calm} onChange={(v) => update(applyCalm(s, v))} />
          <Choice label={t('settings.motion')} value={s.motion} options={['full', 'gentle', 'still']} onChange={(v) => set('motion', v)} />
          <Choice label={t('settings.celebrations')} value={s.celebrations} options={['big', 'small', 'off']} onChange={(v) => set('celebrations', v)} />
          <Choice label={t('settings.backgrounds')} value={s.backgrounds} options={['moving', 'still', 'plain']} onChange={(v) => set('backgrounds', v)} />
          <Toggle label={t('settings.screenShake')} value={s.screenShake} onChange={(v) => set('screenShake', v)} />
          <Toggle label={t('settings.dim')} value={s.dim} onChange={(v) => set('dim', v)} />
        </Group>

        <Group title={t('settings.reading')}>
          <Choice label={t('settings.textSize')} value={s.textSize} options={['normal', 'large', 'larger']} onChange={(v) => set('textSize', v)} />
          <Toggle label={t('settings.readingComfort')} value={s.readingComfort} onChange={(v) => set('readingComfort', v)} />
          <Toggle label={t('settings.highContrast')} value={s.highContrast} onChange={(v) => set('highContrast', v)} />
          <Toggle label={t('settings.colorSafe')} value={s.colorSafe} onChange={(v) => set('colorSafe', v)} />
        </Group>

        <Group title={t('settings.time')}>
          <Choice label={t('settings.timers')} value={s.timers} options={['off', 'relaxed', 'normal']} onChange={(v) => set('timers', v)} />
          <Choice label={t('settings.gameSpeed')} value={s.gameSpeed} options={['slow', 'normal', 'fast']} onChange={(v) => set('gameSpeed', v)} />
          <Choice
            label={t('settings.readFirst')}
            value={`${s.readFirstSeconds}s` as '0s' | '3s' | '5s'}
            options={['0s', '3s', '5s']}
            onChange={(v) => set('readFirstSeconds', Number(v.replace('s', '')) as 0 | 3 | 5)}
          />
        </Group>

        <Group title={t('settings.controls')}>
          <Toggle label={t('settings.tapOnly')} value={s.tapOnly} onChange={(v) => set('tapOnly', v)} />
          <Toggle label={t('settings.leftHanded')} value={s.leftHanded} onChange={(v) => set('leftHanded', v)} />
        </Group>

        <TellGamify context={context} />
      </div>
    </dialog>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-3">
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted">{title}</h3>
      {children}
    </section>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={value} onClick={() => onChange(!value)}
      className="flex items-center justify-between gap-3 min-h-12 px-4 rounded-input border-[2px] border-border-soft bg-surface text-left font-bold">
      <span>{label}</span>
      <span className={`relative w-14 h-8 rounded-pill border-[2px] border-border shrink-0 ${value ? 'bg-success' : 'bg-surface-2'}`} aria-hidden="true">
        <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-surface border-[2px] border-border motion-safe:transition-all ${value ? 'left-6' : 'left-0.5'}`} />
      </span>
    </button>
  );
}

function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: T[]; onChange: (v: T) => void }) {
  return (
    <div className="grid gap-1.5">
      <span className="font-bold">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o} type="button" role="radio" aria-checked={value === o} onClick={() => onChange(o)}
            className={`min-h-11 px-4 rounded-pill border-[2px] font-bold ${value === o ? 'bg-accent border-border' : 'bg-surface border-border-soft'}`}>
            {t(`opt.${o}` as StringKey)}
          </button>
        ))}
      </div>
    </div>
  );
}

// Off plus 5 bars that grow, so young students see "more" without reading.
function LevelPicker({ label, value, disabled, onChange }: { label: string; value: Level; disabled?: boolean; onChange: (v: Level) => void }) {
  const levels: Level[] = [0, 1, 2, 3, 4, 5];
  return (
    <div className={`grid gap-1.5 ${disabled ? 'opacity-50' : ''}`}>
      <span className="font-bold">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex items-end gap-1.5">
        {levels.map((l) => (
          <button
            key={l}
            type="button"
            role="radio"
            disabled={disabled}
            aria-checked={value === l}
            aria-label={t('settings.level', { label, value: l === 0 ? t('settings.off') : l })}
            onClick={() => onChange(l)}
            className={`w-11 min-h-11 rounded-input border-[2px] flex items-end justify-center pb-1.5 ${value === l ? 'border-border bg-accent' : 'border-border-soft bg-surface'}`}
          >
            {l === 0 ? <span className="text-xs font-bold self-center">{t('settings.off')}</span> : (
              <span className={`w-3 rounded-sm ${l <= value ? 'bg-border' : 'bg-border-soft'}`} style={{ height: 6 + l * 5 }} aria-hidden="true" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
