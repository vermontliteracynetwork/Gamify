import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Cat, DeviceTablet, Question } from '@phosphor-icons/react';
import ClassPlayOptions, { classPlayQuery, DEFAULT_CLASS_PLAY, type ClassPlay } from '../../live/ClassPlay';
import ClassModeIcon from '../../live/ClassModeIcon';
import { LIBRARY } from '../../data/library';
import { useMySets } from '../../data/hooks';
import { makeGameCode } from '../../data/gameCodes';
import { useAsk } from '../../engine/useAsk';
import { playClip } from '../../engine/music';
import TapOk from '../../engine/TapOk';
import { t } from '../../i18n';
import { AccessButton, FullScreenButton, GameTopRow, GearButton, SettingsPanel } from '../../settings/SettingsPanel';
import { useSettings } from '../../settings/SettingsContext';
import { ChoiceRow } from '../../ui/fields';
import { useSignedIn } from '../../auth/session';
import { useGamePool } from '../../student/session';
import { pieceImage } from '../../theme/library';
import { ThemedPage, useGameTheme } from '../../theme/useGameTheme';
import { getLive, useLiveRoom } from '../../live/session';
import Title from '../../ui/Title';
import GameWelcome from '../GameWelcome';
import SetPicker from '../SetPicker';
import SetupWizard from '../SetupWizard';
import ThemeScreen from '../ThemeScreen';
import { useSavedSetup } from '../useSavedSetup';
import { CatArt, INK, MouseArt, RoomArt, SIDE_PASTEL } from './art';
import { pieceFor } from './looks';
import { lookFor, type CompeteRule, type Pace, type Side } from './logic';
import { territoryManifest } from './manifest';
import { SOUNDS } from './Stage';

type Phase = 'welcome' | 'theme' | 'setup';

// Territory (teacher, 2026-11-24). Live only: the teacher sets it up here and
// opens the lobby; the room plays on the class screen (src/live/LiveHost.tsx
// with ./Stage.tsx); each student answers here on their own device.
export default function Territory() {
  return getLive() ? <StudentPlay /> : <TeacherSetup />;
}

function TeacherSetup() {
  const { theme, themes, playable, choose } = useGameTheme('territory');
  const { teacher } = useSignedIn();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('welcome');
  const { value: mine = [] } = useMySets();
  const sets = useMemo(() => [...mine, ...LIBRARY], [mine]);
  const [setup, change] = useSavedSetup('territory', { setId: LIBRARY[0].id, pace: 'slow' as Pace, rule: 'both' as CompeteRule, mode: 'together' as ClassPlay['mode'], goal: 20 });
  const setId = sets.some((s) => s.id === setup.setId) ? setup.setId : LIBRARY[0].id;
  const [classPlay, setClassPlay] = useState<ClassPlay>({ ...DEFAULT_CLASS_PLAY, mode: setup.mode, goal: setup.goal });
  async function openLive() {
    change({ mode: classPlay.mode, goal: classPlay.goal });
    const q = `${classPlayQuery(classPlay)}&pace=${setup.pace}&rule=${setup.rule}`;
    navigate(`/teacher/live/${(await makeGameCode('territory', setId, 'live')).code}?${q}`);
  }
  return (
    <ThemedPage theme={theme} menu>
      <main className="w-full px-4 sm:px-6 pt-6 pb-6">
        <GameTopRow onSettings={() => setSettingsOpen(true)} />
        <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} context="territory" />
        {phase === 'welcome' && (
          <GameWelcome game={territoryManifest} cover={pieceImage(theme, 'cover')} onStart={() => setPhase(themes.length > 1 ? 'theme' : 'setup')} steps={[
            { icon: <Question weight="bold" size={22} />, text: t('territory.how1') },
            { icon: <Cat weight="fill" size={22} />, text: t('territory.how2') },
            { icon: <ClassModeIcon mode="together" size={14} />, text: t('territory.how3') },
          ]} />
        )}
        {phase === 'theme' && <ThemeScreen gameName={territoryManifest.name} current={theme} themes={themes} playable={playable} onChoose={choose} onBack={() => setPhase('welcome')} onNext={() => setPhase('setup')} />}
        {phase === 'setup' && (!teacher ? (
          <p className="max-w-lg mx-auto mt-10 font-bold text-lg text-center flex items-center gap-3"><DeviceTablet weight="bold" size={32} aria-hidden="true" />{t('territory.liveOnly')}</p>
        ) : (
          <SetupWizard onBack={() => setPhase(themes.length > 1 ? 'theme' : 'welcome')} onPlay={() => void openLive()} playLabel={t('way.openLobby')} pages={[
            { id: 'class', title: t('live.howPlay'), content: <ClassPlayOptions value={classPlay} onChange={setClassPlay} /> },
            { id: 'options', title: t('setup.options'), content: (
              <div className="grid gap-5">
                <ChoiceRow label={t('territory.pace')} value={setup.pace} onChange={(pace) => change({ pace })}
                  options={(['slow', 'normal', 'fast'] as const).map((p) => ({ value: p, label: t(`territory.pace.${p}`) }))} />
                {classPlay.mode === 'compete' && (
                  <ChoiceRow label={t('territory.rule')} value={setup.rule} onChange={(rule) => change({ rule })}
                    options={(['both', 'add', 'chase'] as const).map((r) => ({ value: r, label: t(`territory.rule.${r}`) }))} />
                )}
              </div>
            ) },
            { id: 'questions', title: t('setup.questions'), content: <SetPicker sets={sets} value={[setId]} onChange={(ids) => change({ setId: ids[0] })} /> },
          ]} />
        ))}
      </main>
    </ThemedPage>
  );
}

// The student's device (iPad first): the living room behind the standard
// question card, their team and animal in the top strip, and after each right
// answer a card that waits for a tap.
function StudentPlay() {
  const { settings } = useSettings();
  const { theme } = useGameTheme('territory');
  const { state, me } = useLiveRoom();
  const game = useGamePool([]);
  const { ask, cancel, element, asking } = useAsk({ gameId: 'territory', mode: 'live', pool: game.pool, classroomId: game.classroomId, studentId: game.studentId, framed: true });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reward, setReward] = useState(false);
  const [stopped, setStopped] = useState(false);
  const mode = state?.mode === 'compete' ? 'compete' : 'together';
  const side: Side = mode === 'compete' ? (state?.teams?.[me?.pid ?? ''] ?? 'defender') : 'defender';
  const look = me ? lookFor(me.pid, side) : 0;
  const rule = (state?.options?.rule ?? 'both') as CompeteRule;
  const room = state?.room;

  const running = useRef(false);
  const tapped = useRef<(() => void) | null>(null);
  async function loop() {
    if (running.current) return;
    running.current = true; setStopped(false);
    for (;;) {
      const done = await ask();
      if (!done) break;
      playClip(SOUNDS.pounce, settings, 0.5);
      setReward(true);
      await new Promise<void>((res) => { tapped.current = res; });
      setReward(false);
    }
    running.current = false; setStopped(true);
  }
  useEffect(() => { if (game.pool.length && state?.phase === 'play' && me?.status === 'in') void loop(); }, [game.pool.length, state?.phase, me?.status]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (state?.phase === 'ended') cancel(); }, [state?.phase, cancel]);

  const rightText = mode === 'together' ? t('territory.rightTogether') : rule === 'add' ? t('territory.rightAdd') : side === 'defender' ? t('territory.rightCat') : t('territory.rightMouse');
  const Art = ({ className }: { className: string }) => {
    const { img } = pieceFor(theme, side, look);
    if (img) return <img src={img} alt="" className={`${className} object-contain`} />;
    return side === 'defender' ? <CatArt look={look} className={className} /> : <MouseArt look={look} className={className} />;
  };

  return (
    <ThemedPage theme={theme}>
      <main className="!p-0">
        <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} context="territory" />
        <section className="relative play-fill">
          <h1 className="sr-only"><Title text={territoryManifest.name} /></h1>
          <RoomArt background={pieceImage(theme, 'background')} entrance={pieceImage(theme, 'entrance')} className="absolute inset-0" />
          {/* A: who I am, on which team, and how the room stands */}
          <div className="absolute top-3 left-3 right-[10.5rem] flex justify-start">
            <div className="flex items-center gap-3 pl-1.5 pr-4 py-1.5 rounded-pill border-[3px] border-[#1d1a33] max-w-full" style={{ background: SIDE_PASTEL[side], boxShadow: `0 4px 0 ${INK}` }}>
              <span className="w-12 h-12 shrink-0 rounded-full bg-[#fffaf0] border-[2.5px] border-[#1d1a33] grid place-items-center"><Art className="w-[80%] h-[80%]" /></span>
              <span className="grid leading-tight min-w-0">
                <span className="font-display uppercase text-lg truncate"><Title text={mode === 'together' ? t('territory.youTogether') : side === 'defender' ? t('territory.youCat') : t('territory.youMouse')} /></span>
                <span className="font-bold text-sm flex items-center gap-1.5"><ClassModeIcon mode={mode} size={11} />{t(`live.mode.${mode}`)}{room && mode === 'compete' ? ` · ${t('territory.score', { cats: room.defenders, mice: room.invaders })}` : ''}</span>
              </span>
            </div>
          </div>
          <div className="absolute top-3 right-3 flex items-center gap-2 z-10 [&_button]:!w-11 [&_button]:!h-11">
            <FullScreenButton small />
            <AccessButton small />
            <GearButton small onClick={() => setSettingsOpen(true)} />
          </div>
          {stopped && !asking && !reward && state?.phase === 'play' && (
            <div className="absolute inset-0 grid place-items-center"><TapOk label={t('territory.next')} onTap={() => void loop()} /></div>
          )}
        </section>
        {/* D: one card, until it is tapped */}
        <AnimatePresence>
          {reward && (
            <motion.div key="reward" className="fixed inset-0 z-50 grid place-items-center p-4 bg-[#1d1a33]/40" role="dialog" aria-modal="true" aria-label={rightText}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: settings.motion === 'still' ? 0.15 : 0.35 }}>
              <motion.div className="w-[min(26rem,92vw)] bg-[#fffaf0] border-[3px] border-[#1d1a33] rounded-panel p-6 grid gap-3 justify-items-center text-center" style={{ boxShadow: `0 6px 0 ${INK}` }}
                initial={settings.motion === 'still' ? { opacity: 0 } : { opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: settings.motion === 'still' ? 0.15 : 0.7, ease: [0.22, 1, 0.36, 1] }}>
                <span className="relative w-36 h-36 rounded-full grid place-items-center" style={{ background: SIDE_PASTEL[side] }}>
                  <motion.span className="w-[80%] h-[80%] block" animate={settings.motion === 'full' ? { y: [0, -12, 0], rotate: [0, -4, 0] } : undefined} transition={{ duration: 0.9, repeat: 2, ease: 'easeInOut' }}><Art className="w-full h-full" /></motion.span>
                </span>
                <h2 className="font-display uppercase text-3xl leading-tight"><Title text={rightText} /></h2>
                <p className="font-bold text-lg">{t('territory.lookUp')}</p>
                <TapOk label={t('territory.next')} onTap={() => tapped.current?.()} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {element}
      </main>
    </ThemedPage>
  );
}
