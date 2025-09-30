import React from 'react';
import { useAppContext } from '../context/AppContext.jsx';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';

const PatientListScreen = () => {
  const { patients } = useAppContext();
  const navigate = useNavigate();

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Needs Attention': return 'bg-yellow-100 text-yellow-800';
      case 'New Patient': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePatientClick = (patientId) => {
    navigate(`/demo/patients/${patientId}`);
  };

  return (
    <div className="min-h-screen pb-12 sm:pb-20 w-full bg-gray-50">
      <Header title="My Patients" />
      <div className="p-2 sm:p-4 px-4 sm:px-6 lg:px-8">
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

export default PatientListScreen;
