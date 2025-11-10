import React from 'react';
import { Link } from 'react-router-dom';

const servicesData = [
  {
    id: 'knee-replacement-rehab',
    title: 'Knee Replacement Rehab',
    description: 'A 25-session plan progressing from acute pain relief to advanced training, ensuring a safe and reliable return to daily life.',
    imgSrc: '/assets/Services/Services (6).jpeg',
  },
  {
    id: 'spinal-surgery-rehab',
    title: 'Spinal Surgery Rehab',
    description: 'A surgeon-supervised program focused on pain management, core stabilization, and safe functional movement after spinal surgery.',
    imgSrc: '/assets/Services/Spinal Surgery.jpg',
  },
  {
    id: 'hip-replacement-rehab',
    title: 'Hip Replacement Rehab',
    description: 'Ensures a safe recovery by focusing on pain control, improving range of motion, and building strength while adhering to surgical precautions.',
    imgSrc: '/assets/Services/Hip Replacement.jpg',
  },
  {
    id: 'ankle-surgery-rehab',
    title: 'Ankle Surgery Rehab',
    description: 'A 25-session plan to control pain and swelling, restore mobility and strength, and enhance stability for a safe return to daily life and sports.',
    imgSrc: '/assets/Services/Services (2).jpeg',
  },
  {
    id: 'elbow-surgery-rehab',
    title: 'Elbow Surgery Rehab',
    description: 'This plan focuses on controlling pain, initiating safe mobilization, and progressing to advanced strengthening to regain full function for occupational or sports activities.',
    imgSrc: '/assets/Services/Services (11).jpeg',
  },
  {
    id: 'wrist-surgery-rehab',
    title: 'Wrist Surgery Rehab',
    description: 'A structured program to manage pain, restore mobility, and improve grip strength and dexterity for a full return to daily tasks and work.',
    imgSrc: '/assets/Services/Services (5).jpeg',
  },
  {
    id: 'shoulder-surgery-rehab',
    title: 'Shoulder Surgery Rehab',
    description: 'A phased approach to restore mobility and stability, progressing from pain control to advanced strengthening and a full return to daily activities.',
    imgSrc: '/assets/Services/Services (12).jpeg',
  },
  {
    id: 'trauma-post-surgery',
    title: 'Trauma Post-Surgery',
    description: 'A phase-wise recovery plan for fractures and polytrauma, tailored to progress from acute pain management to functional training under surgeon clearance.',
    imgSrc: '/assets/Services/Services (9).jpeg',
  },
  {
    id: 'sports-injury-recovery',
    title: 'Sports Injury Recovery',
    description: 'A dedicated plan to help athletes return to play safely, progressing from pain control to sport-specific drills and injury prevention strategies.',
    imgSrc: '/assets/Services/Services (10).jpeg',
  },
  {
    id: 'neurosurgery-rehab',
    title: 'Neurosurgery Rehab',
    description: 'A part-wise recovery program focused on pain control, safe mobilization, and restoring functional independence under surgeon-approved protocols.',
    imgSrc: '/assets/Services/Neurosurgery.jpg',
  },
];

const Services = () => {
  return (
    <main className="main-content">
      {/* Responsive Banner */}
      <section className="relative w-full overflow-hidden bg-gray-200">
        <img src="/assets/carousel1.jpeg" alt="Physiotherapy Banner" className="w-full h-auto max-h-[50vh] object-cover object-center" />
      </section>

      {/* Services Overview */}
      <section className="main-content py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8" id="explore">
        <div className="max-w-7xl mx-auto">
          <h2 className="section-title text-2xl sm:text-3xl md:text-4xl text-center mb-4 sm:mb-6">Our Services</h2>
          <p className="section-subtitle text-sm sm:text-base md:text-lg text-center mb-8 sm:mb-12">
            Welcome to our comprehensive services page. Here you will find detailed information about the expert physiotherapy and rehabilitation services we offer to help you recover and live pain-free.
          </p>

          <div className="card-grid">
            {servicesData.map((service) => (
              <Link to={`/services/${service.id}`} key={service.id} className="block group">
                <div className="card bg-white rounded-lg shadow-md overflow-hidden h-full flex flex-col group-hover:shadow-xl transition-shadow duration-300">
                  <img src={service.imgSrc} alt={service.title} className="w-full h-full object-cover object-center" />
                  <div className="card-body p-4 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-800 group-hover:text-teal-600 transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600">{service.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default Services;
