// Who is answering for each Share team right now (rotating answerer,
// 2026-10-31), so the question log can name the student, not just the team.
const NOW = new Map<string, string>();
export const setAnswerer = (team: string, name: string | null) => { if (name) NOW.set(team, name); else NOW.delete(team); };
export const answererFor = (team: string) => NOW.get(team);
