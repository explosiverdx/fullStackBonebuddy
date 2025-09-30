import React from 'react';
import { useAppContext } from '../context/AppContext.jsx';
import ProgressChart from '../components/ProgressChart.jsx';

const ReportDetailsScreen = () => {
  const { selectedPatient, reports } = useAppContext();

  const report = reports.find(r => r.patientId === selectedPatient);

  if (!report) {
    return <div className="p-4">Report not found.</div>;
  }

  return (
    <div className="min-h-screen bg-transparent p-4 w-full">
      <button onClick={() => window.history.back()} className="mb-4 text-blue-600 hover:underline">
        &larr; Back
      </button>

      <div className="bg-white rounded-lg p-4 shadow">
        <h2 className="text-2xl font-semibold mb-4">Report Details</h2>

        <div className="mb-4">
          <h3 className="font-semibold">Medical Issue</h3>
          <p>{report.medicalIssue || 'N/A'}</p>
        </div>

        <div className="mb-4">
          <h3 className="font-semibold">Treatment</h3>
          <p>{report.treatment || 'N/A'}</p>
        </div>

        <div className="mb-4">
          <h3 className="font-semibold">Assigned Team</h3>
          <ul className="list-disc list-inside">
            {report.assignedTeam.map((member, index) => (
              <li key={index}>{member}</li>
            ))}
          </ul>
        </div>

        <div className="mb-4">
          <h3 className="font-semibold mb-2">Progress Chart</h3>
          <ProgressChart data={report.progressData} />
        </div>

        <div>
          <h3 className="font-semibold mb-2">Progress Clips</h3>
          {report.progressClips.map((clip, index) => (
            <div key={index} className="mb-4">
              <p>Session No {index + 1}: {clip.date}</p>
              <video controls className="w-full max-w-md rounded">
                <source src={clip.videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <p>Status: {clip.status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportDetailsScreen;
