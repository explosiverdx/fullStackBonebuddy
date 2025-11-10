import React from 'react';
import ServicePageLayout from '../ServicePageLayout';

const TraumaPostSurgery = () => {
  const service = {
    title: "Trauma Post-Surgery Rehabilitation",
    overview: "A phase-wise recovery plan for fractures and polytrauma, tailored to progress from acute pain management to functional training under surgeon clearance.",
    imgSrc: "/assets/Services/Services (9).jpeg",
    phases: [
      "Acute Phase: Pain and edema control, maintaining mobility in unaffected joints.",
      "Repair Phase: Early protected motion and gradual weight-bearing as cleared by the surgeon.",
      "Remodeling Phase: Progressive strengthening, and restoration of full function.",
      "Return to Activity: Advanced conditioning to return to pre-injury activities and lifestyle."
    ],
    benefits: [
      "Individualized recovery plan based on your specific injury and surgery.",
      "Safe progression of mobility and strength.",
      "Pain management and swelling reduction.",
      "Improved functional outcomes and independence.",
      "Coordination with your surgical team for comprehensive care."
    ]
  };

  return <ServicePageLayout service={service} />;
};

export default TraumaPostSurgery;