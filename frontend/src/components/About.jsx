import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const About = () => {
  return (
    <>
      <Helmet>
        <link rel="canonical" href="https://bonebuddy.cloud/about/" />
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
      <main className="main-content py-8 sm:py-12 pt-20 sm:pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">
          {/* About BoneBuddy Section */}
          <section>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-gray-800">About BoneBuddy</h1>
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
              <div className="flex-1">
                <p className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed mb-4 sm:mb-6">
                  <strong>BoneBuddy, India's first doorstep physiotherapy platform</strong>, created to transform how patients recover after surgery or injury. We focus on executing and monitoring post-orthopaedic, sports, and neuro-surgery rehabilitation through a structured, clinically guided approach—right at home.
                </p>
                <p className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed mb-4 sm:mb-6">
                  Our platform brings together a coordinated healthcare team of doctors and certified physiotherapists to ensure every patient receives the right care at the right time. Each recovery journey is powered by personalized rehabilitation plans, evidence-based protocols, and continuous progress monitoring.
                </p>
                <p className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed mb-4 sm:mb-6">
                  At <strong>BoneBuddy</strong>, we believe recovery should be simple, efficient, and accessible to everyone. That's why we've built a complete recovery ecosystem that supports patients while enabling healthcare professionals to collaborate seamlessly.
                </p>
                <p className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed mb-4 sm:mb-6">
                  Whether it's a joint replacement, fracture, ligament repair, or major surgery, BoneBuddy ensures a smoother, safer recovery through expert guidance, real-time coordination, and compassionate care—delivered at the patient's doorstep.
                </p>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                  BoneBuddy is a division of <strong>Physiox Private Limited</strong>.<br />
                  <strong>CIN:</strong> U85100UP2023PTC176761<br />
                  <strong>Incorporated on:</strong> 10 January 2023<br />
                  <strong>Registered at:</strong> Lucknow, Uttar Pradesh
                </p>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  Physiox Private Limited is a trusted healthcare organisation dedicated to building innovative solutions that elevate the quality, accessibility, and outcomes of patient care across India.
                </p>
              </div>
              <div className="flex-1 flex justify-center">
                <img src="/assets/About.png" alt="About BoneBuddy" className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-full rounded-lg object-cover" />
              </div>
            </div>
          </section>

          {/* Vision & Mission */}
          <section className="bg-gray-50 rounded-lg p-6 sm:p-8">
            <div className="flex flex-col md:flex-row gap-6 sm:gap-8">
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-800 mb-3 sm:mb-4">Vision</h2>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  To redefine the post‑surgical recovery experience by bridging the gap between patients and healthcare providers—ensuring holistic, patient‑centred rehabilitation.
                </p>
              </div>
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-800 mb-3 sm:mb-4">Mission</h2>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  To provide an innovative digital platform that fosters collaboration among doctors, physiotherapists, and patients—enabling faster, safer, and more effective recoveries.
                </p>
              </div>
            </div>
          </section>

          {/* Our Story */}
          <section>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-800 mb-4 sm:mb-6">Our Story</h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed mb-4 sm:mb-6">
              BoneBuddy was founded on a simple yet powerful belief: <strong>recovery is a collaborative journey</strong>.
            </p>
            <p className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed mb-4 sm:mb-6">
              Bonebuddy moves beyond temporary or fragmented solutions to deliver comprehensive, patient-centered rehabilitation that empowers individuals to heal effectively and achieve a higher level of physical wellness than before.
            </p>
            <p className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed mb-4 sm:mb-6">
              By combining clinical expertise with advanced digital technology, our mission is to set a new benchmark in post‑surgical rehabilitation—ensuring every patient receives structured, measurable, and compassionate care.
            </p>
            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-800">
              <strong>Smart Recovery Starts Here</strong>
            </p>
          </section>

          {/* What We Do */}
          <section>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-800 mb-4 sm:mb-6">What We Do</h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed mb-4 sm:mb-6">
              We help patients recover faster and safer after surgery or injury through expert-led physiotherapy at home. Our smart platform connects patients with <strong>Qualified and Experienced</strong> physiotherapists and doctors to deliver personalized, evidence-based rehabilitation programs—all designed around individual recovery needs.
            </p>
            <p className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed mb-6 sm:mb-8">
              From assessment to progress tracking, we ensure every step of recovery is clinically guided, carefully monitored, and conveniently delivered at home.
            </p>

            <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 mb-6 sm:mb-8">
              <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6">Our Services</h3>
              <h4 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">Premium & Specialist Physiotherapy Services</h4>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4 sm:mb-6">
                Every treatment begins with understanding your story—not just your symptoms. We start with a comprehensive clinical assessment, then architect a customized, goal-oriented rehabilitation plan using advanced physiotherapy techniques. As you progress, your plan evolves with you.
              </p>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-6 sm:mb-8 font-semibold">
                The Promise: Faster healing. Better outcomes. Real confidence in your recovery.
              </p>

              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h5 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">Post‑Surgical Rehabilitation</h5>
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                    Expert rehabilitation for knee, hip, and shoulder replacements, ACL/PCL repairs, ligament injuries, and spinal surgeries. Our focus is on restoring mobility, reducing pain, and ensuring a safe return to daily activities.
                  </p>
                </div>
                <div>
                  <h5 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">Sports Injury Recovery & Prevention</h5>
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                    Treatment for sprains, strains, tendonitis, and chronic musculoskeletal conditions using biomechanical analysis, functional training, and preventive strengthening.
                  </p>
                </div>
                <div>
                  <h5 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">Doorstep Physiotherapy Care</h5>
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                    For patients with limited mobility or those who prefer home‑based care, our expert physiotherapists deliver personalised treatment at the patient's doorstep using essential medical equipment.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Our Approach */}
          <section>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-800 mb-4 sm:mb-6">Our Approach — How We Work</h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed mb-6 sm:mb-8">
              Our approach integrates <strong>clinical precision, innovative technology, and patient‑first care</strong> to create a structured, safe, and effective recovery pathway.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Clinical Precision</h3>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  All rehabilitation plans are designed and supervised by experienced orthopaedic surgeons and certified physiotherapists.
                </p>
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Advanced Technology</h3>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  Our platform uses real-time monitoring, exercise validation, smart reminders, and digital progress tracking to support safe and structured rehabilitation.
                </p>
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Patient‑First Methodology</h3>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  Our structured, phase‑wise recovery system ensures safe progression without complications—delivering high‑quality, measurable clinical outcomes.
                </p>
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-6 sm:p-8">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Expert Orthopaedic & Neuro Care</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                With over a decade of experience, our orthopaedic and neuro specialists deliver trusted care for Spine, Brain, Knee, Hip, Sports, and Trauma conditions. The focus remains on safe treatment, ethical practice, and modern medical approaches for better recovery outcomes.
              </p>
            </div>
          </section>

          {/* Why Choose Us */}
          <section>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-800 mb-4 sm:mb-6">Why Choose Us</h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-sm sm:text-base text-gray-700 list-disc list-inside">
              <li>Expert physiotherapists with orthopaedic supervision</li>
              <li>Evidence‑based rehabilitation protocols aligned with global standards</li>
              <li>Faster and safer recovery through structured, phase‑wise programmes</li>
              <li>Doorstep and digital physiotherapy for maximum convenience</li>
              <li>Transparent doctor‑therapist‑patient collaboration</li>
              <li>Real‑time progress tracking and digital dashboards</li>
              <li>High patient satisfaction and trusted clinical outcomes</li>
            </ul>
          </section>

          {/* Our Vision for the Future */}
          <section className="bg-gray-50 rounded-lg p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-800 mb-4 sm:mb-6">Our Vision for the Future</h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed mb-4 sm:mb-6">
              We are building <strong>India's largest digital rehabilitation ecosystem</strong>. Our future roadmap includes:
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-sm sm:text-base text-gray-700 list-disc list-inside mb-4 sm:mb-6">
              <li>Advanced physiotherapy intelligence</li>
              <li>Movement analysis with smart sensor integration</li>
              <li>Nationwide physiotherapy and hospital partner network</li>
              <li>Deep EMR and hospital system integrations</li>
              <li>Expanded access for rural and underserved populations</li>
              <li>International collaborations for research and innovation</li>
            </ul>
            <p className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed font-semibold">
              Our commitment is clear—<strong>to redefine physiotherapy through innovation and make structured recovery accessible to every patient, everywhere.</strong>
            </p>
          </section>

          {/* Footer Info */}
          <section className="text-center py-6 sm:py-8 border-t border-gray-200">
            <p className="text-base sm:text-lg font-semibold text-gray-800 mb-2">BoneBuddy</p>
            <p className="text-sm sm:text-base text-gray-600 mb-2">A Unit of <strong>Physiox Private Limited</strong></p>
            <p className="text-sm sm:text-base text-gray-600">Lucknow, UP</p>
            <p className="text-sm text-gray-500 mt-4">© BoneBuddy</p>
          </section>
        </div>
      </main>
    </>
  );
};

export default About;
