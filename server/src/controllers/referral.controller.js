import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Referral } from '../models/referral.models.js';
import { User } from '../models/user.models.js';
import { Patient } from '../models/patient.models.js';

// Create a referral
export const createReferral = asyncHandler(async (req, res) => {
  const {
    patientName,
    patientPhone,
    patientEmail,
    patientAge,
    patientGender,
    condition,
    surgeryType,
    surgeryDate,
    notes,
  } = req.body;

  if (!patientName || !patientPhone || !condition) {
    throw new ApiError(400, 'Patient name, phone, and condition are required');
  }

  const doctor = req.user;
  if (doctor.userType !== 'doctor') {
    throw new ApiError(403, 'Only doctors can create referrals');
  }

  const referral = await Referral.create({
    doctorId: doctor._id,
    doctorName: doctor.Fullname || doctor.name || 'Unknown Doctor',
    patientName,
    patientPhone,
    patientEmail,
    patientAge,
    patientGender,
    condition,
    surgeryType,
    surgeryDate,
    notes,
    status: 'pending',
  });

  return res
    .status(201)
    .json(
      new ApiResponse(201, referral, 'Patient referred successfully')
    );
});

// Get all referrals (Admin only)
export const getAllReferrals = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10, search } = req.query;

  const matchStage = {};
  if (status) {
    matchStage.status = status;
  }
  if (search) {
    matchStage.$or = [
      { patientName: { $regex: search, $options: 'i' } },
      { patientPhone: { $regex: search, $options: 'i' } },
      { patientEmail: { $regex: search, $options: 'i' } },
      { doctorName: { $regex: search, $options: 'i' } },
      { condition: { $regex: search, $options: 'i' } },
    ];
  }

  const aggregatePipeline = [
    { $match: matchStage },
    {
      $lookup: {
        from: 'users',
        localField: 'doctorId',
        foreignField: '_id',
        as: 'doctor',
      },
    },
    {
      $unwind: {
        path: '$doctor',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'registeredPatientId',
        foreignField: '_id',
        as: 'registeredPatient',
      },
    },
    {
      $unwind: {
        path: '$registeredPatient',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        doctorId: 1,
        doctorName: 1,
        patientName: 1,
        patientPhone: 1,
        patientEmail: 1,
        patientAge: 1,
        patientGender: 1,
        condition: 1,
        surgeryType: 1,
        surgeryDate: 1,
        notes: 1,
        status: 1,
        contactedBy: 1,
        contactedAt: 1,
        registeredPatientId: 1,
        createdAt: 1,
        updatedAt: 1,
        doctor: {
          _id: '$doctor._id',
          name: '$doctor.Fullname',
          email: '$doctor.email',
          phone: '$doctor.mobile_number',
        },
        registeredPatient: {
          _id: '$registeredPatient._id',
          name: '$registeredPatient.Fullname',
          email: '$registeredPatient.email',
        },
      },
    },
    {
      $sort: { createdAt: -1 },
    },
  ];

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
  };

  const referrals = await Referral.aggregatePaginate(
    Referral.aggregate(aggregatePipeline),
    options
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, referrals, 'Referrals fetched successfully')
    );
});

// Get referrals by doctor
export const getMyReferrals = asyncHandler(async (req, res) => {
  const doctorId = req.user._id;

  const referrals = await Referral.find({ doctorId })
    .sort({ createdAt: -1 })
    .limit(50);

  // Filter out referrals where the registered patient has been deleted
  // Check if registeredPatientId exists and the user/patient still exists
  // Also check by phone number to catch referrals that might not have registeredPatientId set
  const validReferrals = [];
  const normalizePhone = (phone) => {
    if (!phone) return null;
    return phone.replace(/[^0-9]/g, '').slice(-10);
  };
  
  for (const referral of referrals) {
    let shouldInclude = true;
    
    // If referral is marked as "registered", it MUST have a valid patient
    if (referral.status === 'registered') {
      if (!referral.registeredPatientId) {
        // Registered referral without registeredPatientId is invalid
        shouldInclude = false;
      } else {
        const user = await User.findById(referral.registeredPatientId);
        if (!user) {
          // User was deleted, skip this referral
          shouldInclude = false;
        } else {
          // Also check if patient profile exists
          const patient = await Patient.findOne({ userId: referral.registeredPatientId });
          if (!patient) {
            // Patient profile was deleted, skip this referral
            shouldInclude = false;
          }
        }
      }
    } else if (referral.registeredPatientId) {
      // For non-registered referrals with registeredPatientId, still verify it exists
      const user = await User.findById(referral.registeredPatientId);
      if (!user) {
        shouldInclude = false;
      } else {
        const patient = await Patient.findOne({ userId: referral.registeredPatientId });
        if (!patient && user.userType === 'patient') {
          // Patient profile was deleted
          shouldInclude = false;
        }
      }
    }
    
    // Also check by phone number - if we can't find any active patient with this phone, exclude registered referrals
    if (shouldInclude && referral.patientPhone && referral.status === 'registered') {
      const normalizedPhone = normalizePhone(referral.patientPhone);
      if (normalizedPhone) {
        // For registered referrals, verify there's an active patient with this phone
        const userByPhone = await User.findOne({
          mobile_number: { $in: [normalizedPhone, `+91${normalizedPhone}`, referral.patientPhone] }
        });
        
        if (userByPhone) {
          const patientByPhone = await Patient.findOne({ userId: userByPhone._id });
          // If user exists but patient profile doesn't, patient was deleted
          if (!patientByPhone && userByPhone.userType === 'patient') {
            shouldInclude = false;
          }
        } else {
          // No user found with this phone - might be deleted, exclude registered referral
          shouldInclude = false;
        }
      }
    }
    
    if (shouldInclude) {
      validReferrals.push(referral);
    }
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, validReferrals, 'Your referrals fetched successfully')
    );
});

// Update referral status (Admin only)
export const updateReferralStatus = asyncHandler(async (req, res) => {
  const { referralId } = req.params;
  const { status, notes } = req.body;

  if (!status || !['pending', 'contacted', 'registered', 'rejected'].includes(status)) {
    throw new ApiError(400, 'Valid status is required');
  }

  const referral = await Referral.findById(referralId);
  if (!referral) {
    throw new ApiError(404, 'Referral not found');
  }

  const updateData = { status };
  if (status === 'contacted') {
    updateData.contactedBy = req.user._id;
    updateData.contactedAt = new Date();
  }
  if (notes) {
    updateData.notes = notes;
  }

  const updatedReferral = await Referral.findByIdAndUpdate(
    referralId,
    updateData,
    { new: true }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedReferral, 'Referral status updated successfully')
    );
});

// Link referral to registered patient (Admin only)
export const linkReferralToPatient = asyncHandler(async (req, res) => {
  const { referralId } = req.params;
  const { patientId } = req.body;

  if (!patientId) {
    throw new ApiError(400, 'Patient ID is required');
  }

  const patient = await User.findById(patientId);
  if (!patient || patient.userType !== 'patient') {
    throw new ApiError(404, 'Patient not found');
  }

  const referral = await Referral.findByIdAndUpdate(
    referralId,
    {
      registeredPatientId: patientId,
      status: 'registered',
    },
    { new: true }
  );

  if (!referral) {
    throw new ApiError(404, 'Referral not found');
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, referral, 'Referral linked to patient successfully')
    );
});

