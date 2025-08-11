import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';
import { demoScript } from './script';
import { useConversationPlayer } from './useConversationPlayer';
import './DemoSMS.css';

function usePrefersReducedMotion() {
  if (typeof window !== 'undefined') {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  return false;
}

export default function DemoSMS() {
  const reduced = usePrefersReducedMotion();
  const { visible, isTyping, pause, play, restart } = useConversationPlayer(demoScript, {
    loop: false,
    idleLoopDelayMs: 2400,
    reducedMotion: reduced,
  });

  const bubbles = useMemo(() => visible.map((m, i) => (
    <motion.div
      key={i}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className={`demo-message ${m.from === 'user' ? 'demo-message-user' : 'demo-message-clara'}`}
    >
      <div className={`demo-bubble ${m.from === 'user' ? 'demo-bubble-user' : 'demo-bubble-clara'}`}>
        {m.text}
      </div>
    </motion.div>
  )), [visible]);

  return (
    <section className="demo-sms-section">
      <div className="demo-sms-container">
        <div className="demo-sms-content">
          <div className="demo-sms-text">
            <h1 className="demo-sms-title">Understand your dreams. Wake up with a plan.</h1>
            <p className="demo-sms-description">
              Watch a quick example of Clara turning a raw dream into practical guidance. 
              The real experience happens over SMS or in‑app—this is a lightweight preview.
            </p>
          </div>

          <div className="demo-sms-phone">
            <div
              className="demo-phone-frame"
              role="img"
              aria-label="Demo of a text conversation between a user and Clara"
              onMouseEnter={pause}
              onMouseLeave={play}
            >
              {/* Notch/Header */}
              <div className="demo-phone-notch" />
              <div className="demo-phone-header">
                <div className="demo-avatar" aria-hidden />
                <div className="demo-header-info">
                  <span className="demo-contact-name">Clara</span>
                  <span className="demo-contact-status">Typically replies in seconds</span>
                </div>
                <div className="demo-header-actions">
                  <button className="demo-replay-btn" onClick={restart}>Replay</button>
                </div>
              </div>

              {/* Messages */}
              <div className="demo-messages">
                <AnimatePresence mode="popLayout">{bubbles}</AnimatePresence>

                {/* Typing indicator */}
                {!reduced && (
                  <AnimatePresence>
                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="demo-typing-indicator"
                      >
                        <div className="demo-bubble demo-bubble-clara">
                          <span className="demo-typing-dots">
                            <span className="demo-typing-dot" />
                            <span className="demo-typing-dot" />
                            <span className="demo-typing-dot" />
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>

              {/* Composer */}
              <div className="demo-composer">
                <div className="demo-input-area">
                  <div className="demo-input-placeholder">Type your dream…</div>
                  <div className="demo-send-btn">Send</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
