import React from 'react';
import ServicePageLayout from '../ServicePageLayout';

const ElbowSurgeryRehab = () => {
  const service = {
    title: "Elbow Surgery Rehabilitation",
    overview: "This plan focuses on controlling pain, initiating safe mobilization, and progressing to advanced strengthening to regain full function for occupational or sports activities.",
    imgSrc: "/assets/Services/Services (11).jpeg",
    phases: [
      "Acute Phase: Pain and inflammation control, gentle range of motion exercises.",
      "Subacute Phase: Progressive strengthening and restoration of full mobility.",
      "Functional Phase: Job-specific or sport-specific movements and conditioning.",
      "Return to Activity: Ensuring a safe and confident return to all desired activities."
    ],
    benefits: [
      "Reduced pain and swelling post-surgery.",
      "Improved range of motion and flexibility.",
      "Enhanced strength and endurance for daily tasks.",
      "Faster and safer return to work or sports.",
      "Personalized care plans tailored to your surgery and goals."
    ]
  };

  return <ServicePageLayout service={service} />;
};

export default ElbowSurgeryRehab;