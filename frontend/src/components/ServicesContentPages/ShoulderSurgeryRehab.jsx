import React from 'react';
import ServicePageLayout from '../ServicePageLayout';

const ShoulderSurgeryRehab = () => {
  const service = {
    title: "Shoulder Surgery Rehabilitation",
    overview: "A phased approach to restore mobility and stability, progressing from pain control to advanced strengthening and a full return to daily activities.",
    imgSrc: "/assets/Services/Services (12).jpeg",
    phases: [
      "Phase 1: Protection and Pain Control - Immediate post-op care to protect the repair and manage pain.",
      "Phase 2: Active Motion - Gradual reintroduction of movement and light strengthening.",
      "Phase 3: Strengthening - Progressive resistance training to build shoulder and scapular strength.",
      "Phase 4: Return to Function - Sport-specific or work-specific training to ensure a safe return to all activities."
    ],
    benefits: [
      "Optimal healing and recovery of the shoulder joint.",
      "Restoration of full range of motion.",
      "Increased strength and stability to prevent re-injury.",
      "A clear, phased approach to guide your recovery.",
      "Collaboration with your surgeon for best outcomes."
    ]
  };

  return <ServicePageLayout service={service} />;
};

export default ShoulderSurgeryRehab;