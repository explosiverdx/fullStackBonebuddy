import React, { useState } from 'react';

const Appointment = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    service: '',
    preferredDate: '',
    preferredTime: '',
    message: '',
    emergencyContact: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  const validateForm = () => {
    const { firstName, lastName, email, phone, service, preferredDate, preferredTime } = formData;

    if (!firstName || !lastName || !email || !phone || !service || !preferredDate || !preferredTime) {
      alert('Please fill in all required fields.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address.');
      return false;
    }

    if (phone.length < 10) {
      alert('Please enter a valid phone number.');
      return false;
    }

    const selectedDate = new Date(preferredDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      alert('Please select a future date.');
      return false;
    }

    if (!preferredDate) {
      alert('Please select a date first.');
      return false;
    }

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    // Simulate form submission
    setTimeout(() => {
      alert('Thank you! Your appointment has been booked successfully. We will contact you shortly to confirm.');
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        service: '',
        preferredDate: '',
        preferredTime: '',
        message: '',
        emergencyContact: '',
      });
      setLoading(false);
    }, 2000);
  };

  return (
    <main className="main-content form-page">
      <div className="form-header">
        <h1>Book Your Appointment</h1>
        <p>Fill out the form below to schedule your physiotherapy session.</p>
      </div>

      <div className="form-container">
        <form id="appointment-form" className="appointment-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input type="text" id="firstName" value={formData.firstName} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input type="text" id="lastName" value={formData.lastName} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input type="email" id="email" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input type="tel" id="phone" value={formData.phone} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="service">Preferred Service</label>
            <select id="service" value={formData.service} onChange={handleChange} required>
              <option value="">Select a service</option>
              <option value="Post Surgery Physiotherapy">Post Surgery Physiotherapy</option>
              <option value="Sports Injury Rehabilitation">Sports Injury Rehabilitation</option>
              <option value="Pre-Surgical Rehab">Pre-Surgical Rehab</option>
              <option value="Orthopaedic Physiotherapy">Orthopaedic Physiotherapy</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="preferredDate">Preferred Date</label>
              <input type="date" id="preferredDate" value={formData.preferredDate} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="preferredTime">Preferred Time</label>
              <input type="time" id="preferredTime" value={formData.preferredTime} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group full-width">
            <label htmlFor="message">Your Message (Optional)</label>
            <textarea id="message" rows="4" value={formData.message} onChange={handleChange}></textarea>
          </div>

          <div className="emergency-section full-width">
            <h3>Emergency Contact Information</h3>
            <div className="form-group">
              <label htmlFor="emergencyContact">Emergency Contact Name & Phone</label>
              <input type="text" id="emergencyContact" value={formData.emergencyContact} onChange={handleChange} />
            </div>
          </div>

          <div className="form-submit full-width">
            <button type="submit" disabled={loading}>
              {loading ? (
                <><i className="fas fa-spinner fa-spin"></i> Booking...</>
              ) : (
                <><i className="fas fa-calendar-check"></i> Book Appointment</>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="contact-box">
        <h2>Need immediate assistance?</h2>
        <p>Call us at +91 8881119890 or email info@bonebuddy.com</p>
      </div>
    </main>
  );
};

export default Appointment;