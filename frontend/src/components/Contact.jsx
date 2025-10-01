import React, { useState } from 'react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    subject: '',
    message: ''
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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (!/^\+?[\d\s\-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters long';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    setSubmitStatus('');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubmitStatus('success');
      setFormData({
        name: '',
        phone: '',
        subject: '',
        message: ''
      });
      setErrors({});
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="body-bg">
      <main className="main-content form-page">
        {/* Header Section */}
        <div className="form-header">
          <h1>Contact Us</h1>
          <p>
            Have a question or need assistance? We'd love to hear from you. 
            Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        {/* Contact Form */}
        <div className="form-container">
          <form className="appointment-form" onSubmit={handleSubmit}>
            {/* Name and Phone Row */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">
                  Full Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className={errors.name ? 'error' : ''}
                />
                {errors.name && (
                  <span className="error-message">{errors.name}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="phone">
                  Phone Number <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  className={errors.phone ? 'error' : ''}
                />
                {errors.phone && (
                  <span className="error-message">{errors.phone}</span>
                )}
              </div>
            </div>

            {/* Subject Row */}
            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="subject">
                  Subject <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="What is this regarding?"
                  className={errors.subject ? 'error' : ''}
                />
                {errors.subject && (
                  <span className="error-message">{errors.subject}</span>
                )}
              </div>
            </div>

            {/* Message Row */}
            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="message">
                  Message <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Please provide details about your inquiry..."
                  rows="6"
                  className={errors.message ? 'error' : ''}
                />
                {errors.message && (
                  <span className="error-message">{errors.message}</span>
                )}
              </div>
            </div>

            {/* Submit Status Messages */}
            {submitStatus === 'success' && (
              <div className="success-message">
                <p>✅ Thank you! Your message has been sent successfully. We'll get back to you soon.</p>
              </div>
            )}
            
            {submitStatus === 'error' && (
              <div className="error-message">
                <p>❌ Sorry, there was an error sending your message. Please try again.</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="form-submit">
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <i className="loading-spinner"></i>
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="send-icon">📧</i>
                    Send Message
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Contact Information */}
        <div className="contact-box">
          <h2>Other Ways to Reach Us</h2>
          <p><strong>Phone:</strong> +91 8881119890</p>
          <p><strong>Email:</strong> info@bonebuddy.com</p>
          <p><strong>Address:</strong> Plot No.44, A-Block, Indira Nagar, Lucknow, 226010</p>
          <p><strong>Business Hours:</strong> Mon-Sat: 8AM-6PM</p>
        </div>
      </main>
    </div>
  );
};

export default Contact;