import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Check, CheckCircle, Clock, HandHeart, PaperPlaneTilt, PencilSimple, Printer, Rocket, SealCheck, UsersThree } from '@phosphor-icons/react';
import { data, newId } from '../data';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { Button, buttonClasses, fieldClasses } from '../ui/kit';
import Title from '../ui/Title';
import { useReducedMotion } from '../ui/useReducedMotion';
import { ScrapbookPage } from './scrapbook/Shell';
import { GAMES } from '../games/registry';
import { BETA } from '../beta/spec';
import { betaClosed } from '../billing/trial';
import {
  BETA_ASKS, DEVICES, GRADE_BANDS, HOW_OFTEN, REASON_MIN, ROLES, US_STATES, applicationText, emptyApplication, stepProblems,
  type BetaApplication, type Problem,
} from '../beta/application';

// The formal beta application (owner, 2026-11-26: "we need to have a formal
// form page for beta sign up then"). Short steps, one at a time, with a
// step meter (five since the Design Chair split the asks from the agreement,
// 2026-11-26; onboarding paced like Duolingo, one clear step per screen,
// docs/queue.md section I). Every ask is a required tick, copied from /beta;
// the person building Gamify approves the 10 testers. Anyone not ready to
// commit gets a plain way to start Free now, so non-testers still sign up.
// It sends a 'beta' feedback item (src/beta/application.ts) to the owner
// inbox. Teacher data only: no student information is asked for.

const STEPS = 5;
const FREE = '/login?mode=signup';

export default function BetaApplyPage() {
  const reduce = useReducedMotion();
  const [a, setA] = useState<BetaApplication>(emptyApplication);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [shown, setShown] = useState<Problem[]>([]); // problems shown after Next or leaving a field
  const [state, setState] = useState<'form' | 'sending' | 'failed' | 'sent'>('form');
  const head = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);

  // Each new step: move focus to its heading so keyboards and screen readers start there.
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    head.current?.focus();
    head.current?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  }, [step, state, reduce]);

  const set = <K extends keyof BetaApplication>(k: K, v: BetaApplication[K]) => {
    const next = { ...a, [k]: v };
    setA(next);
    // A shown problem clears as soon as it is fixed.
    if (shown.length) setShown(shown.filter((p) => stepProblems(next, step).includes(p)));
  };
  const toggle = (k: 'grades' | 'devices' | 'games' | 'asks', v: string) => set(k, a[k].includes(v) ? a[k].filter((x) => x !== v) : [...a[k], v]);
  const blur = (p: Problem) => () => { if (stepProblems(a, step).includes(p) && !shown.includes(p)) setShown([...shown, p]); };

  function go(to: number) {
    if (to > step) {
      const left = stepProblems(a, step);
      if (left.length) {
        setShown(left);
        requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-field="${left[0]}"] input, [data-field="${left[0]}"] select, [data-field="${left[0]}"] textarea`)?.focus());
        return;
      }
    }
    setShown([]); setDir(to > step ? 1 : -1); setStep(to);
  }

  async function send() {
    setState('sending');
    try {
      await data.sendFeedback({
        id: newId('fb'), at: new Date().toISOString(), kind: 'beta', role: 'teacher', where: '/beta/apply', device: navigator.userAgent,
        details: applicationText(a, {
          role: t(`betaPage.role.${a.role}` as StringKey),
          devices: a.devices.map((d) => t(`apply.device.${d}` as StringKey)),
          often: t(`apply.often.${a.often}` as StringKey),
        }),
      });
      setState('sent');
    } catch { setState('failed'); }
  }

  const err = (p: Problem) => shown.includes(p);
  const msg = (p: Problem) => err(p) && <span id={`e-${p}`} className="text-sm font-bold text-error" role="alert">{t(`apply.problem.${p}` as StringKey, { min: REASON_MIN })}</span>;
  const aria = (p: Problem) => ({ 'aria-invalid': err(p) || undefined, 'aria-describedby': err(p) ? `e-${p}` : undefined });
  const field = fieldClasses('md', 'w-full');
  const motionProps = reduce ? {} : { initial: { opacity: 0, x: 40 * dir }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -40 * dir }, transition: { duration: 0.22 } };

  const closed = betaClosed();
  if (closed) return <Closed why={closed} />;

  return (
    <ScrapbookPage strength="A">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-10 grid gap-6">
        <header className="grid gap-3">
          <h1 className="title-bubble text-4xl sm:text-6xl min-w-0"><Title text={t('apply.title')} /></h1>
          <p className="text-lg sm:text-xl font-bold m-0">{t('apply.sub', { months: BETA.months })}</p>
          {state !== 'sent' && <p className="m-0 font-semibold lg:hidden">{t('apply.freeShort')} <Link to={FREE} className="font-bold underline underline-offset-4 inline-flex items-center min-h-11">{t('apply.startFree')}</Link></p>}
        </header>

        <div className="grid lg:grid-cols-[1fr_20rem] gap-6 items-start">
          <section aria-label={t('apply.title')} className="sb-card p-5 sm:p-8 grid gap-5 min-w-0 order-1">
            {state === 'sent' ? (
              <Thanks name={a.name.trim()} headRef={head} />
            ) : (
              <>
                <Meter step={step} />
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div key={step} {...motionProps} className="grid gap-5 min-w-0">
                    <div className="grid gap-1">
                      <h2 ref={head} tabIndex={-1} className="font-display text-3xl sm:text-4xl outline-none scroll-mt-24">{t(`apply.step.${step + 1}` as StringKey)}</h2>
                      <p className="font-semibold text-lg m-0">{t(`apply.step.${step + 1}.sub` as StringKey)}</p>
                    </div>

                    {step === 0 && (
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Field id="name" label={t('apply.name')} required msg={msg('name')}>
                          <input id="f-name" autoComplete="name" value={a.name} onChange={(e) => set('name', e.target.value)} onBlur={blur('name')} maxLength={80} required className={field} {...aria('name')} />
                        </Field>
                        <Field id="email" label={t('apply.email')} required msg={msg('email')} hint={t('apply.emailHint')}>
                          <input id="f-email" type="email" autoComplete="email" value={a.email} onChange={(e) => set('email', e.target.value)} onBlur={blur('email')} maxLength={120} required className={field} {...aria('email')} />
                        </Field>
                        <Field id="role" label={t('apply.role')} required>
                          <select id="f-role" value={a.role} onChange={(e) => set('role', e.target.value as BetaApplication['role'])} className={field}>
                            {ROLES.map((r) => <option key={r} value={r}>{t(`betaPage.role.${r}` as StringKey)}</option>)}
                          </select>
                        </Field>
                        <Field id="school" label={t('apply.school')} required msg={msg('school')}>
                          <input id="f-school" autoComplete="organization" value={a.school} onChange={(e) => set('school', e.target.value)} onBlur={blur('school')} maxLength={100} required className={field} {...aria('school')} />
                        </Field>
                        <Field id="state" label={t('apply.state')} required msg={msg('state')}>
                          <select id="f-state" value={a.state} onChange={(e) => set('state', e.target.value)} onBlur={blur('state')} required className={field} {...aria('state')}>
                            <option value="">{t('apply.statePick')}</option>
                            {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </Field>
                        <Field id="classSize" label={<>{t('apply.classSize')} <Opt /></>}>
                          <input id="f-classSize" type="number" inputMode="numeric" min={1} max={300} value={a.classSize} onChange={(e) => set('classSize', e.target.value.slice(0, 3))} className={field} />
                        </Field>
                        <Group id="grades" legend={t('apply.grades')} required msg={msg('grades')} className="sm:col-span-2">
                          {GRADE_BANDS.map((g) => <Chip key={g} label={g} on={a.grades.includes(g)} onChange={() => toggle('grades', g)} />)}
                        </Group>
                        <Field id="subjects" label={<>{t('apply.subjects')} <Opt /></>} className="sm:col-span-2">
                          <input id="f-subjects" value={a.subjects} onChange={(e) => set('subjects', e.target.value)} maxLength={80} placeholder={t('apply.subjectsHint')} className={field} />
                        </Field>
                      </div>
                    )}

                    {step === 1 && (
                      <div className="grid gap-5">
                        <Group id="devices" legend={t('apply.devices')} required msg={msg('devices')}>
                          {DEVICES.map((d) => <Chip key={d} label={t(`apply.device.${d}` as StringKey)} on={a.devices.includes(d)} onChange={() => toggle('devices', d)} />)}
                        </Group>
                        <Group id="often" legend={t('apply.often')} required msg={msg('often')} radio>
                          {HOW_OFTEN.map((o) => <Chip key={o} radio name="often" label={t(`apply.often.${o}` as StringKey)} on={a.often === o} onChange={() => set('often', o)} />)}
                        </Group>
                        <Group id="games" legend={<>{t('apply.games')} <Opt /></>}>
                          {GAMES.map((g) => <Chip key={g.id} label={g.name} on={a.games.includes(g.name)} onChange={() => toggle('games', g.name)} />)}
                        </Group>
                        <Field id="network" label={<>{t('apply.network')} <Opt /></>}>
                          <textarea id="f-network" rows={2} value={a.network} onChange={(e) => set('network', e.target.value)} maxLength={120} placeholder={t('apply.networkHint')} className={`${field} py-2`} />
                        </Field>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="grid gap-5">
                        <fieldset data-field="asks" className="grid gap-2 m-0 p-0 border-0 min-w-0" aria-describedby={err('asks') ? 'e-asks' : undefined}>
                          <legend className="font-bold mb-2">{t('apply.asks')} <Req /></legend>
                          <ul className="grid md:grid-cols-2 gap-2 list-none p-0 m-0">
                            {BETA_ASKS.map((x) => {
                              const on = a.asks.includes(x.key);
                              return (
                                <li key={x.key}>
                                  <label className={`flex gap-3 items-start rounded-input border-std p-3 min-h-11 cursor-pointer h-full motion-safe:transition ${on ? 'bg-butter border-border ring-2 ring-border' : 'bg-surface border-border-soft hover:border-border'}`}>
                                    <input type="checkbox" checked={on} onChange={() => toggle('asks', x.key)} className="w-6 h-6 mt-0.5 shrink-0 accent-[var(--color-grape)]" />
                                    <span className="grid gap-0.5 min-w-0">
                                      <span className="font-bold leading-snug">{t(`betaPage.ask.${x.key}` as StringKey)}</span>
                                      <span className="text-sm font-semibold leading-snug">{t(`betaPage.ask.${x.key}.text` as StringKey)}</span>
                                      <span className="text-xs font-bold inline-flex items-center gap-1 text-muted"><Clock weight="bold" size={13} aria-hidden="true" />{t('betaPage.minutes', { n: x.minutes })}</span>
                                    </span>
                                  </label>
                                </li>
                              );
                            })}
                          </ul>
                          {msg('asks')}
                        </fieldset>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="grid gap-5">
                        <Field id="reason" label={t('apply.reason')} required msg={msg('reason')}>
                          <textarea id="f-reason" rows={4} value={a.reason} onChange={(e) => set('reason', e.target.value)} onBlur={blur('reason')} maxLength={600} required className={`${field} py-2`} {...aria('reason')} aria-describedby={`c-reason${err('reason') ? ' e-reason' : ''}`} />
                          <span id="c-reason" className={`text-sm font-bold ${a.reason.trim().length >= REASON_MIN ? 'text-success-ink' : 'text-muted'}`} aria-live="polite">
                            {a.reason.trim().length >= REASON_MIN ? <><Check weight="bold" size={14} className="inline -mt-0.5 mr-1" aria-hidden="true" />{t('apply.reasonDone', { n: a.reason.trim().length })}</> : t('apply.reasonCount', { n: a.reason.trim().length, min: REASON_MIN })}
                          </span>
                        </Field>
                        <div data-field="agree" className="grid gap-1">
                          <label className={`flex items-start gap-3 font-bold rounded-input border-std p-3 cursor-pointer ${a.agree ? 'bg-butter border-border' : 'bg-surface border-border-soft'}`}>
                            <input type="checkbox" checked={a.agree} onChange={(e) => set('agree', e.target.checked)} className="w-6 h-6 mt-0.5 shrink-0 accent-[var(--color-grape)]" {...aria('agree')} />
                            <span>{t('apply.agree', { spots: BETA.spots })} <Req /></span>
                          </label>
                          {msg('agree')}
                        </div>
                      </div>
                    )}

                    {step === 4 && <Review a={a} edit={(s) => go(s)} />}
                  </motion.div>
                </AnimatePresence>

                {state === 'failed' && <p className="font-bold text-error m-0" role="alert">{t('apply.failed')}</p>}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {step > 0 && <Button size="lg" onClick={() => go(step - 1)} className="hover-pop"><ArrowLeft weight="bold" size={20} aria-hidden="true" />{t('apply.back')}</Button>}
                  {step < STEPS - 1
                    ? <Button variant="go" size="lg" onClick={() => go(step + 1)} className="hover-pop">{t('apply.next')}<ArrowRight weight="bold" size={20} aria-hidden="true" /></Button>
                    : <Button variant="main" size="lg" disabled={state === 'sending'} onClick={() => void send()} className="hover-pop"><PaperPlaneTilt weight="fill" size={20} aria-hidden="true" />{state === 'sending' ? t('apply.sending') : t('apply.send')}</Button>}
                </div>
                <p className="text-sm font-semibold text-muted m-0">{t('apply.privacy')}</p>
              </>
            )}
          </section>

          <aside className="grid gap-4 order-2 min-w-0">
            <div className="sb-card p-5 grid gap-3">
              <ul className="grid gap-3 list-none p-0 m-0">
                {([[SealCheck, t('apply.fact.approve')], [UsersThree, t('apply.fact.spots', { spots: BETA.spots })], [Rocket, t('apply.fact.earn', { months: BETA.months })]] as const).map(([Icon, text]) => (
                  <li key={text} className="flex gap-3 items-start font-bold leading-snug">
                    <span className="w-10 h-10 shrink-0 rounded-full bg-mint border-std border-border flex items-center justify-center"><Icon weight="fill" size={20} aria-hidden="true" /></span>
                    <span className="pt-2">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
            {state !== 'sent' && (
              <div className="sb-card p-5 gap-2 hidden lg:grid">
                <h2 className="font-display text-xl m-0">{t('apply.freeTitle')}</h2>
                <p className="font-semibold m-0">{t('apply.freeText')}</p>
                <Link to={FREE} className={buttonClasses('secondary', 'w-full hover-pop')}>{t('apply.free')}</Link>
              </div>
            )}
          </aside>
        </div>
      </main>
    </ScrapbookPage>
  );
}

// The step meter: five segments, the done ones filled, no outline (owner, 2026-11-25).
function Meter({ step }: { step: number }) {
  return (
    <div className="grid gap-2">
      <p className="m-0 text-sm font-bold" aria-live="polite">{t('apply.stepOf', { n: step + 1, total: STEPS })}: {t(`apply.step.${step + 1}` as StringKey)}</p>
      <ol aria-label={t('apply.steps')} className="grid grid-cols-5 gap-2 list-none p-0 m-0">
        {Array.from({ length: STEPS }, (_, i) => (
          <li key={i} aria-current={i === step ? 'step' : undefined} className="grid gap-1 min-w-0">
            <span className={`h-3 rounded-pill motion-safe:transition-colors ${i <= step ? 'bg-grape' : 'bg-surface-2'}`} />
            <span className={`text-xs truncate hidden sm:block ${i === step ? 'font-bold' : 'font-semibold text-muted'}`}>{t(`apply.step.${i + 1}` as StringKey)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

const Req = () => <span className="text-error" aria-hidden="true" title={t('apply.required')}>*</span>;
const Opt = () => <span className="font-semibold text-muted">{t('apply.optional')}</span>;

function Field({ id, label, required, msg, hint, className = '', children }: { id: string; label: ReactNode; required?: boolean; msg?: ReactNode; hint?: string; className?: string; children: ReactNode }) {
  return (
    <div data-field={id} className={`grid gap-1 content-start min-w-0 ${className}`}>
      <label htmlFor={`f-${id}`} className="font-bold">{label}{required && <> <Req /><span className="sr-only"> ({t('apply.required')})</span></>}</label>
      {children}
      {hint && <span className="text-xs font-semibold text-muted">{hint}</span>}
      {msg}
    </div>
  );
}

function Group({ id, legend, required, msg, radio, className = '', children }: { id: string; legend: ReactNode; required?: boolean; msg?: ReactNode; radio?: boolean; className?: string; children: ReactNode }) {
  return (
    <fieldset data-field={id} className={`grid gap-2 m-0 p-0 border-0 min-w-0 ${className}`} role={radio ? 'radiogroup' : undefined} aria-required={(radio && required) || undefined} aria-describedby={msg ? `e-${id}` : undefined}>
      <legend className="font-bold mb-2">{legend}{required && <> <Req /><span className="sr-only"> ({t('apply.required')})</span></>}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
      {msg}
    </fieldset>
  );
}

// A tappable choice chip (a real checkbox or radio inside): Butter with an ink ring and a check when picked.
function Chip({ label, on, onChange, radio, name }: { label: string; on: boolean; onChange: () => void; radio?: boolean; name?: string }) {
  return (
    <label className={`relative inline-flex items-center gap-1.5 min-h-11 px-4 rounded-pill border-std font-bold cursor-pointer select-none motion-safe:transition has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 ${on ? 'bg-butter border-border ring-2 ring-border' : 'bg-surface border-border-soft hover:border-border'}`}>
      <input type={radio ? 'radio' : 'checkbox'} name={name} checked={on} onChange={onChange} className="sr-only" />
      {on && <Check weight="bold" size={16} aria-hidden="true" />}
      {label}
    </label>
  );
}

function Review({ a, edit }: { a: BetaApplication; edit: (step: number) => void }) {
  const none = t('apply.noneGiven');
  const groups: { step: number; rows: [string, string][] }[] = [
    { step: 0, rows: [[t('apply.name'), a.name], [t('apply.email'), a.email], [t('apply.role'), t(`betaPage.role.${a.role}` as StringKey)], [t('apply.school'), a.school], [t('apply.state'), a.state], [t('apply.grades'), a.grades.join(', ')], [t('apply.classSize'), a.classSize || none], [t('apply.subjects'), a.subjects || none]] },
    { step: 1, rows: [[t('apply.devices'), a.devices.map((d) => t(`apply.device.${d}` as StringKey)).join(', ')], [t('apply.often'), t(`apply.often.${a.often}` as StringKey)], [t('apply.games'), a.games.join(', ') || none], [t('apply.network'), a.network || none]] },
    { step: 2, rows: [[t('apply.asks'), `${a.asks.length} of ${BETA_ASKS.length}`]] },
    { step: 3, rows: [[t('apply.reason'), a.reason]] },
  ];
  return (
    <div className="grid gap-3">
      {groups.map((g) => (
        <section key={g.step} className="rounded-input border-std border-border-soft p-4 grid gap-2 min-w-0" aria-labelledby={`r-${g.step}`}>
          <div className="flex items-center justify-between gap-2">
            <h3 id={`r-${g.step}`} className="font-display text-xl m-0 flex items-center gap-2"><CheckCircle weight="fill" size={22} className="text-success" aria-hidden="true" />{t(`apply.step.${g.step + 1}` as StringKey)}</h3>
            <Button onClick={() => edit(g.step)} aria-label={`${t('apply.edit')} ${t(`apply.step.${g.step + 1}` as StringKey)}`}><PencilSimple weight="bold" size={16} aria-hidden="true" />{t('apply.edit')}</Button>
          </div>
          <dl className="grid sm:grid-cols-[12rem_1fr] gap-x-4 gap-y-1 m-0">
            {g.rows.map(([k, v]) => <div key={k} className="contents"><dt className="font-bold text-sm text-muted">{k}</dt><dd className="m-0 font-semibold break-words">{v}</dd></div>)}
          </dl>
        </section>
      ))}
    </div>
  );
}

// The closed card (Design Chair, 2026-11-26): after Feb 28, 2027 Eastern, or
// once BETA_SPOTS_OPEN is off, the form is gone and Start free stays.
function Closed({ why }: { why: 'ended' | 'full' }) {
  return (
    <ScrapbookPage strength="A">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-10 grid gap-6">
        <section data-beta-closed aria-labelledby="closed-title" className="sb-card p-5 sm:p-8 grid gap-4 justify-items-start max-w-3xl">
          <span className="w-14 h-14 rounded-full bg-butter border-std border-border flex items-center justify-center"><HandHeart weight="fill" size={28} aria-hidden="true" /></span>
          <h1 id="closed-title" className="title-bubble text-4xl sm:text-6xl min-w-0"><Title text={t(why === 'ended' ? 'apply.closedEnded' : 'apply.closedFull')} /></h1>
          <p className="text-lg font-semibold m-0">{t(why === 'ended' ? 'apply.closedEndedText' : 'apply.closedFullText', { spots: BETA.spots })}</p>
          <Link to={FREE} className={buttonClasses('go', 'hover-pop', 'lg')}>{t('apply.startFree')}<ArrowRight weight="bold" size={20} aria-hidden="true" /></Link>
        </section>
      </main>
    </ScrapbookPage>
  );
}

function Thanks({ name, headRef }: { name: string; headRef: RefObject<HTMLHeadingElement> }) {
  return (
    <div className="grid gap-4" role="status">
      <span className="w-16 h-16 rounded-full bg-mint border-bold border-border flex items-center justify-center"><Check weight="bold" size={34} aria-hidden="true" /></span>
      <h2 ref={headRef} tabIndex={-1} className="title-bubble text-4xl outline-none scroll-mt-24"><Title text={t('apply.thanksTitle')} /></h2>
      <p className="text-lg font-bold m-0">{t('apply.thanksSub', { name })}</p>
      <ol className="grid gap-2 list-none p-0 m-0">
        {[1, 2, 3].map((n) => (
          <li key={n} className="flex gap-3 items-start font-semibold">
            <span className="w-9 h-9 shrink-0 rounded-full bg-butter border-std border-border flex items-center justify-center font-display">{n}</span>
            <span className="pt-1.5">{t(`apply.next.${n}` as StringKey, { spots: BETA.spots })}</span>
          </li>
        ))}
      </ol>
      <p className="font-bold m-0">{t('apply.thanksFree')}</p>
      <div className="flex flex-wrap gap-3">
        <Link to={FREE} className={buttonClasses('go', 'hover-pop', 'lg')}>{t('apply.startFree')}</Link>
        <Link to="/beta-kit" className={buttonClasses('secondary', 'hover-pop', 'lg')}><Printer weight="bold" size={18} aria-hidden="true" />{t('apply.kit')}</Link>
      </div>
    </div>
  );
}
