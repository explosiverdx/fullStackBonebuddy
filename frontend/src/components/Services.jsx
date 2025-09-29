import React from 'react';
import { Link } from 'react-router-dom';

const Services = () => {
  return (
    <main className="max-w-7xl mx-auto px-6 py-20">
      {/* Banner Below Navbar */}
      <section className="relative mt-12 w-full h-auto min-h-[15rem] md:min-h-[25rem] lg:min-h-[32rem] overflow-hidden">
        <img src="/assets/Dimmer.png" alt="Physiotherapy Banner" className="w-full h-auto block filter brightness-60" />
        <div className="absolute inset-0 flex flex-col justify-center items-center text-center text-white p-4">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold mb-3">Our Services</h1>
          <p className="text-lg md:text-xl lg:text-2xl max-w-2xl">
            Discover our expert physiotherapy and rehabilitation services designed
            to help you recover, restore mobility, and live pain-free.
          </p>
        </div>
      </section>

      {/* Services Showcase */}
      <section id="services-showcase" className="max-w-7xl mx-auto my-16 px-6 flex flex-col gap-16">
        {/* Row 1: Text Left, Image Right */}
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-3 text-gray-800">Neuro-Surgery & Neuro-Rehabilitation Programs</h2>
            <p className="text-lg text-gray-700 mb-6">Post Brain Surgery Physiotherapy (Craniotomy/Tumor Removal), Stroke Rehabilitation (Hemiplegia/Hemiparesis Recovery), Spinal Cord Injury Rehabilitation, Post Nerve Decompression Surgery Rehab, Parkinson’s Disease Rehabilitation, Cerebral Palsy & Developmental Disorders Physiotherapy, Balance & Coordination Training (Vestibular Rehab).</p>
            <div className="flex gap-4">
              <Link to="#" className="bg-black text-white py-3 px-6 rounded-md font-semibold transition-colors duration-300 hover:bg-gray-800">Button</Link>
              <Link to="#" className="bg-gray-100 text-gray-800 py-3 px-6 rounded-md font-semibold transition-colors duration-300 hover:bg-gray-200">Secondary Button</Link>
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <img src="/assets/Services2.png" alt="Service Example 2" className="w-full max-w-md md:max-w-full rounded-lg object-cover" />
          </div>
        </div>

        {/* Row 2: Image Left, Text Right */}
        <div className="flex flex-col md:flex-row-reverse gap-8 items-center">
          <div className="flex-1 flex justify-center">
            <img src="/assets/Services1.png" alt="Service Example 1" className="w-full max-w-md md:max-w-full rounded-lg object-cover" />
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-3 text-gray-800">Knee Replacement</h2>
            <p className="text-lg text-gray-700 mb-6">Knee TKR (25 Sessions) – restores mobility & strength, Hip Replacement (25 Sessions) – improves joint movement & balance, Spine Surgery (Phase-wise) – safe healing & posture correction, Shoulder Surgery Rehab – flexibility & functional recovery, Elbow/Wrist/Ankle Rehab – motion & joint stability.</p>
            <div className="flex gap-4">
              <Link to="#" className="bg-black text-white py-3 px-6 rounded-md font-semibold transition-colors duration-300 hover:bg-gray-800">Button</Link>
              <Link to="#" className="bg-gray-100 text-gray-800 py-3 px-6 rounded-md font-semibold transition-colors duration-300 hover:bg-gray-200">Secondary Button</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Second Services Section */}
      <section id="second-services" className="second-services">
        <h2 className="section-heading">Our Second Services</h2>
        <div className="services-grid">
          {/* Featured Product (big left image) */}
          <div className="service-card featured">
            <img src="/assets/SecondService (3).png" alt="Featured Service" />
            <div className="service-info">
              <h3>Featured Product</h3>
              <p>Description of featured product</p>
              {/* <span className="price">$10.99</span> */}
            </div>
          </div>

          {/* Right Side Grid */}
          <div className="services-small">
            {/* Top Small */}
            <div className="service-card">
              <img src="/assets/SecondService (2).png" alt="Top Service" />
              <div className="service-info">
                <h3>Product</h3>
                <p>Description of top product</p>
                {/* <span className="price">$10.99</span> */}
              </div>
            </div>
            {/* Bottom Small */}
            <div className="service-card">
              <img src="/assets/SecondService (1).png" alt="Bottom Service" />
              <div className="service-info">
                <h3>Product</h3>
                <p>Description of lower product</p>
                {/* <span className="price">$10.99</span> */}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <h2 className="section-heading">Section heading</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">💡</div>
            <h3>Subheading</h3>
            <p>
              Body text for whatever you'd like to say. Add main takeaway points,
              quotes, anecdotes, or even a very short story.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Subheading</h3>
            <p>
              Body text for whatever you'd like to claim. Add main takeaway points,
              quotes, anecdotes, or even a very short story.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">⚙️</div>
            <h3>Subheading</h3>
            <p>
              Body text for whatever you'd like to suggest. Add main takeaway points,
              quotes, anecdotes, or even a very short story.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📅</div>
            <h3>Subheading</h3>
            <p>
              Body text for whatever you'd like to type. Add main takeaway points,
              quotes, anecdotes, or even a very short story.
            </p>
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="main-content" id="explore">
        <h2 className="section-title">Services Overview</h2>
        <p className="section-subtitle">
          Welcome to our comprehensive services page. Here you will find detailed information about the expert physiotherapy and rehabilitation services we offer to help you recover and live pain-free.
        </p>

        <div className="card-grid">
          <div className="card">
            <h3>Physical Therapy</h3>
            <p>Comprehensive rehabilitation programs tailored to your specific needs.</p>
          </div>
          <div className="card">
            <h3>Pain Management</h3>
            <p>Effective techniques to manage and reduce chronic pain.</p>
          </div>
          <div className="card">
            <h3>Sports Injury</h3>
            <p>Specialized treatment for athletes and active individuals.</p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Services;