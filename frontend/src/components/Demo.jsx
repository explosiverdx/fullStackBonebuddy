import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppProvider } from '../demo/context/AppContext.jsx';
import BottomNavigation from '../demo/components/BottomNavigation.jsx';
import HomeScreen from '../demo/screens/HomeScreen.jsx';
import PatientDetailsScreen from '../demo/screens/PatientDetailsScreen.jsx';
import DoctorProfileScreen from '../demo/screens/DoctorProfileScreen.jsx';
import ReportDetailsScreen from '../demo/screens/ReportDetailsScreen.jsx';
import { MantineProvider } from '@mantine/core';
import ChangeAddressScreen from '../demo/screens/ChangeAddressScreen.jsx';
import PrivacyPolicyScreen from '../demo/screens/PrivacyPolicyScreen.jsx';
import HelpScreen from '../demo/screens/HelpScreen.jsx';
import ChangeMobileScreen from '../demo/screens/ChangeMobileScreen.jsx';
import EditProfileScreen from '../demo/screens/EditProfileScreen.jsx';
import ReferScreen from '../demo/screens/ReferScreen.jsx';
import PatientListScreen from '../demo/screens/PatientListScreen.jsx';

const Demo = () => {
  return (
    <MantineProvider withGlobalStyles withNormalizeCSS>
      <AppProvider>
        <div
          className="min-h-screen flex"
          style={{ background: `white` }}
        >
          <div className="flex-1">
            <Routes>
              <Route path="" element={<HomeScreen />} />
              <Route path="patients" element={<PatientListScreen />} />
              <Route path="patients/:id" element={<PatientDetailsScreen />} />
              <Route path="profile" element={<DoctorProfileScreen />} />
              <Route path="reports" element={<ReportDetailsScreen />} />
              <Route path="change-address" element={<ChangeAddressScreen />} />
              <Route path="privacy-policy" element={<PrivacyPolicyScreen />} />
              <Route path="help" element={<HelpScreen />} />
              <Route path="change-mobile" element={<ChangeMobileScreen />} />
              <Route path="edit-profile" element={<EditProfileScreen />} />
              <Route path="refer" element={<ReferScreen />} />
            </Routes>
            <BottomNavigation />
          </div>
        </div>
      </AppProvider>
    </MantineProvider>
  );
};

export default Demo;
