import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext.jsx';
import ProgressChart from '../components/ProgressChart.jsx';
import session2Video from '../assets/videos/Physiotherapy_Video.mp4';

const PatientDetailsScreen = () => {
  const { id } = useParams();
  const { patients } = useAppContext();
  const [activeTab, setActiveTab] = useState('info');

  console.log('PatientDetailsScreen - URL id param:', id);
  console.log('PatientDetailsScreen - Patients from context:', patients);

  const patient = patients.find(p => p.id === parseInt(id, 10));

  if (!patient) {
    return <div className="p-4">Patient not found.</div>;
  }

  const sortedProgressData = patient.progressData ? [...patient.progressData].sort((a, b) => a - b) : [];

  return (
    <div className="min-h-screen bg-transparent p-3 sm:p-4 md:p-6 lg:p-8 w-full max-w-7xl mx-auto">
      <button onClick={() => window.history.back()} className="mb-3 sm:mb-4 text-blue-600 hover:underline text-sm sm:text-base">
        &larr; Back
      </button>

      <div className="bg-white rounded-lg p-3 sm:p-4 md:p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl sm:text-2xl md:text-3xl flex-shrink-0">
            {patient.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold truncate">{patient.name}</h2>
            <p className="text-gray-600 text-sm sm:text-base md:text-lg truncate">{patient.address}</p>
            <p className="text-gray-600 text-sm sm:text-base md:text-lg">{patient.phone}</p>
            <p className="text-gray-600 text-sm sm:text-base md:text-lg">{patient.dob} • {patient.gender}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-nowrap overflow-x-auto gap-2 sm:gap-4 border-b mb-4 -mx-3 sm:-mx-4 md:-mx-6 lg:-mx-8 px-3 sm:px-4 md:px-6 lg:px-8">
          <button
            className={`flex-shrink-0 py-2 px-3 sm:px-4 text-sm sm:text-base whitespace-nowrap ${activeTab === 'info' ? 'border-b-2 border-blue-600 font-semibold text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
            onClick={() => setActiveTab('info')}
          >
            Info
          </button>
          <button
            className={`flex-shrink-0 py-2 px-3 sm:px-4 text-sm sm:text-base whitespace-nowrap ${activeTab === 'progress' ? 'border-b-2 border-blue-600 font-semibold text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
            onClick={() => setActiveTab('progress')}
          >
            Progress
          </button>
          <button
            className={`flex-shrink-0 py-2 px-3 sm:px-4 text-sm sm:text-base whitespace-nowrap ${activeTab === 'comments' ? 'border-b-2 border-blue-600 font-semibold text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
            onClick={() => setActiveTab('comments')}
          >
            Comments
          </button>
          <button
            className={`flex-shrink-0 py-2 px-3 sm:px-4 text-sm sm:text-base whitespace-nowrap ${activeTab === 'sessions' ? 'border-b-2 border-blue-600 font-semibold text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
            onClick={() => setActiveTab('sessions')}
          >
            Sessions
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'info' && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="font-semibold text-base sm:text-lg md:text-xl mb-1 sm:mb-2 text-gray-800">Age</h3>
                <p className="text-gray-700">{patient.age}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="font-semibold text-base sm:text-lg md:text-xl mb-1 sm:mb-2 text-gray-800">Blood Group</h3>
                <p className="text-gray-700">{patient.bloodGroup}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="font-semibold text-base sm:text-lg md:text-xl mb-1 sm:mb-2 text-gray-800">Last Visit</h3>
                <p className="text-gray-700">{patient.lastVisit}</p>
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg mb-3">
              <h3 className="font-semibold text-base sm:text-lg md:text-xl mb-1 sm:mb-2 text-gray-800">Medical Issue</h3>
              <p className="text-gray-700">{patient.medicalIssue || 'N/A'}</p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="font-semibold text-base sm:text-lg md:text-xl mb-1 sm:mb-2 text-gray-800">Treatment</h3>
              <p className="text-gray-700">{patient.treatment || 'N/A'}</p>
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <div>
            <ProgressChart data={sortedProgressData} labels={['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7']} title="Weekly Progress" />
          </div>
        )}

        {activeTab === 'comments' && (
          <div>
            <p>No comments available.</p>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="font-semibold text-base sm:text-lg md:text-xl mb-2 text-gray-800">Session 1</h3>
              <div className="rounded-lg overflow-hidden">
                <video
                  width="100%"
                  controls
                  className="w-full h-auto"
                >
                  <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="font-semibold text-base sm:text-lg md:text-xl mb-2 text-gray-800">Session 2</h3>
              <div className="rounded-lg overflow-hidden">
                <video
                  width="100%"
                  controls
                  className="w-full h-auto"
                >
                  <source src={session2Video} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDetailsScreen;
