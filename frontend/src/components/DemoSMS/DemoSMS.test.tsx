import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DemoSMS from './DemoSMS';

describe('DemoSMS', () => {
  it('renders without crashing', () => {
    render(<DemoSMS />);

    // Check if main elements are rendered
    expect(screen.getByText('Understand your dreams. Wake up with a plan.')).toBeInTheDocument();
    expect(screen.getByText('Try It Now')).toBeInTheDocument();
    expect(screen.getByText('How it Works')).toBeInTheDocument();
    expect(screen.getByText('Clara')).toBeInTheDocument();
  });

  it('displays the conversation title', () => {
    render(<DemoSMS />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Understand your dreams. Wake up with a plan.');
  });
});
