import React from 'react';
import { Link } from 'react-router-dom';

const About = () => {
  return (
    <main className="main-content py-8 sm:py-12 pt-20 sm:pt-24">
      {/* About Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8 sm:gap-12 lg:flex-row lg:items-start lg:gap-12 lg:gap-16">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-gray-800">About BoneBuddy</h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed mb-4 sm:mb-6">
            BoneBuddy is a digital health platform developed by Physiox Pvt Ltd, designed to enhance post-surgical recovery through seamless collaboration among patients, physiotherapists, and doctors. Its primary goal is to provide personalized, efficient, and accessible rehabilitation care.
          </p>
          <div className="flex flex-col md:flex-row gap-6 sm:gap-8 mb-6 sm:mb-8">
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800 mb-2">Our Mission</h3>
              <p className="text-sm sm:text-base text-gray-600">To offer an innovative platform that fosters collaboration among doctors, physiotherapists, and patients, enabling faster, safer, and more effective recoveries.</p>
            </div>
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800 mb-2">Our Vision</h3>
              <p className="text-sm sm:text-base text-gray-600">To redefine the post-surgical recovery experience by bridging the gap between patients and healthcare providers, ensuring holistic, patient-centered care.</p>
            </div>
          </div>
          <div className="mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800 mb-3 sm:mb-4">Key Features</h3>
            <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-700">
              <li>Personalized Care Plans: Tailored rehabilitation programs designed to meet individual patient needs</li>
              <li>Real-Time Collaboration: Facilitates communication between patients, physiotherapists, and doctors for continuous monitoring and support</li>
              <li>Progress Tracking: Allows patients and healthcare providers to monitor recovery progress through detailed logs and updates</li>
              <li>Secure Data Management: Ensures patient information is protected with robust security measures</li>
            </ul>
          </div>
          <p className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed mb-4 sm:mb-6">
            BoneBuddy aims to simplify the recovery process, making it more efficient and accessible for patients, while also providing healthcare professionals with tools to deliver optimal care.
          </p>
        </div>

        <div className="flex-1 flex justify-center">
          <img src="/assets/About.png" alt="About BoneBuddy" className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-full rounded-lg object-cover" />
        </div>
      </section>
    </main>
  );
};

export default About;
