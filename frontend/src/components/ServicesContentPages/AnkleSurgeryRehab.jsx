import React from 'react';
import ServicePageLayout from '../ServicePageLayout';

const AnkleSurgeryRehab = () => {
  const service = {
    title: "Ankle Surgery Rehabilitation",
    overview: "Comprehensive rehabilitation programs for ankle surgery recovery, focusing on restoring mobility, strength, and function.",
    imgSrc: "/assets/Services1.png",
    phases: [
      "Acute Phase: Immediate post-operative care focusing on pain management and swelling reduction",
      "Subacute Phase: Gentle mobilization and early strengthening exercises",
      "Functional Phase: Advanced exercises to restore full function and return to activities",
      "Return to Sport/Activity: Sport-specific training and final conditioning"
    ],
    benefits: [
      "Specialized programs for various ankle surgeries",
      "Collaboration with orthopedic surgeons",
      "Manual therapy techniques",
      "Proprioceptive and balance training",
      "Individualized treatment plans",
      "Expected recovery within 3-6 months"
    ]
  };

  return <ServicePageLayout service={service} />;
};

export default AnkleSurgeryRehab;
