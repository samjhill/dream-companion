export type Role = 'user' | 'clara';
export interface ScriptLine {
  from: Role;
  text: string;
  delayMs?: number; // time after previous bubble
}

export const demoScript: ScriptLine[] = [
  { from: 'user', text: 'Had a dream I was climbing a staircase that never ended. I felt late for something, and the steps kept turning to sand.', delayMs: 1200 },
  { from: 'clara', text: 'Thanks for sharing. Endless stairs often point to striving without a finish line. The sand suggests shifting foundations—goals moving under your feet.', delayMs: 2400 },
  { from: 'clara', text: 'Try this tonight: before bed, write one thing you\'ll allow to be "good enough" tomorrow. Notice how your body feels when you set a limit.', delayMs: 2000 },
  { from: 'clara', text: 'If this resonates, I can walk you through a 3‑minute morning check‑in to anchor your day.', delayMs: 1800 },
];
