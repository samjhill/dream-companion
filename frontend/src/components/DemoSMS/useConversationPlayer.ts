import { useEffect, useMemo, useRef, useState } from 'react';
import { demoScript, ScriptLine } from './script';

export interface PlayerOptions {
  loop?: boolean;
  idleLoopDelayMs?: number; // wait before restarting
  reducedMotion?: boolean;
}

export function useConversationPlayer(script: ScriptLine[] = demoScript, opts: PlayerOptions = {}) {
  const { loop = true, idleLoopDelayMs = 2400, reducedMotion = false } = opts;
  const [index, setIndex] = useState<number>(reducedMotion ? script.length : 0);
  const [isPlaying, setIsPlaying] = useState<boolean>(!reducedMotion);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);

  const visible = useMemo(() => script.slice(0, index), [script, index]);

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const step = () => {
    if (index >= script.length) {
      if (loop) {
        timerRef.current = window.setTimeout(() => {
          setIndex(0);
        }, idleLoopDelayMs);
      } else {
        setIsPlaying(false);
      }
      return;
    }

    const nextLine = script[index];
    const delay = Math.max(0, nextLine.delayMs ?? 800);
    setIsTyping(nextLine.from === 'clara');

    timerRef.current = window.setTimeout(() => {
      setIndex((i) => i + 1);
      setIsTyping(false);
    }, delay);
  };

  useEffect(() => {
    if (!isPlaying) return;
    clearTimer();
    step();
    return clearTimer;
  }, [index, isPlaying, loop, idleLoopDelayMs, script, step]);

  // Pause when tab hidden
  useEffect(() => {
    const onVis = () => {
      const hidden = document.hidden;
      setIsPlaying(!hidden);
      if (!hidden) {
        // resume by nudging state
        setIndex((i) => i);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  return {
    visible,
    isTyping,
    isPlaying,
    pause: () => setIsPlaying(false),
    play: () => setIsPlaying(true),
    restart: () => setIndex(0),
  };
}
