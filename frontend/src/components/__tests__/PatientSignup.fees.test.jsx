import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Mock react-router hooks used by PatientSignup
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ state: {} }),
  };
});

// Mock useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    login: vi.fn(),
    user: null,
    verifiedMobile: '',
  }),
}));

import PatientSignup from '../PatientSignup';

describe('PatientSignup registration fee calculation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setup = () => {
    render(<PatientSignup />);

    // Select role = patient (it is default but this keeps test explicit)
    const patientRoleButton = screen.getByRole('button', { name: /patient/i });
    fireEvent.click(patientRoleButton);

    // Set required patient fields that gate the medicalInsurance select visibility / form logic
    // Age is auto-calculated from DOB, so set a valid DOB
    const dobInput = screen.getByLabelText(/date of birth/i);
    fireEvent.change(dobInput, { target: { value: '1990-01-01' } });

    // Minimal required surgery fields
    const surgeryTypeSelect = screen.getByLabelText(/surgery type/i);
    fireEvent.change(surgeryTypeSelect, { target: { value: 'Knee Replacement' } });

    const surgeryDateInput = screen.getByLabelText(/surgery date/i);
    fireEvent.change(surgeryDateInput, { target: { value: '2025-01-01' } });

    // State & city (needed for fee calculation and form validity)
    const stateSelect = screen.getByLabelText(/^state/i);
    const cityInput = screen.getByLabelText(/^city/i);

    const insuranceSelect = screen.getByLabelText(/medical insurance/i);

    return { stateSelect, cityInput, insuranceSelect };
  };

  it('shows ₹18,000 registration fee for insured patient from Uttar Pradesh', () => {
    const { stateSelect, cityInput, insuranceSelect } = setup();

    // Set state to Uttar Pradesh and any city
    fireEvent.change(stateSelect, { target: { value: 'Uttar Pradesh' } });
    fireEvent.change(cityInput, { target: { value: 'Lucknow' } });

    // Select Medical Insurance = Yes
    fireEvent.change(insuranceSelect, { target: { value: 'Yes' } });

    // Registration fee card should show 18,000
    expect(screen.getByText(/registration fee:/i)).toBeInTheDocument();
    expect(screen.getByText(/₹18,000/i)).toBeInTheDocument();
  });

  it('shows ₹35,000 registration fee for insured patient from non-UP state', () => {
    const { stateSelect, cityInput, insuranceSelect } = setup();

    // Set state to a non-UP state
    fireEvent.change(stateSelect, { target: { value: 'Delhi' } });
    fireEvent.change(cityInput, { target: { value: 'New Delhi' } });

    // Select Medical Insurance = Yes
    fireEvent.change(insuranceSelect, { target: { value: 'Yes' } });

    // Registration fee card should show 35,000
    expect(screen.getByText(/registration fee:/i)).toBeInTheDocument();
    expect(screen.getByText(/₹35,000/i)).toBeInTheDocument();
  });

  it('does not show registration fee card for non-insured patients', () => {
    const { stateSelect, cityInput, insuranceSelect } = setup();

    fireEvent.change(stateSelect, { target: { value: 'Uttar Pradesh' } });
    fireEvent.change(cityInput, { target: { value: 'Lucknow' } });

    fireEvent.change(insuranceSelect, { target: { value: 'No' } });

    // No Registration Fee card should be rendered
    expect(screen.queryByText(/registration fee:/i)).toBeNull();
    expect(screen.queryByText(/₹18,000/i)).toBeNull();
    expect(screen.queryByText(/₹35,000/i)).toBeNull();
  });
});

