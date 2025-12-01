import apiClient from './apiClient';

export const sendUserOtp = async (phoneNumber) => {
  const response = await apiClient.post('/users/send-otp', {
    phoneNumber: `+91${phoneNumber}`,
  });
  return response.data;
};

export const verifyUserOtp = async (phoneNumber, otp) => {
  const response = await apiClient.post('/users/verify-otp', {
    phoneNumber: `+91${phoneNumber}`,
    otp,
  });
  return response.data;
};

export const sendAdminOtp = async (phoneNumber) => {
  const response = await apiClient.post('/admin/send-otp', {
    phoneNumber: `+91${phoneNumber.replace('+91', '')}`,
  });
  return response.data;
};

export const verifyAdminOtp = async (phoneNumber, otp) => {
  // Remove +91 if already present to avoid double prefix
  const cleanPhone = phoneNumber.replace('+91', '');
  const response = await apiClient.post('/admin/verify-otp', {
    phoneNumber: `+91${cleanPhone}`,
    otp,
  });
  return response.data;
};

export const loginAdmin = async (username, password) => {
  const response = await apiClient.post('/admin/login', {
    username,
    password,
  });
  return response.data;
};