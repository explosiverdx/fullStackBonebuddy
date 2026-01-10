import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const [feedback, setFeedback] = useState({
    name: '',
    message: '',
    rating: 0,
  });
  const [hoverRating, setHoverRating] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  
  const slides = [
    { src: "/assets/carousel/carousel1.jpeg", alt: "Physiotherapy Treatment" },
    { src: "/assets/carousel/carousel2.jpeg", alt: "Physiotherapy Image 1" },
    { src: "/assets/carousel/carousel3.jpg", alt: "Physiotherapy Image 2" },
    { src: "/assets/carousel/carousel4.jpg", alt: "Additional Physiotherapy Image" },
  ];

  const physiotherapists = [
    { name: 'Dr. Avneesh Dixit', img: '/assets/PhysioPics/Dr Avneesh Dixit.jpeg', qualification: 'BPT', experience: '15 years Experience', specialty: 'Chief Physiotherapist' },
    { name: 'Dr. Mazhar', img: '/assets/PhysioPics/Dr Mazhar.jpg', position:'Senior Physiotherapist', qualification: 'BPT', experience: '17 years Experience', specialty: 'Specialist in Ortho & Neuro' },
    { name: 'Dr. Bhaskar Pandey', img: '/assets/PhysioPics/Dr Bhaskar Pandey.jpeg', qualification: 'BPT', experience: '20 years Experience', specialty: 'Specialist in Ortho' },
    { name: 'Dr. Kapil Sharma', img: '/assets/PhysioPics/Dr Kapil Sharma.jpeg', qualification: 'BPT, DPR, BBMS', experience: '16 years Experience', specialty: 'Specialist in Ortho & Neuro Care' },
    { name: 'Dr. Rajesh Kumar', img: '/assets/PhysioPics/Dr Rajesh Kumar.jpeg', qualification: 'BPT', experience: '21 years Experience', specialty: 'Specialist in Ortho' },
    { name: 'Dr.Vishal Upadhyay', img: '/assets/PhysioPics/Dr Vishal Upadhyay.jpeg', qualification: 'MPT', experience: '20 years Experience', specialty: 'Specialist in Ortho' },
    { name: 'Dr. P.K. Yadav', img: '/assets/PhysioPics/Dr P.K. Yadav.jpeg', qualification: 'DPT, BPT', experience: '11 years Experience', specialty: 'Specialist in Ortho' },


  ];

  const testimonials = [
    {
      name: 'Snehlata Singh',
      rating: 5,
      text: "After my femur bone fracture, I was nervous about recovery. With BoneBuddy , I got expert, highly experienced, and specially trained post surgery Physiotherapist, at home, along with regular monitoring. My doctor could track my progress on BoneBuddy App. Within three months I was walking confidently. Truly life changing"
    },
    {
      name: 'Faizaan Ahmad',
      rating: 5,
      text: "Choosing BoneBuddy Physiotherapy for my post-operative ACL reconstruction rehabilitation was the best decision I made for my recovery. My therapist,  Dr Ashish Shetty , was incredibly knowledgeable, bringing all the necessary equipment and ensuring every session was focused, safe, and effective. I am now fully satisfied with my recovery progress—it truly exceeded my expectations. The BoneBuddy team helped me process my insurance claim seamlessly. BoneBuddy team was good, professional, and gave immediate responses to all my queries and concerns. For anyone undergoing ACL reconstruction who needs excellent home-based care and hassle-free insurance support, I recommend BoneBuddy Physiotherapy for dedicated five star service."
    },
    {
      name: 'Haroon Khan',
      rating: 5,
      text: "My knee was operated by Dr Rizwan. He referred to take my physiotherapy sessions from BoneBuddy Premium physiotherapy services. BoneBuddy deputed Dr Laxmi Physiotherapist to provide sessions at my home in the Village with in 24 hours. I am fully satisfied with the recovery. Now I can walk and do my routine work without any pain and problem. Thanks to BoneBuddy for providing Excellent service. I recommend BoneBuddy as a perfect choice for Post operative Knee rehabilitation."
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide - 1 + slides.length) % slides.length);
  };

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchStartX - touchEndX;
    if (Math.abs(deltaX) > 50) { // Swipe threshold
      if (deltaX > 0) {
        nextSlide(); // Swipe left
      } else {
        prevSlide(); // Swipe right
      }
    }
  };

  useEffect(() => {
    const slideInterval = setInterval(nextSlide, 3000); // Auto slide every 3 seconds
    return () => clearInterval(slideInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFeedbackChange = (e) => {
    const { name, value } = e.target;
    setFeedback(prev => ({ ...prev, [name]: value }));
  };

  const handleRating = (rate) => {
    setFeedback(prev => ({ ...prev, rating: rate }));
  };

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    if (!feedback.name || !feedback.message || feedback.rating === 0) {
      alert('Please fill in all fields and provide a rating.');
      return;
    }
    // In a real application, you would send this data to your backend.
    console.log('Feedback Submitted:', feedback);
    alert('Thank you for your feedback!');
    setFeedback({ name: '', message: '', rating: 0 });
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const nextPhysio = () => {
    setCurrentOffset((prev) => (prev + 1) % physiotherapists.length);
  };

  const prevPhysio = () => {
    setCurrentOffset((prev) => (prev - 1 + physiotherapists.length) % physiotherapists.length);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartX;
    setDragOffset(deltaX);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (Math.abs(dragOffset) > 50) {
      if (dragOffset > 0) {
        prevPhysio();
      } else {
        nextPhysio();
      }
    }
    setDragOffset(0);
  };

  const handleTouchStartPhysio = (e) => {
    setIsDragging(true);
    setDragStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const deltaX = e.touches[0].clientX - dragStartX;
    setDragOffset(deltaX);
  };

  const handleTouchEndPhysio = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (Math.abs(dragOffset) > 50) {
      if (dragOffset > 0) {
        prevPhysio();
      } else {
        nextPhysio();
      }
    }
    setDragOffset(0);
  };

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentOffset((prev) => (prev + 1) % physiotherapists.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isPlaying, physiotherapists.length]);

  // Auto-slide testimonials
  useEffect(() => {
    const testimonialInterval = setInterval(() => {
      setCurrentTestimonialIndex((prev) => {
        // When showing 2 cards at a time, cycle through each card
        // With 3 cards, we'll have positions: 0(cards 0&1), 1(cards 1&2), 2(cards 2&0)
        return (prev + 1) % testimonials.length;
      });
    }, 4000); // Slide every 4 seconds
    return () => clearInterval(testimonialInterval);
  }, [testimonials.length]);

  return (
    <>
      <Helmet>
        <title>BoneBuddy – Physiotherapy Specialists | Faster Recovery & Expert Care</title>


        <meta name="description" content=" BoneBuddy connects you with qualified and experienced physiotherapy specialists with years of experience in ortho care and recovery. Book your expert physiotherapist today for personalised treatment."></meta>
      
        <meta name="description" content="Leading physiotherapy clinic offering expert care for post-surgery recovery, sports injuries, orthopaedic treatments, and personalized rehabilitation services. Book your appointment today." />
        <meta name="keywords" content="physiotherapy, rehabilitation, sports injury, orthopaedic, post-surgery recovery, physiotherapy clinic, bone health, muscle recovery" />
        <meta property="og:title" content="BoneBuddy - Expert Physiotherapy Services" />
        <meta property="og:description" content="Leading physiotherapy clinic offering expert care for post-surgery recovery, sports injuries, orthopaedic treatments, and personalized rehabilitation services." />
        <meta property="og:image" content="/assets/BoneBuddy_Logo-modified.webp" />
        <meta property="og:url" content="https://bonebuddy.cloud" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="BoneBuddy - Expert Physiotherapy Services" />
        <meta name="twitter:description" content="Leading physiotherapy clinic offering expert care for post-surgery recovery, sports injuries, orthopaedic treatments, and personalized rehabilitation services." />
        <meta name="twitter:image" content="/assets/BoneBuddy_Logo-modified.webp" />
        <link rel="canonical" href="https://bonebuddy.cloud" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "MedicalBusiness",
            "name": "BoneBuddy",
            "description": "Leading physiotherapy clinic offering expert care for post-surgery recovery, sports injuries, orthopaedic treatments, and personalized rehabilitation services.",
            "url": "https://bonebuddy.cloud",
            "logo": "https://bonebuddy.cloud/assets/BoneBuddy_Logo-modified.webp",
            "telephone": "+1-XXX-XXX-XXXX",
            "email": "info@bonebuddy.cloud",
            "sameAs": [
              "https://www.facebook.com/bonebuddy",
              "https://www.instagram.com/bonebuddy",
              "https://www.linkedin.com/company/bonebuddy"
            ],
            "serviceType": [
              "Physiotherapy",
              "Rehabilitation",
              "Sports Injury Treatment",
              "Orthopaedic Physiotherapy",
              "Post-Surgery Recovery"
            ],
            "areaServed": "Your Service Area",
            "priceRange": "$$"
          })}
        </script>
      </Helmet>
      {/* Image Slider */}
      <div className="slider-container w-full" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div className="slider">
          {slides.map((slide, index) => (
            <div key={index} className={`slide ${index === currentSlide ? 'active' : ''}`}>
              <img src={slide.src} alt={slide.alt} loading="lazy" className="w-full h-full object-contain" />
            </div>
          ))}
        </div>
        <div className="dots-navigation">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      <main className="main-content">

      {/* Empower Your Healing Journey */}
      <section id="treatments-services" className="section px-4 sm:px-6 lg:px-8">
        <div className="mx-auto">
          <h1 className="section-title text-xl sm:text-2xl lg:text-3xl">BoneBuddy - India's Premium Post Oprative Doorstep Physiotherapy Services</h1>
          <p className="list-disc list-inside text-sm sm:text-base md:text-lg text-gray-700 space-y-2">
            At BoneBuddy, we believe in transforming recovery into a powerful, personalized experience. Our expert physiotherapists guide you through tailored therapies that not only heal but empower you to regain strength, confidence, and independence. From post-surgical rehabilitation to sports injury recovery, every step is designed to accelerate your healing and restore your quality of life.
            <br />
            <br />
            BoneBuddy connects you with <strong>qualified and experienced physiotherapy specialists</strong> who bring <strong>years of expertise</strong> in post operative <strong>ortho</strong> and <strong> Neuro </strong> Rehabilitation and <strong>recovery</strong> to routine. 
Our platform ensures personalized treatment plans designed to improve your health and provide the best possible care with expert support.
          </p>


          <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 items-center mt-6 sm:mt-8">
            <div className="flex-1 w-full">
              <h3 className="section-title text-lg sm:text-xl md:text-2xl lg:text-3xl">Why Choose BoneBuddy?</h3>
              <ul className="list-disc list-inside text-sm sm:text-base md:text-lg text-gray-700 space-y-2">
                <li>Personalized treatment plans crafted by certified experts</li>
                <li>State-of-the-art facilities and modern rehabilitation techniques</li>
                <li>Comprehensive care from initial assessment to full recovery</li>
                <li>Focus on long-term wellness and injury prevention</li>
              </ul>
            </div>
            <div className="flex-1 flex justify-center w-full">
              <img src="/assets/physiotherapy-treatment_3.jpg" alt="Empowering Healing at BoneBuddy" className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-full rounded-lg object-cover shadow-lg" />
            </div>
          </div>
        </div>
      </section>

      {/* Why BoneBuddy is Different Section */}
      <section className="mx-auto px-4 sm:px-6 lg:px-8 my-12 sm:my-16">
        <h2 className="section-title text-lg sm:text-xl md:text-2xl lg:text-3xl text-center mb-6 sm:mb-8 text-gray-800">Why BoneBuddy is Different</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-green-600 mb-3 sm:mb-4">BoneBuddy</h3>
            <ul className="space-y-1 sm:space-y-2 md:space-y-3 text-xs sm:text-sm md:text-base text-gray-700">
              <li className="flex items-start"><span className="text-green-500 mr-1 sm:mr-2 mt-0.5 flex-shrink-0">✔</span> Doctor-Connected protocols designed by Orthopedic Surgeons.</li>
              <li className="flex items-start"><span className="text-green-500 mr-1 sm:mr-2 mt-0.5 flex-shrink-0">✔</span> Evidence-Based Protocols (AAOS/WHO) with phase-wise recovery.</li>
              <li className="flex items-start"><span className="text-green-500 mr-1 sm:mr-2 mt-0.5 flex-shrink-0">✔</span> App + Doorstep Care including telerehabilitation and manual therapy.</li>
              <li className="flex items-start"><span className="text-green-500 mr-1 sm:mr-2 mt-0.5 flex-shrink-0">✔</span> Digital Progress Tracking with reports shared directly with doctors.</li>
              <li className="flex items-start"><span className="text-green-500 mr-1 sm:mr-2 mt-0.5 flex-shrink-0">✔</span> 24/7 support with online consultations available.</li>
              <li className="flex items-start"><span className="text-green-500 mr-1 sm:mr-2 mt-0.5 flex-shrink-0">✔</span> Standardized, structured protocols for safety and effectiveness.</li>
              <li className="flex items-start"><span className="text-green-500 mr-1 sm:mr-2 mt-0.5 flex-shrink-0">✔</span> Direct integration with hospital EMRs for seamless care.</li>
            </ul>
          </div>
          <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-red-600 mb-3 sm:mb-4">Local Physiotherapist</h3>
            <ul className="space-y-1 sm:space-y-2 md:space-y-3 text-xs sm:text-sm md:text-base text-gray-700">
              <li className="flex items-start"><span className="text-red-500 mr-1 sm:mr-2 mt-0.5 flex-shrink-0">✖</span> Physiotherapist-driven only, with no multidisciplinary involvement.</li>
              <li className="flex items-start"><span className="text-red-500 mr-1 sm:mr-2 mt-0.5 flex-shrink-0">✖</span> Exercises may not follow evidence-based guidelines.</li>
              <li className="flex items-start"><span className="text-red-500 mr-1 sm:mr-2 mt-0.5 flex-shrink-0">✖</span> Limited to in-person visits without integrated app support.</li>
              <li className="flex items-start"><span className="text-red-500 mr-1 sm:mr-2 mt-0.5 flex-shrink-0">✖</span> No structured clinical outcome measurement or reporting.</li>
              <li className="flex items-start"><span className="text-red-500 mr-1 sm:mr-2 mt-0.5 flex-shrink-0">✖</span> Support is limited to clinic hours.</li>
              <li className="flex items-start"><span className="text-red-500 mr-1 sm:mr-2 mt-0.5 flex-shrink-0">✖</span> Treatment methods can vary and may lack structure.</li>
              <li className="flex items-start"><span className="text-red-500 mr-1 sm:mr-2 mt-0.5 flex-shrink-0">✖</span> No integration with hospital systems or referring doctors.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Expert Physiotherapists */}
      <section id="expert-physiotherapists" className="expert-section px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mx-auto text-center">
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-black mb-8 sm:mb-12">Meet Our Expert Physiotherapists</h2>
          <div
            className="overflow-hidden w-full cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStartPhysio}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEndPhysio}
            style={{ transform: `translateX(${dragOffset}px)` }}
          >
            <div
              className="flex transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${currentOffset * 176}px)` }}
            >
              {physiotherapists.map((physio, index) => (
                <div key={index} className="flex-shrink-0 text-center mx-4 w-40">
                  <img
                    className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full object-cover mx-auto shadow-lg border-4 border-white"
                    src={physio.img}
                    alt={physio.name}
                  />
                  <p className="mt-2 sm:mt-4 font-semibold text-gray-800 text-sm sm:text-base md:text-lg">
                    {physio.name}
                  </p>
                  {physio.position && (
                    <div className="text-xs sm:text-sm text-gray-600 mt-1">
                      <p>{physio.position}</p>
                    </div>
                  )}
                  {physio.qualification && (
                    <div className="text-xs sm:text-sm text-gray-600 mt-1">
                      <p>{physio.qualification}, {physio.experience}</p>
                      <p>{physio.specialty}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials and Feedback Section */}
      <section id="testimonials" className="section bg-gray-50 py-6 sm:py-8 md:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto">
          <h2 className="section-title text-center text-lg sm:text-xl md:text-2xl lg:text-3xl">What Our Patients Say</h2>
          <p className="section-subtitle text-center text-sm sm:text-base md:text-lg">
            We value your feedback! Share your experience and help us improve our services.
          </p>

          {/* Testimonial Cards Carousel - One at a Time */}
          <div className="relative mx-auto my-6 sm:my-8 max-w-4xl px-4">
            <div className="overflow-hidden">
              <div className="flex transition-transform duration-700 ease-in-out"
                   style={{ 
                     transform: `translateX(-${currentTestimonialIndex * 100}%)`,
                   }}>
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="flex-shrink-0 w-full px-2 sm:px-4">
                    <div className="bg-white p-4 sm:p-6 md:p-8 rounded-lg shadow-md transform transition-all duration-300 hover:shadow-xl">
                      <div className="flex items-center mb-4 sm:mb-6">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full mr-3 sm:mr-4 bg-pink-100 text-pink-600 flex items-center justify-center flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm sm:text-base md:text-lg">{testimonial.name}</h4>
                          <div className="text-yellow-500 text-sm sm:text-base md:text-lg">
                            {'★'.repeat(testimonial.rating)}
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-600 italic text-sm sm:text-base md:text-lg leading-relaxed">"{testimonial.text}"</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Carousel Indicators */}
            <div className="flex justify-center gap-2 sm:gap-3 mt-6 sm:mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonialIndex(index)}
                  className={`h-2 sm:h-3 rounded-full transition-all duration-300 ${
                    currentTestimonialIndex === index 
                      ? 'bg-teal-500 w-8 sm:w-10' 
                      : 'bg-gray-300 w-2 sm:w-3 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Feedback Form */}
          <div className="max-w-2xl mx-auto mt-6 sm:mt-8 md:mt-12 bg-white p-4 sm:p-6 md:p-8 rounded-lg shadow-lg">
            <h3 className="text-lg sm:text-xl md:text-2xl font-semibold mb-4 sm:mb-6 text-center text-gray-800">Leave a Review</h3>
            <form onSubmit={handleFeedbackSubmit} className="space-y-3 sm:space-y-4 md:space-y-6">
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                value={feedback.name}
                onChange={handleFeedbackChange}
                required
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm sm:text-base"
              />
              <textarea
                name="message"
                placeholder="Your Feedback"
                value={feedback.message}
                onChange={handleFeedbackChange}
                required
                rows="4"
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm sm:text-base"
              ></textarea>
              <div className="text-center">
                <label className="block font-semibold mb-2 text-gray-700 text-xs sm:text-sm md:text-base">Your Rating</label>
                <div className="flex justify-center text-xl sm:text-2xl md:text-3xl cursor-pointer">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} onClick={() => handleRating(star)} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} className={`transition-colors ${(hoverRating || feedback.rating) >= star ? 'text-yellow-500' : 'text-gray-300'}`}>★</span>
                  ))}
                </div>
                {feedback.rating > 0 && (
                  <p className="text-xs sm:text-sm text-gray-500 mt-2">You've selected {feedback.rating} out of 5 stars.</p>
                )}
              </div>
              <button type="submit" className="w-full bg-teal-500 text-white py-2 sm:py-3 rounded-lg font-semibold hover:bg-teal-600 transition-transform hover:scale-105 text-sm sm:text-base md:text-lg">Submit Feedback</button>
            </form>
          </div>
        </div>
      </section>
    </main>
    </>
  );
};

export default Home;
