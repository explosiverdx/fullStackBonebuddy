import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Mock react-helmet-async
vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }) => <>{children}</>,
  HelmetProvider: ({ children }) => <>{children}</>,
}));

// Mock fetch
global.fetch = vi.fn();

import Home from '../Home';

describe('Home Page Payment Reminders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should display pending payment reminder for logged-in patient', async () => {
    localStorage.setItem('accessToken', 'test-token');
    localStorage.setItem('userRole', 'patient');

    const mockProfile = {
      _id: 'user1',
      Fullname: 'Test Patient',
      medicalInsurance: 'Yes',
      userType: 'patient',
    };

    const mockPayments = [
      {
        _id: 'payment1',
        amount: 18000,
        description: 'Patient Registration Fee',
        status: 'pending',
      },
    ];

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockProfile }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { docs: mockPayments } }),
      });

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText(/your payment is pending/i)).toBeInTheDocument();
      expect(screen.getByText(/₹18,000/i)).toBeInTheDocument();
      expect(screen.getByText(/pay now/i)).toBeInTheDocument();
    });
  });

  it('should display non-insured message for non-insured patients', async () => {
    localStorage.setItem('accessToken', 'test-token');
    localStorage.setItem('userRole', 'patient');

    const mockProfile = {
      _id: 'user1',
      Fullname: 'Test Patient',
      medicalInsurance: 'No',
      userType: 'patient',
    };

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockProfile }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { docs: [] } }),
      });

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText(/our representative will reach you soon/i)).toBeInTheDocument();
    });
  });

  it('should not show payment reminders for non-patients', async () => {
    localStorage.setItem('accessToken', 'test-token');
    localStorage.setItem('userRole', 'doctor');

    render(<Home />);

    await waitFor(() => {
      expect(screen.queryByText(/your payment is pending/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/our representative will reach you soon/i)).not.toBeInTheDocument();
    });
  });
});
