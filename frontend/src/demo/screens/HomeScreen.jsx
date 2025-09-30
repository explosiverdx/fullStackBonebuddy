import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext.jsx';
import { useNavigate } from 'react-router-dom';
import ExploreCarousel from '../components/ExploreCarousel.jsx';
import HamburgerMenu from '../components/HamburgerMenu.jsx';

const HomeScreen = () => {
  const { patients, setSelectedPatient } = useAppContext();
  const [activeTab, setActiveTab] = useState('status');

  const navigate = useNavigate();

  const updates = [
    {
      id: 1,
      type: 'status',
      title: 'New Patient Enrolled',
      message: 'Maria Garcia has joined your program',
      time: '2 hours ago',
      icon: '👋'
    },
    {
      id: 2,
      type: 'video',
      title: 'Exercise Video Updated',
      message: 'Shoulder flexion tutorial has been updated',
      time: '1 day ago',
      icon: '🎥'
    },
    {
      id: 3,
      type: 'article',
      title: 'New Research Article',
      message: 'Latest studies on knee rehabilitation',
      time: '3 days ago',
      icon: '📄'
    }
  ];

  const filteredUpdates = updates.filter(update =>
    activeTab === 'status' ? update.type === 'status' :
    activeTab === 'video' ? update.type === 'video' :
    update.type === 'article'
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Needs Attention': return 'bg-yellow-100 text-yellow-800';
      case 'New Patient': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePatientClick = (patientId) => {
    console.log('HomeScreen - Selected patient ID:', patientId);
    navigate(`/demo/patients/${patientId}`);
  };

  return (
    <div className="min-h-screen pb-12 sm:pb-20 w-full" >
      {/* Banner Section */}
      <header className="text-white p-2 md:p-4 relative w-full bg-gradient-to-r from-[#8a2be2] to-[#4169e1]">
        <div className="w-full flex items-center justify-between container mx-auto">
          <div className="flex items-center">
              <img src="/assets/BoneBuddy_Logo-modified.webp" alt="BoneBuddy Logo" className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 object-contain" />
              <div className="flex flex-col ml-2 md:ml-4">
                <h1 className="text-lg md:text-2xl font-bold mb-0">Welcome to BONEBUDDY</h1>
                <p className="text-gray-200 mb-0 text-sm md:text-base">Post Surgery Physiotherapy</p>
              </div>
          </div>

          <div>
              <HamburgerMenu />
          </div>
        </div>
      </header>

      {/* Carousel Section */}
      <div className="relative">
        <ExploreCarousel />
      </div>

      {/* Updates Section */}
      <div className="p-2 sm:p-4 px-4 sm:px-6 lg:px-8">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-4">Updates</h2>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-2 sm:mb-4">
          {['status', 'video', 'articles'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1 sm:py-2 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Updates List */}
        <div className="space-y-2 sm:space-y-3">
          {filteredUpdates.map((update) => (
            <div
              key={update.id}
              className="bg-white rounded-lg p-2 sm:p-4 shadow-sm border cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                if (update.type === 'status') {
                  // Assuming update.title contains patient name, find patient and navigate
                  const patient = patients.find(p => update.title.includes(p.name));
                  if (patient) {
                    navigate(`/demo/patients/${patient.id}`);
                  }
                }
              }}
            >
              <div className="flex items-start space-x-2 sm:space-x-3">
                <span className="text-xl sm:text-2xl">{update.icon}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{update.title}</h3>
                  <p className="text-gray-600 text-xs sm:text-sm">{update.message}</p>
                  <p className="text-gray-400 text-xs mt-1">{update.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Patient List */}
      <div className="p-2 sm:p-4 px-4 sm:px-6 lg:px-8">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-4">My Patients</h2>
        <div className="space-y-2 sm:space-y-3">
          {patients.map((patient) => (
            <div
              key={patient.id}
              className="bg-white rounded-lg p-2 sm:p-4 shadow-sm border cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handlePatientClick(patient.id)}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm sm:text-base">{patient.avatar}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{patient.name}</h3>
                    <p className="text-gray-600 text-xs sm:text-sm">{patient.condition}</p>
                    <p className="text-gray-400 text-xs">Last session: {patient.lastSession}</p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(patient.status)}`}>
                    {patient.status}
                  </span>
                  <p className="text-gray-600 text-xs sm:text-sm mt-1">{patient.adherence} adherence</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
