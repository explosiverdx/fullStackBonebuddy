import React, { useState } from 'react';

const Contact = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    message: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };



  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!formData.firstName) newErrors.firstName = "First name is required.";
    if (!formData.lastName) newErrors.lastName = "Last name is required.";
    if (!formData.email) newErrors.email = "Email is required.";
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = "Phone number is required.";
    } else if (!/^\d{10}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Phone number must be 10 digits.";
    }
    if (!formData.message) newErrors.message = "Message is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('');

    try {
      const response = await fetch('/api/v1/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to submit form');

      setSubmitStatus('success');
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        message: '',
      });
      setErrors({});
    } catch (error) {
      console.error("Contact form submission error:", error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="body-bg min-h-screen py-8 sm:py-12 pt-20 sm:pt-24 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
      <main className="w-full">
        {/* Header Section */}
        <div className="form-header text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600">
            Have a question or need assistance? We'd love to hear from you.
            Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        {/* Contact Form */}
        <div className="form-container bg-white p-4 sm:p-6 md:p-8 rounded-lg shadow-lg mb-6 sm:mb-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  name="firstName"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full p-3 sm:p-4 border border-gray-300 rounded-md focus:outline-none focus:border-gray-800 text-sm sm:text-base"
                />
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full p-3 sm:p-4 border border-gray-300 rounded-md focus:outline-none focus:border-gray-800 text-sm sm:text-base"
                />
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
              </div>
            </div>
            <div>
              <input
                type="email"
                name="email"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full p-3 sm:p-4 border border-gray-300 rounded-md focus:outline-none focus:border-gray-800 text-sm sm:text-base"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <input
                type="tel"
                name="phoneNumber"
                placeholder="Phone number (10 digits)"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                maxLength="10"
                pattern="\d{10}"
                className="w-full p-3 sm:p-4 border border-gray-300 rounded-md focus:outline-none focus:border-gray-800 text-sm sm:text-base"
              />
              {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>}
            </div>
            <textarea
              name="message"
              rows="4"
              placeholder="Your message"
              value={formData.message}
              onChange={handleChange}
              required
              className="w-full p-3 sm:p-4 border border-gray-300 rounded-md focus:outline-none focus:border-gray-800 text-sm sm:text-base resize-vertical"
            ></textarea>
            {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}

            {/* Submit Status Messages */}
            {submitStatus === 'success' && (
              <div className="success-message p-3 sm:p-4 rounded-md">
                <p className="text-sm sm:text-base">✅ Thank you! Your message has been sent successfully. We'll get back to you soon.</p>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="error-message p-3 sm:p-4 rounded-md">
                <p className="text-sm sm:text-base">❌ Sorry, there was an error sending your message. Please try again.</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="form-submit text-center">
              <button
                type="submit"
                className="btn-primary px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base md:text-lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>

        {/* Contact Information */}
        <div className="contact-box bg-white p-4 sm:p-6 md:p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mb-4">Reach Us</h2>
          <div className="space-y-2 text-sm sm:text-base">
            <p><strong>Phone:</strong> +91 92778 01061</p>
            <p><strong>Office:</strong> +91 88811 19890</p>
            <p><strong>Email:</strong> info@bonebuddy.org</p>
            <p><strong>Business Hours:</strong> 24/7</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Contact;