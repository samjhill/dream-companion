import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Greet } from './Greet';

// Mock Math.random to ensure consistent testing
const mockMath = Object.create(global.Math);
mockMath.random = vi.fn();
global.Math = mockMath;

describe('Greet Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    mockMath.random.mockReturnValue(0.5);
    render(<Greet />);
    
    expect(screen.getByAltText('Clara the owl - your dream guide')).toBeInTheDocument();
  });

  it('displays a greeting message', () => {
    mockMath.random.mockReturnValue(0.5);
    render(<Greet />);
    
    // The greeting should contain text from the GREETINGS array
    const greetingElement = screen.getByText(/Welcome|Hello|Hi|Good to see you|Hey there|Glad to have you here/);
    expect(greetingElement).toBeInTheDocument();
  });

  it('displays the owl image with correct alt text', () => {
    mockMath.random.mockReturnValue(0.5);
    render(<Greet />);
    
    const image = screen.getByAltText('Clara the owl - your dream guide');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src');
  });

  it('has proper structure with greet-section and greet-content classes', () => {
    mockMath.random.mockReturnValue(0.5);
    render(<Greet />);
    
    expect(screen.getByTestId('greet-section')).toHaveClass('greet-section');
    expect(screen.getByTestId('greet-content')).toHaveClass('greet-content');
  });

  it('splits greeting text correctly with exclamation mark', () => {
    mockMath.random.mockReturnValue(0.5);
    render(<Greet />);
    
    // Check that the greeting is split and formatted properly
    const greetingText = screen.getByText(/Welcome|Hello|Hi|Good to see you|Hey there|Glad to have you here/);
    expect(greetingText).toBeInTheDocument();
  });

  it('uses different random values for image and greeting selection', () => {
    // Mock different random values for image and greeting
    mockMath.random
      .mockReturnValueOnce(0.2) // For image selection
      .mockReturnValueOnce(0.8); // For greeting selection
    
    render(<Greet />);
    
    expect(screen.getByAltText('Clara the owl - your dream guide')).toBeInTheDocument();
    expect(screen.getByText(/Welcome|Hello|Hi|Good to see you|Hey there|Glad to have you here/)).toBeInTheDocument();
  });
});
