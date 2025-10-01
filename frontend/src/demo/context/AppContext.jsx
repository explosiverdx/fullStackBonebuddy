import React, { createContext, useContext, useState } from 'react';
import { mockPatients, mockDoctor, mockReports } from './mockDataSeparate.js';

const AppContext = createContext();

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(mockDoctor);
  const [patients, setPatients] = useState(mockPatients);
  const [reports] = useState(mockReports);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const addPatient = (newPatient) => {
    setPatients(prev => [...prev, newPatient]);
  };

  const logout = () => {
    setCurrentUser(null);
    setSelectedPatient(null);
    // In a real app, you'd also clear any tokens and redirect to a login page.
  };

  const value = {
    currentUser,
    setCurrentUser,
    patients,
    reports,
    selectedPatient,
    setSelectedPatient,
    addPatient,
    logout,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
