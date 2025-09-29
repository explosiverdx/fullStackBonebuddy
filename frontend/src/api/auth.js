const API_BASE_URL = 'http://localhost:8000/api/v1';

const handleResponse = async (response) => {
  const data = await response.json();
  if (response.ok) {
    return data;
  } else {
    throw new Error(data.message || 'Something went wrong');
  }
};

export const sendUserOtp = async (phoneNumber) => {
  const response = await fetch(`${API_BASE_URL}/users/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber: `+91${phoneNumber}` }),
  });
  return handleResponse(response);
};

export const verifyUserOtp = async (phoneNumber, otp) => {
  const response = await fetch(`${API_BASE_URL}/users/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber: `+91${phoneNumber}`, otp }),
  });
  return handleResponse(response);
};

export const sendAdminOtp = async (phoneNumber) => {
  const response = await fetch(`${API_BASE_URL}/admin/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber: `+91${phoneNumber}` }),
  });
  return handleResponse(response);
};

export const verifyAdminOtp = async (phoneNumber, otp) => {
  const response = await fetch(`${API_BASE_URL}/admin/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber: `+91${phoneNumber}`, otp }),
  });
  return handleResponse(response);
};
