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

// Mock fetch
global.fetch = vi.fn();

import PatientProfile from '../PatientProfile';

describe('PatientProfile Payment Display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should display pending payment reminder on overview tab', async () => {
    const mockPayments = [
      {
        _id: 'payment1',
        amount: 18000,
        description: 'Patient Registration Fee',
        status: 'pending',
        paymentType: 'registration',
      },
    ];

    const mockProfile = {
      _id: 'user1',
      Fullname: 'Test Patient',
      medicalInsurance: 'Yes',
      userType: 'patient',
      sessions: [], // Add sessions array to prevent filter error
    };

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockProfile }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { docs: mockPayments } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }), // Reports endpoint
      });

    render(<PatientProfile />);

    await waitFor(() => {
      expect(screen.getByText(/amount to pay/i)).toBeInTheDocument();
      expect(screen.getByText(/₹18,000/i)).toBeInTheDocument();
      expect(screen.getByText(/pay now/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should display non-insured message when no pending payments', async () => {
    const mockProfile = {
      _id: 'user1',
      Fullname: 'Test Patient',
      medicalInsurance: 'No',
      userType: 'patient',
      sessions: [], // Add sessions array
    };

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockProfile }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { docs: [] } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }), // Reports endpoint
      });

    render(<PatientProfile />);

    await waitFor(() => {
      expect(screen.getByText(/our representative will reach you soon/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should show payment details in payments tab', async () => {
    const mockPayments = [
      {
        _id: 'payment1',
        amount: 35000,
        description: 'Patient Registration Fee',
        status: 'pending',
        paymentType: 'registration',
      },
    ];

    const mockProfile = {
      _id: 'user1',
      Fullname: 'Test Patient',
      medicalInsurance: 'Yes',
      userType: 'patient',
      sessions: [], // Add sessions array
    };

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockProfile }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { docs: mockPayments } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }), // Reports endpoint
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { docs: mockPayments } }),
      }); // Payments refetch when tab changes

    render(<PatientProfile />);

    // Switch to payments tab
    await waitFor(() => {
      const paymentsTab = screen.getByText(/payments/i);
      paymentsTab.click();
    });

    await waitFor(() => {
      expect(screen.getByText(/₹35,000/i)).toBeInTheDocument();
      expect(screen.getByText(/patient registration fee/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
