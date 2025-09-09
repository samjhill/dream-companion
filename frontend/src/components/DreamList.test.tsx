import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DreamList from './DreamList';
import { fetchAuthSession } from 'aws-amplify/auth';
import { getUserPhoneNumber } from '../helpers/user';

// Mock AWS Amplify
vi.mock('aws-amplify/auth');
vi.mock('../helpers/user');

const mockFetchAuthSession = vi.mocked(fetchAuthSession);
const mockGetUserPhoneNumber = vi.mocked(getUserPhoneNumber);

// Mock fetch globally
global.fetch = vi.fn();

const mockDreams = [
  {
    id: '1',
    createdAt: '2024-01-01T00:00:00Z',
    dream_content: 'I was flying over a beautiful landscape...',
    response: 'This dream suggests freedom and liberation...',
    summary: 'Flying dream\n\n- Freedom\n- Liberation\n- Adventure'
  },
  {
    id: '2',
    createdAt: '2024-01-02T00:00:00Z',
    dream_content: 'I was lost in a maze...',
    response: 'This dream indicates confusion and seeking direction...',
    summary: 'Maze dream\n\n- Confusion\n- Direction\n- Problem-solving'
  }
];

const mockDreamsResponse = {
  dreams: [
    { key: 'dream1' },
    { key: 'dream2' }
  ],
  total: 2,
  hasMore: false
};

describe('DreamList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchAuthSession.mockResolvedValue({
      tokens: { accessToken: 'mock-token' }
    } as any);
    mockGetUserPhoneNumber.mockResolvedValue('+1234567890');
  });

  it('renders loading state initially', () => {
    render(<DreamList />);
    
    expect(screen.getByText('Dream Journal')).toBeInTheDocument();
    expect(screen.getByText('Loading your dreams...')).toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('renders error state when API call fails', async () => {
    (global.fetch as any).mockRejectedValue(new Error('API Error'));

    render(<DreamList />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load your dreams. Please try again later.')).toBeInTheDocument();
    });

    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('renders empty state when no dreams are available', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ dreams: [], total: 0, hasMore: false })
      });

    render(<DreamList />);

    await waitFor(() => {
      expect(screen.getByText('No dreams recorded yet')).toBeInTheDocument();
    });

    expect(screen.getByText('No dreams found. Start recording your dreams to see them here!')).toBeInTheDocument();
  });

  it('renders dreams list when dreams are available', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDreamsResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDreams[0])
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDreams[1])
      });

    render(<DreamList />);

    await waitFor(() => {
      expect(screen.getByText('You have 2 dreams recorded')).toBeInTheDocument();
    });

    expect(screen.getByText('Flying dream')).toBeInTheDocument();
    expect(screen.getByText('Maze dream')).toBeInTheDocument();
  });

  it('expands dream details when clicked', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDreamsResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDreams[0])
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDreams[1])
      });

    render(<DreamList />);

    await waitFor(() => {
      expect(screen.getByText('Flying dream')).toBeInTheDocument();
    });

    const dreamCard = screen.getByText('Flying dream').closest('.dream-container');
    expect(dreamCard).toBeInTheDocument();

    // Click to expand
    fireEvent.click(dreamCard!);

    await waitFor(() => {
      expect(screen.getByText('Dream Content:')).toBeInTheDocument();
      expect(screen.getByText('I was flying over a beautiful landscape...')).toBeInTheDocument();
      expect(screen.getByText('Analysis:')).toBeInTheDocument();
      expect(screen.getByText('This dream suggests freedom and liberation...')).toBeInTheDocument();
    });
  });

  it('toggles dream details with show/hide button', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDreamsResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDreams[0])
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDreams[1])
      });

    render(<DreamList />);

    await waitFor(() => {
      expect(screen.getByText('Flying dream')).toBeInTheDocument();
    });

    const toggleButtons = screen.getAllByText('+');
    const toggleButton = toggleButtons[0]; // Get the first one
    expect(toggleButton).toBeInTheDocument();

    // Click show button
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByText('−')).toBeInTheDocument();
      expect(screen.getByText('Dream Content:')).toBeInTheDocument();
    });

    // Click hide button
    fireEvent.click(screen.getByText('−'));

    await waitFor(() => {
      expect(screen.getAllByText('+')[0]).toBeInTheDocument();
      expect(screen.queryByText('Dream Content:')).not.toBeInTheDocument();
    });
  });

  it('handles keyboard navigation for dream cards', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDreamsResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDreams[0])
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDreams[1])
      });

    render(<DreamList />);

    await waitFor(() => {
      expect(screen.getByText('Flying dream')).toBeInTheDocument();
    });

    const dreamCard = screen.getByText('Flying dream').closest('.dream-container');
    expect(dreamCard).toHaveAttribute('tabIndex', '0');
    expect(dreamCard).toHaveAttribute('role', 'button');

    // Test Enter key
    fireEvent.keyDown(dreamCard!, { key: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText('Dream Content:')).toBeInTheDocument();
    });

    // Test Space key
    fireEvent.keyDown(dreamCard!, { key: ' ' });

    await waitFor(() => {
      expect(screen.getByText('−')).toBeInTheDocument();
    });
  });

  it('shows load more button when hasMore is true', async () => {
    const mockResponseWithMore = {
      ...mockDreamsResponse,
      hasMore: true
    };

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponseWithMore)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDreams[0])
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDreams[1])
      });

    render(<DreamList />);

    await waitFor(() => {
      expect(screen.getByText('Load More Dreams')).toBeInTheDocument();
    });
  });

  it('handles retry button click', async () => {
    (global.fetch as any).mockRejectedValue(new Error('API Error'));

    // Mock window.location.reload
    const mockReload = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true
    });

    render(<DreamList />);

    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Try Again'));
    expect(mockReload).toHaveBeenCalled();
  });

  it('handles error when phone number is not found', async () => {
    mockGetUserPhoneNumber.mockResolvedValue(null);

    render(<DreamList />);

    await waitFor(() => {
      expect(screen.getByText('No phone number found. Please check your profile settings.')).toBeInTheDocument();
    });
  });
});
