import '@testing-library/jest-dom'
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'
import React from 'react'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Cleanup after each test case
afterEach(() => {
  cleanup()
})

// Mock AWS Amplify
vi.mock('aws-amplify', () => ({
  configure: vi.fn(),
  Auth: {
    currentAuthenticatedUser: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    signUp: vi.fn(),
    confirmSignUp: vi.fn(),
    resendSignUp: vi.fn(),
    forgotPassword: vi.fn(),
    forgotPasswordSubmit: vi.fn(),
    changePassword: vi.fn(),
    currentSession: vi.fn(),
  },
  API: {
    graphql: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    del: vi.fn(),
  },
  Storage: {
    get: vi.fn(),
    put: vi.fn(),
    remove: vi.fn(),
    list: vi.fn(),
  },
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => React.createElement('div', props, children),
    span: ({ children, ...props }: any) => React.createElement('span', props, children),
    button: ({ children, ...props }: any) => React.createElement('button', props, children),
    h1: ({ children, ...props }: any) => React.createElement('h1', props, children),
    h2: ({ children, ...props }: any) => React.createElement('h2', props, children),
    h3: ({ children, ...props }: any) => React.createElement('h3', props, children),
    p: ({ children, ...props }: any) => React.createElement('p', props, children),
    img: ({ ...props }: any) => React.createElement('img', props),
  },
  AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
  useAnimation: () => ({
    start: vi.fn(),
    stop: vi.fn(),
    set: vi.fn(),
  }),
  useInView: () => true,
}))

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/' }),
  Link: ({ children, to, ...props }: any) => React.createElement('a', { href: to, ...props }, children),
  NavLink: ({ children, to, ...props }: any) => React.createElement('a', { href: to, ...props }, children),
  BrowserRouter: ({ children }: any) => React.createElement('div', null, children),
  Routes: ({ children }: any) => React.createElement('div', null, children),
  Route: ({ children }: any) => React.createElement('div', null, children),
}))

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn((date: any) => date.toString()),
  parseISO: vi.fn((dateString) => new Date(dateString)),
  isValid: vi.fn(() => true),
  isToday: vi.fn(() => false),
  isYesterday: vi.fn(() => false),
  differenceInDays: vi.fn(() => 0),
  addDays: vi.fn((date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000)),
  subDays: vi.fn((date, days) => new Date(date.getTime() - days * 24 * 60 * 60 * 1000)),
  startOfToday: vi.fn(() => new Date('2024-01-15T00:00:00Z')),
  eachDayOfInterval: vi.fn(({ start, end }) => {
    const days = [];
    const current = new Date(start);
    while (current <= end) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  }),
}))

// Global test utilities
(global as any).ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
(global as any).IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
