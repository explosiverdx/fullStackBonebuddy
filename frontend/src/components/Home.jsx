import React, { useState, useEffect } from 'react';

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    { src: "/assets/carousel1.png", alt: "Physiotherapy Treatment", text: "Expert Physiotherapy for Recovery" },
    { src: "/assets/carousel2.jpg", alt: "Physiotherapy Image 1", text: "Professional Care" },
    { src: "/assets/carousel3.jpg", alt: "Physiotherapy Image 2", text: "Rehabilitation Services" },
  ];

  const nextSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    const slideInterval = setInterval(nextSlide, 2000); // Auto slide every 2 seconds
    return () => clearInterval(slideInterval);
  }, []);

  return (
    <main className="main-content">
      {/* Image Slider */}
      <div className="slider-container">
        <div className="slider">
          {slides.map((slide, index) => (
            <div key={index} className={`slide ${index === currentSlide ? 'active' : ''}`}>
              <img src={slide.src} alt={slide.alt} />
              <div className="overlay"><h2 className="text-overlay">{slide.text}</h2></div>
            </div>
          ))}
        </div>
        <button className="prev-btn" onClick={prevSlide} aria-label="Previous slide">‹</button>
        <button className="next-btn" onClick={nextSlide} aria-label="Next slide">›</button>
      </div>

      {/* Treatments and Services */}
      <section id="treatments-services" className="section">
        <h2 className="section-title">Treatments and Services</h2>
        <div className="card-grid">
          <div className="card">
            <img src="/assets/carousel1.png" alt="Physiotherapy for Musculoskeletal Pain" />
            <div className="card-body">
              <h3>Post Surgery Physiotherapy</h3>
              <p>Fast recovery, pain relief, and restored mobility after surgical procedures.</p>
            </div>
          </div>
          <div className="card">
            <img src="/assets/Treatments and Services_2.png" alt="Sports Injury Rehabilitation" />
            <div className="card-body">
              <h3>Sports Injury Rehabilitation</h3>
              <p>Recover faster and return to your sport stronger than ever.</p>
            </div>
          </div>
          <div className="card">
            <img src="/assets/Treatments and Services_3.png" alt="Pre-Surgical Rehab" />
            <div className="card-body">
              <h3>Pre-Surgical Rehab</h3>
              <p>Expert guidance through pre-operative recovery and regaining function.</p>
            </div>
          </div>

          <div className="card">
            <img src="/assets/Treatments and Services_4.jpg" alt="Orthopaedic Physiotherapy" />
            <div className="card-body">
              <h3>Orthopaedic Physiotherapy</h3>
              <p>Pain relief, mobility improvement, and strength restoration for bones, joints, and muscles.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Expert Physiotherapists */}
      <section id="expert-physiotherapists" className="expert-section">
        <div className="expert-content">
          <h2>Meet Our Expert Physiotherapists</h2>
          <p className="subtitle">Compassionate & Skilled Professionals</p>
          <p className="description">
            Trusted physiotherapists offering expert care, tailored treatments, and faster recovery for a healthier you.</p>
          <p className="subtitle">Personalized Treatment Plans</p>
          <p className="description">
            Skilled professionals dedicated to helping you recover with personalized therapies and modern techniques.</p>
          <p className="subtitle">At-Home & In-Clinic Care</p>
          <p className="description">
            Compassionate physiotherapists delivering effective care to restore strength, mobility, and confidence.</p>
        </div>

        <div className="expert-image">
          <img src="/assets/Expert.jpg" alt="Expert Physiotherapists" />
        </div>
      </section>

      {/* Quick Recovery */}
      <section id="quick-recovery" className="quick-recovery">
        <h2>Quick & Efficient Recovery</h2>
        <div className="quick-grid">
          <div className="quick-card">
            <img src="/assets/Recovery1.png" alt="Recovery Made Simple" />
            <div className="quick-card-body">
              <h3>Recovery Made Simple</h3>
              <p>
                Experience faster healing with tailored physiotherapy plans designed to restore mobility, reduce pain, and get you back to your routine quickly.
              </p>
            </div>
          </div>
          <div className="quick-card">
            <img src="/assets/Recovery2.png" alt="Healing with Care & Speed" />
            <div className="quick-card-body">
              <h3>Healing with Care & Speed</h3>
              <p>
                Recover faster and better with expert-guided therapies focused on strength, flexibility, and long-term wellness.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
