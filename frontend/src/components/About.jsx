import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const About = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    message: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.message) {
      alert('Please fill in all fields.');
      return;
    }
    // Simulate form submission
    alert('Message sent successfully!');
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      message: '',
    });
  };

  return (
    <main className="main-content">
      {/* About Section */}
      <section className="max-w-7xl mx-auto px-8 flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
        <div className="flex-1">
          <h1 className="text-4xl font-bold mb-2">About</h1>
          <h3 className="text-xl font-medium text-gray-700 mb-4">Subheading for description or instructions</h3>
          <p className="text-base text-gray-600 leading-relaxed mb-4">
            Body text for your whole article or post. We'll put in some lorem ipsum
            to show how a filled-out page might look.
          </p>
          <p className="text-base text-gray-600 leading-relaxed mb-4">
            Excepteur efficient emerging, minim veniam anim aute carefully curated
            Ginza conversation exquisite perfect nostrud nisi intricate content.
          </p>
          <p className="text-base text-gray-600 leading-relaxed mb-4">
            Exclusive izakaya charming Scandinavian impeccable aute quality of life
            soft power pariatur Melbourne occaecat discerning.
          </p>
        </div>

        <div className="flex-1 flex justify-center">
          <img src="/assets/About.png" alt="About BoneBuddy" className="w-full max-w-md rounded-lg object-cover md:max-w-full md:h-auto" />
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-page">
        <h1>Contact Me</h1>
        <p className="subtitle">
          Have questions or need help? Fill out the form below and we’ll get back to you soon.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <div className="flex gap-4">
            <input type="text" name="firstName" placeholder="First name" value={formData.firstName} onChange={handleChange} required className="flex-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:border-gray-800" />
            <input type="text" name="lastName" placeholder="Last name" value={formData.lastName} onChange={handleChange} required className="flex-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:border-gray-800" />
          </div>
          <input type="email" name="email" placeholder="Email address" value={formData.email} onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-gray-800" />
          <textarea name="message" rows="5" placeholder="Your message" value={formData.message} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-gray-800"></textarea>
          <button type="submit" className="btn-primary self-start">Submit</button>
        </form>
      </section>
    </main>
  );
};

export default About;