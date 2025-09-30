import React from 'react';

const ReferScreen = () => {
  const dummyPhysios = [
    { id: 1, name: 'John Doe', contact: '123-456-7890', specialization: 'Orthopedic Physiotherapy' },
    { id: 2, name: 'Jane Smith', contact: '987-654-3210', specialization: 'Sports Physiotherapy' },
    { id: 3, name: 'Emily Johnson', contact: '555-123-4567', specialization: 'Neurological Physiotherapy' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded shadow mt-6">
      <h2 className="text-2xl font-bold mb-4">Patient Referral to Physiotherapy</h2>
      <p className="mb-4">
        Referring the patient to a physiotherapist for further treatment and rehabilitation.
      </p>
      <h3 className="text-xl font-semibold mb-3">Available Physiotherapists</h3>
      <ul className="space-y-3">
        {dummyPhysios.map((physio) => (
          <li key={physio.id} className="border p-3 rounded shadow-sm">
            <p><strong>Name:</strong> {physio.name}</p>
            <p><strong>Contact:</strong> {physio.contact}</p>
            <p><strong>Specialization:</strong> {physio.specialization}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ReferScreen;
