import React from 'react';
import ServicePageLayout from '../ServicePageLayout';

const SpinalSurgeryRehab = () => {
  const service = {
    title: "Spinal Surgery Rehabilitation",
    overview: "A surgeon-supervised program focused on pain management, core stabilization, and safe functional movement after spinal surgery.",
    imgSrc: "/assets/Services/Spinal Surgery.jpg",
    phases: [
      "Initial Phase: Pain and inflammation management, education on body mechanics and posture.",
      "Mobilization Phase: Gentle spinal mobilization and core stability exercises.",
      "Strengthening Phase: Progressive strengthening of core and back muscles.",
      "Functional Phase: Training for safe return to daily activities, work, and recreation."
    ],
    benefits: [
      "Close supervision in line with your surgeon's protocol.",
      "Reduced pain and improved spinal mobility.",
      "Enhanced core strength and stability to protect your spine.",
      "Education on proper body mechanics to prevent future injury.",
      "A confident and safe return to your lifestyle."
    ]
  };

  return <ServicePageLayout service={service} />;
};

export default SpinalSurgeryRehab;