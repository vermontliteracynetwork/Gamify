import { data } from '../data';
import { useAsync } from '../data/hooks';
import { GAMES } from '../games/registry';
import { loadMadeThemes } from '../theme/made';

// Is this teacher an approved beta tester? Set when a beta code is redeemed
// (it needs the beta tester agreement), or when the owner gives the plan with
// the note "beta".
const KEY = 'beta-tester';
const FORMS = 'beta-forms';
export const markBetaTester = () => data.setSetting(KEY, true);

export function useBetaTester(): boolean {
  const { value } = useAsync(async () => {
    const [flag, info] = await Promise.all([data.getSetting<boolean>(KEY), data.getSetting<{ note: string | null }>('plan-info')]);
    return !!flag || (info?.note ?? '').toLowerCase().startsWith('beta');
  });
  return !!value;
}

// Games this teacher has sent the after-game form for.
export async function addFormSent(gameId: string) {
  const sent = (await data.getSetting<string[]>(FORMS)) ?? [];
  await data.setSetting(FORMS, [...sent, gameId]);
}

export interface BetaSteps { sets: number; played: string[]; themes: number; forms: number; games: { id: string; name: string }[] }

// The tester checklist: a set of their own, every listed game played, a theme, forms.
export function useBetaSteps(on: boolean) {
  return useAsync(async (): Promise<BetaSteps | null> => {
    if (!on) return null;
    const [sets, log, themes, forms] = await Promise.all([data.listQuestionSets(), data.listQuestionLog(), loadMadeThemes(), data.getSetting<string[]>(FORMS)]);
    const ids = new Set(log.map((e) => e.gameId));
    return {
      sets: sets.filter((s) => s.ownerId !== 'gamify' && s.questions.length > 0).length,
      played: GAMES.filter((g) => ids.has(g.id)).map((g) => g.id),
      themes: themes.filter((th) => th.source === 'custom').length,
      forms: (forms ?? []).length,
      games: GAMES.map((g) => ({ id: g.id, name: g.name })),
    };
  }, [on]);
}
