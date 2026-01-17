import React from 'react';
import { Helmet } from 'react-helmet-async';
import ServicePageLayout from '../ServicePageLayout';

const NeurosurgeryRehab = () => {
  const service = {
    title: "Neurosurgery Rehabilitation",
    overview: "A part-wise recovery program focused on pain control, safe mobilization, and restoring functional independence under surgeon-approved protocols.",
    imgSrc: "/assets/Services/Neurosurgery.jpg",
    phases: [
      "Part 1: Acute Care - Pain and symptom management, safe mobilization techniques.",
      "Part 2: Functional Restoration - Improving balance, coordination, and strength for daily tasks.",
      "Part 3: Independence - Advanced training to maximize functional independence and quality of life.",
      "Part 4: Community Re-integration - Support for returning to work, social, and recreational activities."
    ],
    benefits: [
      "Carefully monitored recovery under surgeon guidelines.",
      "Improved neurological function and mobility.",
      "Enhanced safety and independence in daily life.",
      "Pain management and improved comfort.",
      "Customized program to address specific neurological deficits."
    ]
  };

  return (
    <>
      <Helmet>
        <link rel="canonical" href="https://bonebuddy.cloud/services/neurosurgery-rehab/" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": "BoneBuddy Physiotherapy & Post Surgery Rehab",
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "ratingCount": "2371",
              "reviewCount": "2371"
            }
          })}
        </script>
      </Helmet>
      <ServicePageLayout service={service} />
    </>
  );
};

export default NeurosurgeryRehab;