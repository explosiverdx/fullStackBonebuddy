import axios from "axios";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// In-memory storage for OTPs
const otpStore = new Map();

export const sendOtp = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    throw new ApiError(400, "Phone number is required");
  }

  // Generate 4-digit OTP (same as PHP rand(1111,9999))
  const otp = Math.floor(Math.random() * (9999 - 1111 + 1)) + 1111;

  // Store OTP with phone (expires in 10 minutes like PHP)
  otpStore.set(phone, {
    otp: otp.toString(),
    expires: Date.now() + 10 * 60 * 1000
  });

  const API = process.env.SMS_API_KEY;
  if (!API) {
    throw new ApiError(500, "SMS service not configured");
  }
  const URL = `https://sms.renflair.in/V1.php?API=${API}&PHONE=${phone}&OTP=${otp}`;

  try {
    const response = await axios.get(URL);
    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error("Renflair Error:", error);
    throw new ApiError(500, "Failed to send OTP");
  }
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    throw new ApiError(400, "Phone number and OTP are required");
  }

  const storedData = otpStore.get(phone);

  if (!storedData) {
    throw new ApiError(400, "OTP not found. Please request a new OTP.");
  }

  if (storedData.expires < Date.now()) {
    otpStore.delete(phone); // Clean up expired OTP
    throw new ApiError(400, "OTP expired. Please request a new OTP.");
  }

  if (storedData.otp !== otp.trim()) {
    throw new ApiError(400, "Incorrect OTP");
  }

  // Clear OTP after successful verification
  otpStore.delete(phone);

  res.json({ success: true, message: "OTP verified successfully" });
});
