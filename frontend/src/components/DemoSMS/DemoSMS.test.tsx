import React from 'react';
import { render } from '@testing-library/react';
import DemoSMS from './DemoSMS';

// Mock framer-motion for testing
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('DemoSMS', () => {
  it('renders without crashing', () => {
    const { getByText } = render(<DemoSMS />);

    // Check if main elements are rendered
    expect(getByText('Understand your dreams. Wake up with a plan.')).toBeInTheDocument();
    expect(getByText('Try It Now')).toBeInTheDocument();
    expect(getByText('How it Works')).toBeInTheDocument();
    expect(getByText('Clara')).toBeInTheDocument();
  });

  it('displays the conversation title', () => {
    const { getByRole } = render(<DemoSMS />);

    const heading = getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Understand your dreams. Wake up with a plan.');
  });
});
