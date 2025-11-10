import React from 'react';
import ServicePageLayout from '../ServicePageLayout';

const SportsInjuryRecovery = () => {
  const service = {
    title: "Sports Injury Recovery",
    overview: "A dedicated plan to help athletes return to play safely, progressing from pain control to sport-specific drills and injury prevention strategies.",
    imgSrc: "/assets/Services/Services (10).jpeg",
    phases: [
      "Acute Management: Immediate care to control pain, inflammation, and protect the injured area.",
      "Rehabilitation: Restoring range of motion, strength, and neuromuscular control.",
      "Sport-Specific Training: Drills and conditioning tailored to the demands of your sport.",
      "Return to Play: A gradual and monitored return to competition with a focus on injury prevention."
    ],
    benefits: [
      "Faster recovery and safe return to your sport.",
      "Reduced risk of re-injury.",
      "Improved athletic performance.",
      "Personalized programs for athletes of all levels.",
      "Expert guidance on technique and biomechanics."
    ]
  };

  return <ServicePageLayout service={service} />;
};

export default SportsInjuryRecovery;