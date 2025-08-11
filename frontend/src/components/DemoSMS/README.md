# DemoSMS Component

An animated, loopable SMS-style conversation demo that showcases Clara's dream mentoring capabilities.

## Features

- **Autoplay**: Starts automatically on page load
- **Looping**: Replays with configurable idle delay
- **Interactive**: Pauses on hover, resumes on mouse leave
- **Accessible**: Respects `prefers-reduced-motion` and provides focus styles
- **Responsive**: Mobile-first design that scales to desktop
- **Performance**: Lightweight animations with minimal bundle impact

## Usage

```tsx
import DemoSMS from '@/components/DemoSMS';

export default function HomePage() {
  return (
    <main>
      <DemoSMS />
      {/* Other content */}
    </main>
  );
}
```

## Customization

### Changing the Conversation Script

Edit `script.ts` to modify the conversation:

```ts
export const demoScript: ScriptLine[] = [
  { 
    from: 'user', 
    text: 'Your custom message here', 
    delayMs: 800 // milliseconds after previous message
  },
  { 
    from: 'clara', 
    text: 'Clara\'s response here', 
    delayMs: 1600 
  },
  // Add more messages...
];
```

### Adjusting Timing

- `delayMs`: Time to wait after the previous message before showing the current one
- `idleLoopDelayMs`: Time to wait before restarting the loop (default: 2400ms)

### Styling

The component uses custom CSS classes prefixed with `demo-`. Key classes:

- `.demo-phone-frame`: The phone mockup container
- `.demo-bubble-user`: User message bubbles (blue)
- `.demo-bubble-clara`: Clara message bubbles (white)
- `.demo-sms-section`: The entire section container

## Props & Options

The component uses the `useConversationPlayer` hook internally with these options:

```ts
const options = {
  loop: true,                    // Enable/disable looping
  idleLoopDelayMs: 2400,        // Delay before restart
  reducedMotion: false           // Auto-detected from user preference
};
```

## Accessibility

- Respects `prefers-reduced-motion` media query
- Provides focus styles for interactive elements
- Uses semantic HTML with proper ARIA labels
- Keyboard navigable replay button

## Performance

- Messages are memoized to prevent unnecessary re-renders
- Animations use CSS transforms for hardware acceleration
- Minimal DOM manipulation during playback
- Automatic cleanup of timers and event listeners

## Browser Support

- Modern browsers with ES6+ support
- iOS Safari 12+
- Chrome 70+, Firefox 65+, Edge 79+

## Troubleshooting

### Animation not working
- Check if Framer Motion is properly installed
- Verify `prefers-reduced-motion` is not enabled in system settings

### Messages not advancing
- Check browser console for errors
- Verify the script array is properly formatted
- Check if the component is mounted and visible

### Styling issues
- Ensure the CSS file is imported
- Check for CSS conflicts with existing styles
- Verify viewport meta tag is present for mobile
