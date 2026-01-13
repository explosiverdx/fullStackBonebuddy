import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { Doctor } from "../models/doctor.models.js";
import { Physio } from "../models/physio.models.js";
import { Patient } from "../models/patient.models.js";
import { Session } from "../models/sessions.models.js";
import { Contact } from "../models/contact.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { generateAccessAndRefreshTokens } from "../utils/auth.utils.js";
import otpGenerator from "otp-generator";
import twilio from "twilio";
import jwt from "jsonwebtoken";

const registerUser = asyncHandler(async (req, res) => {
    const { Fullname, username, email, password, userType, mobile_number } = req.body;

    if (
        [Fullname, email, username, password, userType, mobile_number].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required");
    }

    const user = await User.create({
        Fullname,
        avatar: avatar.secure_url || avatar.url,
        email,
        password,
        username: username.toLowerCase(),
        userType,
        mobile_number
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    );
});

const registerWithPassword = asyncHandler(async (req, res) => {
    const { phoneNumber, password } = req.body;

    if (!phoneNumber || !password) {
        throw new ApiError(400, "Phone number and password are required");
    }

    if (password.length < 6) {
        throw new ApiError(400, "Password must be at least 6 characters long.");
    }

    const phoneDigits = phoneNumber.replace(/[^0-9]/g, '').slice(-10);
    const normalizedPhone = `+91${phoneDigits}`;

    const existedUser = await User.findOne({ mobile_number: normalizedPhone });

    if (existedUser) {
        throw new ApiError(409, "User with this phone number already exists");
    }

    const defaultUsername = `patient_${phoneDigits}`;

    const user = await User.create({
        mobile_number: normalizedPhone,
        password: password,
        userType: 'patient',
        username: defaultUsername,
        email: null, // Don't auto-generate email
        Fullname: defaultUsername,
        gender: 'Other',
        dateOfBirth: new Date('2000-01-01'),
        age: 24,
        address: 'Unknown',
        hospitalName: 'Unknown',
        profileCompleted: false // User needs to complete profile after OTP verification
    });

    // Don't create Patient document yet - user will complete profile later
    // This prevents the "incomplete user" vs "complete patient" mismatch

    const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save({ validateBeforeSave: false });

    const apiKey = process.env.SMS_API_KEY;
    if (!apiKey) {
        throw new ApiError(500, "SMS service not configured");
    }
    const smsUrl = `https://sms.renflair.in/V1.php?API=${apiKey}&PHONE=${phoneDigits}&OTP=${otp}`;

    try {
        const response = await fetch(smsUrl);
        const data = await response.text();
        console.log('SMS API response:', data);
        console.log(`User OTP sent successfully for ${normalizedPhone}`);
        return res.status(200).json(new ApiResponse(200, {}, "OTP sent successfully"));
    } catch (error) {
        console.error("Error sending OTP via SMS API:", error.message);
        throw new ApiError(500, "Failed to send OTP. Please try again later.");
    }
});

const sendOTP = asyncHandler(async (req, res) => {
    console.log("sendOTP controller called with body:", req.body);
    let { phoneNumber } = req.body;

    if (!phoneNumber) {
        console.log("Phone number missing in request body");
        throw new ApiError(400, "Phone number is required");
    }

    // Extract 10 digits and normalize to +91 format
    const phoneDigits = phoneNumber.replace(/[^0-9]/g, '').slice(-10);
    const normalizedPhone = `+91${phoneDigits}`;

    const defaultUsername = `patient_${phoneDigits}`;

    const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

    // Query for existing in either format
    let user = await User.findOne({ mobile_number: { $in: [normalizedPhone, phoneDigits] } });

    if (user) {
        if (user.mobile_number !== normalizedPhone) {
            user.mobile_number = normalizedPhone;
            await user.save({ validateBeforeSave: false });
        }
        // If user has default name pattern (patient_XXXXX), clear it so user can fill in app
        if (user.Fullname && user.Fullname.match(/^patient_\d{10}$/)) {
            user.Fullname = '';
            await user.save({ validateBeforeSave: false });
        }
    } else {
        // Create new user - keep name and email blank for user to fill in app
        try {
            // Create user with blank name and email - user will fill in app
            user = new User({
                mobile_number: normalizedPhone,
                userType: 'patient',
                username: defaultUsername,
                email: null, // Keep blank for user to fill
                Fullname: '', // Keep blank for user to fill
                gender: 'Other',
                dateOfBirth: new Date('2000-01-01'),
                age: 24,
                address: '',
                hospitalName: '',
                profileCompleted: false // User needs to complete profile
            });
            await user.save({ validateBeforeSave: false }); // Disable validation to allow empty Fullname

            // Don't create Patient document yet - user will complete profile later
            // This prevents the "incomplete user" vs "complete patient" mismatch
            // Patient document will be created when user completes their profile
        } catch (error) {
            console.error("Error creating new user:", error);
            throw new ApiError(500, "Failed to create new user");
        }
    }

    // Set OTP
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save({ validateBeforeSave: false });

    // Send OTP via SMS API
    const apiKey = process.env.SMS_API_KEY;
    if (!apiKey) {
        throw new ApiError(500, "SMS service not configured");
    }
    const smsUrl = `https://sms.renflair.in/V1.php?API=${apiKey}&PHONE=${phoneDigits}&OTP=${otp}`;

    try {
        const response = await fetch(smsUrl);
        const data = await response.text();
        console.log('SMS API response:', data);
        console.log(`User OTP sent successfully for ${normalizedPhone}`);
        return res.status(200).json(new ApiResponse(200, {}, "OTP sent successfully"));
    } catch (error) {
        console.error("Error sending OTP via SMS API:", error.message);
        throw new ApiError(500, "Failed to send OTP. Please try again later.");
    }

    /*
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    try {
        await client.messages.create({
            body: `Your OTP for login is: ${otp}`,
            to: phoneNumber,
            from: process.env.TWILIO_PHONE_NUMBER
        });
        return res.status(200).json(new ApiResponse(200, {}, "OTP sent successfully"));
    } catch (error) {
        console.error("Error sending OTP via Twilio:", error.message, error.stack);
        // Attempt to extract a more specific error message from Twilio
        const twilioErrorMessage = error.message || "Failed to send OTP. Please check Twilio configuration.";
        throw new ApiError(500, twilioErrorMessage);
    }
    */
});

const verifyOTP = asyncHandler(async (req, res) => {
    const { phoneNumber, otp, temporary } = req.body;

    if (!phoneNumber || !otp) {
        throw new ApiError(400, "Phone number and OTP are required");
    }

    // Normalize phone number - remove all non-digit characters and format consistently
    const phoneDigits = phoneNumber.replace(/[^0-9]/g, '').slice(-10);
    const normalizedPhone = `+91${phoneDigits}`;

    // Try to find user with normalized phone number
    const user = await User.findOne({ 
        $or: [
            { mobile_number: normalizedPhone },
            { mobile_number: phoneDigits },
            { mobile_number: phoneNumber } // Fallback to original format
        ]
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user.otp !== otp.trim()) {
        throw new ApiError(401, "Invalid OTP");
    }

    if (user.otpExpires < Date.now()) {
        throw new ApiError(401, "OTP expired");
    }

    if (!temporary) {
        // Clear OTP fields after successful verification for full login
        user.otp = undefined;
        user.otpExpires = undefined;
        user.lastLogin = new Date();
        await user.save({ validateBeforeSave: false });
    }

    // Check if profile is completed
    const needsProfile = !user.profileCompleted;

    // Check if user needs to create a password
    const needsPasswordCreation = !user.password;

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    
    // Add hasPassword field to user object
    const userObj = loggedInUser && typeof loggedInUser.toObject === 'function' 
        ? loggedInUser.toObject() 
        : loggedInUser;
    if (userObj) {
        userObj.hasPassword = !!user.password;
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const options = {
        httpOnly: true,
        sameSite: isProduction ? 'none' : 'lax',
        secure: isProduction
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: userObj || loggedInUser,
                    needsProfile,
                    needsPasswordCreation,
                    accessToken,
                    refreshToken
                },
                temporary
                    ? "OTP verified temporarily."
                    : (needsProfile ? "OTP verified. Please complete your profile." : "User logged in successfully")
            )
        );
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password, mobile_number } = req.body;

    console.log('[LOGIN] Login attempt:', { email, username, mobile_number, hasPassword: !!password });

    if (!password) {
        throw new ApiError(400, "Password is required");
    }
    if (!username && !email && !mobile_number) {
        throw new ApiError(400, "Username, email, or mobile number is required");
    }

    const findQuery = [];
    if (username) findQuery.push({ username });
    if (email) findQuery.push({ email });
    if (mobile_number) {
        // Normalize mobile number to handle all possible formats
        const phoneDigits = mobile_number.replace(/[^0-9]/g, '').slice(-10);
        const normalizedPhone = `+91${phoneDigits}`;
        // Search for both formats - also try without leading 0 if present
        const phoneWithoutLeadingZero = phoneDigits.startsWith('0') ? phoneDigits.slice(1) : phoneDigits;
        
        // Build comprehensive search query
        const mobileSearchQueries = [
            phoneDigits,
            normalizedPhone,
            phoneWithoutLeadingZero,
            `+91${phoneWithoutLeadingZero}`,
            mobile_number.trim(), // Original format
            mobile_number.replace(/\s+/g, ''), // Without spaces
            mobile_number.replace(/[^0-9+]/g, ''), // Only digits and +
        ];
        
        // Remove duplicates and add to findQuery
        const uniqueQueries = [...new Set(mobileSearchQueries.filter(q => q && q.length >= 10))];
        uniqueQueries.forEach(query => {
            findQuery.push({ mobile_number: query });
        });
        
        // Also try regex search for partial matches (last 10 digits)
        if (phoneDigits && phoneDigits.length === 10) {
            findQuery.push({
                mobile_number: { $regex: phoneDigits + '$', $options: 'i' }
            });
        }
        
        console.log('[LOGIN] Searching for mobile_number with formats:', uniqueQueries);
    }

    const user = await User.findOne({
        $or: findQuery
    });

    console.log('[LOGIN] User found:', user ? { id: user._id, name: user.Fullname, mobile: user.mobile_number, hasPassword: !!user.password } : 'NOT FOUND');

    if (!user) {
        throw new ApiError(401, "Invalid credentials"); // Changed from 404 to 401 for security
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    
    // Add hasPassword field to user object
    const userObj = loggedInUser && typeof loggedInUser.toObject === 'function' 
        ? loggedInUser.toObject() 
        : loggedInUser;
    if (userObj) {
        userObj.hasPassword = !!user.password;
    }

    // Check if profile is completed
    const needsProfile = !loggedInUser.profileCompleted;

    const isProduction = process.env.NODE_ENV === 'production';
    const options = {
        httpOnly: true,
        sameSite: isProduction ? 'none' : 'lax',
        secure: isProduction
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: userObj || loggedInUser,
                    needsProfile,
                    accessToken,
                    refreshToken
                },
                "User logged in successfully"
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    );

    const isProduction = process.env.NODE_ENV === 'production';
    const options = {
        httpOnly: true,
        sameSite: isProduction ? 'none' : 'lax',
        secure: isProduction
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request - No refresh token provided");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token - User not found");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user._id);

        const isProduction = process.env.NODE_ENV === 'production';
        const options = {
            httpOnly: true,
            sameSite: isProduction ? 'none' : 'lax',
            secure: isProduction
        };

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed successfully"
                )
            );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

const getCurrentUser = asyncHandler(async (req, res) => {
    // Base user object (already selected without password/refreshToken by middleware)
    const userObj = req.user && typeof req.user.toObject === 'function' ? req.user.toObject() : req.user;

    // Convert adminPermissions Maps to plain objects for JSON serialization
    if (userObj && userObj.adminPermissions) {
        // Convert sectionPermissions Map to plain object
        if (userObj.adminPermissions.sectionPermissions && userObj.adminPermissions.sectionPermissions instanceof Map) {
            const sectionPermsObj = {};
            userObj.adminPermissions.sectionPermissions.forEach((value, key) => {
                sectionPermsObj[key] = value;
            });
            userObj.adminPermissions.sectionPermissions = sectionPermsObj;
        } else if (userObj.adminPermissions.sectionPermissions && typeof userObj.adminPermissions.sectionPermissions === 'object') {
            // Already an object, but ensure it's a plain object (not a Map instance)
            userObj.adminPermissions.sectionPermissions = { ...userObj.adminPermissions.sectionPermissions };
        }

        // Convert fieldPermissions Map to plain object
        if (userObj.adminPermissions.fieldPermissions && userObj.adminPermissions.fieldPermissions instanceof Map) {
            const fieldPermsObj = {};
            userObj.adminPermissions.fieldPermissions.forEach((value, key) => {
                fieldPermsObj[key] = value;
            });
            userObj.adminPermissions.fieldPermissions = fieldPermsObj;
        } else if (userObj.adminPermissions.fieldPermissions && typeof userObj.adminPermissions.fieldPermissions === 'object') {
            // Already an object, but ensure it's a plain object (not a Map instance)
            userObj.adminPermissions.fieldPermissions = { ...userObj.adminPermissions.fieldPermissions };
        }
    }

    // If the user is a patient, attach session data (history + upcoming) for the profile UI
    if (userObj && userObj.userType === 'patient') {
        try {
            const patient = await Patient.findOne({ userId: userObj._id });
            if (patient) {
                // Merge Patient document fields into userObj for profile display
                // Prioritize Patient document data over User data for medical information
                userObj.surgeryType = patient.surgeryType || userObj.surgeryType || null;
                userObj.surgeryDate = patient.surgeryDate || userObj.surgeryDate || null;
                userObj.assignedDoctor = patient.assignedDoctor || userObj.assignedDoctor || null;
                userObj.assignedPhysiotherapist = patient.assignedPhysiotherapist || userObj.assignedPhysio || null;
                userObj.assignedPhysio = patient.assignedPhysiotherapist || userObj.assignedPhysio || null; // Also set assignedPhysio for compatibility
                userObj.currentCondition = patient.currentCondition || null;
                userObj.hospitalName = patient.hospitalClinic || userObj.hospitalName || null; // Map hospitalClinic to hospitalName for frontend
                userObj.hospitalClinic = patient.hospitalClinic || userObj.hospitalClinic || null; // Also keep original field name
                userObj.medicalHistory = patient.medicalHistory || null;
                userObj.allergies = patient.allergies || null;
                userObj.bloodGroup = patient.bloodGroup || null;
                userObj.medicalInsurance = patient.medicalInsurance || null;
                userObj.emergencyContactNumber = patient.emergencyContactNumber || null;
                
                // Populate doctor and physio details for each session
                const sessions = await Session.find({ patientId: patient._id })
                    .populate('doctorId', 'name')
                    .populate('physioId', 'name')
                    .select('sessionDate surgeryType doctorId physioId completedSessions totalSessions notes durationMinutes status startTime endTime actualDuration sessionVideo')
                    .sort({ sessionDate: -1 }) // Show most recent first
                    .lean();
                
                // Update missed sessions - check if session passed without being started by physiotherapist
                const now = new Date();
                for (const session of sessions) {
                    if (!session.startTime && 
                        session.status !== 'completed' && 
                        session.status !== 'cancelled' && 
                        session.status !== 'missed') {
                        
                        const sessionDate = new Date(session.sessionDate);
                        const sessionEnd = new Date(sessionDate.getTime() + (session.durationMinutes || 60) * 60000);
                        
                        // If session time has passed and physiotherapist didn't start it, mark as missed
                        if (now > sessionEnd) {
                            try {
                                await Session.findByIdAndUpdate(session._id, { status: 'missed' });
                                session.status = 'missed';
                            } catch (error) {
                                console.error(`Error updating session ${session._id} to missed:`, error);
                            }
                        }
                    }
                }
                
                userObj.sessions = sessions || [];
            } else {
                userObj.sessions = [];
            }
        } catch (err) {
            // Don't block the profile response if sessions lookup fails — log and continue with empty sessions
            console.error('Error fetching sessions for user profile:', err.message || err);
            userObj.sessions = [];
        }
    }

    // If the user is a doctor, attach doctor profile data
    if (userObj && userObj.userType === 'doctor') {
        try {
            const doctor = await Doctor.findOne({ userId: userObj._id });
            if (doctor) {
                // Merge Doctor document fields into userObj
                userObj.qualification = doctor.qualification || null;
                userObj.specialization = doctor.specialization || null;
                userObj.experience = doctor.experience || null;
                userObj.registrationNumber = doctor.registrationNumber || null;
                userObj.hospitalAffiliation = doctor.hospitalAffiliation || null;
                userObj.availableDays = doctor.availableDays || [];
                userObj.availableTimeSlots = doctor.availableTimeSlots || null;
                userObj.consultationFee = doctor.consultationFee || null;
                userObj.bio = doctor.bio || null;
            }
        } catch (err) {
            console.error('Error fetching doctor profile:', err.message || err);
        }
    }

    // If the user is a physiotherapist, attach physio profile data
    if (userObj && (userObj.userType === 'physiotherapist' || userObj.userType === 'physio')) {
        try {
            const physio = await Physio.findOne({ userId: userObj._id });
            if (physio) {
                // Merge Physio document fields into userObj
                userObj.qualification = physio.qualification || null;
                userObj.specialization = physio.specialization || null;
                userObj.experience = physio.experience || null;
                userObj.registrationNumber = physio.registrationNumber || null;
                userObj.clinicAffiliation = physio.clinicAffiliation || null;
                userObj.availableDays = physio.availableDays || [];
                userObj.availableTimeSlots = physio.availableTimeSlots || null;
                userObj.consultationFee = physio.consultationFee || null;
                userObj.bio = physio.bio || null;
            }
        } catch (err) {
            console.error('Error fetching physio profile:', err.message || err);
        }
    }

    // Add hasPassword field to indicate if user has set a password
    // This helps mobile app determine if user needs to complete registration
    if (userObj) {
        userObj.hasPassword = !!userObj.password;
        // Remove password from response (security)
        delete userObj.password;
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            userObj,
            "User fetched successfully"
        ));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const updateUserAccount = asyncHandler(async (req, res) => {
    const { Fullname, email, username } = req.body;
    const currentUser = req.user;

    if (!Fullname || !email || !username) {
        throw new ApiError(400, "All fields are required");
    }

    // If user is an admin and not "Rohit kumar", prevent changing username and email
    if (currentUser.userType === 'admin' && 
        currentUser.Fullname !== 'Rohit kumar' && 
        currentUser.Fullname !== 'Rohit Kumar') {
        // Only allow Fullname to be updated, keep username and email unchanged
        const user = await User.findByIdAndUpdate(
            currentUser._id,
            {
                $set: {
                    Fullname
                }
            },
            { new: true }
        ).select("-password");

        return res
            .status(200)
            .json(new ApiResponse(200, user, "Account details updated successfully (username and email cannot be changed)"));
    }

    // Check if username is unique (only for non-admin users or Rohit kumar)
    const existingUser = await User.findOne({ username, _id: { $ne: currentUser._id } });
    if (existingUser) {
        throw new ApiError(409, "Username already in use");
    }

    const user = await User.findByIdAndUpdate(
        currentUser._id,
        {
            $set: {
                Fullname,
                email,
                username
            }
        },
        { new: true }
    ).select("-password");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar?.secure_url && !avatar?.url) {
        throw new ApiError(400, "Error while uploading avatar");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.secure_url || avatar.url
            }
        },
        { new: true }
    ).select("-password");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar image updated successfully"));
});

const setPassword = asyncHandler(async (req, res) => {
    const { password } = req.body;
    const userId = req.user?._id;

    if (!password || password.length < 6) {
        throw new ApiError(400, "Password is required and must be at least 6 characters long.");
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    user.password = password;
    // Use validateBeforeSave: false to allow empty Fullname (user hasn't completed profile yet)
    // Pre-save hook will still run to hash the password
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(new ApiResponse(200, {}, "Password set successfully."));
});

const forgotPassword = asyncHandler(async (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
        throw new ApiError(400, "Phone number is required");
    }

    const user = await User.findOne({ mobile_number: phoneNumber });
    if (!user) {
        throw new ApiError(404, "User with this phone number does not exist.");
    }

    const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save({ validateBeforeSave: false });

    // Send OTP via SMS API
    const phoneDigits = phoneNumber.replace(/[^0-9]/g, '').slice(-10);
    const apiKey = process.env.SMS_API_KEY;
    if (!apiKey) {
        throw new ApiError(500, "SMS service not configured");
    }
    const smsUrl = `https://sms.renflair.in/V1.php?API=${apiKey}&PHONE=${phoneDigits}&OTP=${otp}`;

    try {
        await fetch(smsUrl);
        return res.status(200).json(new ApiResponse(200, {}, "Password reset OTP sent successfully."));
    } catch (error) {
        console.error("Error sending password reset OTP via SMS API:", error.message);
        throw new ApiError(500, "Failed to send password reset OTP.");
    }
});

const resetPassword = asyncHandler(async (req, res) => {
    const { phoneNumber, otp, newPassword } = req.body;

    if (!phoneNumber || !otp || !newPassword) {
        throw new ApiError(400, "Phone number, OTP, and new password are required.");
    }

    const user = await User.findOne({ mobile_number: phoneNumber });
    if (!user) {
        throw new ApiError(404, "User not found.");
    }

    if (user.otp !== otp.trim() || user.otpExpires < Date.now()) {
        throw new ApiError(401, "Invalid or expired OTP.");
    }

    user.password = newPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save({ validateBeforeSave: true });

    return res.status(200).json(new ApiResponse(200, {}, "Password has been reset successfully."));
});

const updateProfile = asyncHandler(async (req, res) => {
    // Extract data from FormData (req.body contains text fields, req.files contains uploaded files)
    const data = req.body;
    const files = req.files;

    const {
        name,
        email,
        dob,
        gender,
        address,
        contact,
        surgeryType,
        surgeryDate,
        doctorName,
        hospitalName,
        assignedPhysiotherapist,
        assignedDoctor,
        status,
        emergencyContactNumber,
        age,
        currentCondition,
        medicalHistory,
        allergies,
        bloodGroup,
        medicalInsurance,
        specialization,
        experience,
        // medicalReport is handled via req.files
        qualification,
        registrationNumber,
        hospitalAffiliation,
        availableDays,
        availableTimeSlots,
        consultationFee,
        bio,
        physioProfilePhoto,
        physioSpecialization,
        physioQualification,
        physioExperience,
        physioRegistrationNumber,
        physioClinicAffiliation,
        physioAvailableDays,
        physioAvailableTimeSlots,
        physioConsultationFee,
        physioBio,
        role
    } = data;

    const user = await User.findById(req.user?._id);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (role) user.userType = role;

    // Update common fields if provided
    if (name) user.Fullname = name;
    if (email) user.email = email;
    if (dob) user.dateOfBirth = new Date(dob);
    if (gender) user.gender = gender;
    if (address) user.address = address;
    if (contact) {
        const existingUser = await User.findOne({ mobile_number: contact, _id: { $ne: user._id } });
        if (existingUser) {
            throw new ApiError(409, "Mobile number already in use");
        }
        user.mobile_number = contact;
    }

    // Calculate age if dob is provided
    if (dob) {
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        if (age > 100 || age < 6) {
            throw new ApiError(400, "User must be between 6 and 100 years old.");
        }
        user.age = age;
    }

    // Update patient-specific fields
    if (surgeryType) user.surgeryType = surgeryType;
    if (surgeryDate) user.surgeryDate = new Date(surgeryDate);
    if (doctorName) user.doctorName = doctorName;
    if (assignedPhysiotherapist) user.assignedPhysio = assignedPhysiotherapist;
    if (assignedDoctor) user.assignedDoctor = assignedDoctor;
    if (status) user.currentStatus = status;
    if (hospitalName) user.hospitalName = hospitalName;
    if (emergencyContactNumber) user.emergencyContactNumber = emergencyContactNumber;
    if (age) user.age = age;
    if (currentCondition) user.currentCondition = currentCondition;
    if (medicalHistory) user.medicalHistory = medicalHistory;
    if (allergies) user.allergies = allergies;
    if (bloodGroup) user.bloodGroup = bloodGroup;
    if (medicalInsurance) user.medicalInsurance = medicalInsurance;

    // Update doctor-specific fields
    if (specialization) user.specialization = specialization;
    if (experience) user.experience = experience;
    if (qualification) user.qualification = qualification;
    if (registrationNumber) user.registrationNumber = registrationNumber;
    if (hospitalAffiliation) user.hospitalName = hospitalAffiliation;
    if (availableDays) {
        try {
            user.availableDays = JSON.parse(availableDays);
        } catch {
            user.availableDays = availableDays;
        }
    }
    if (availableTimeSlots) user.availableTimeSlots = availableTimeSlots;
    if (consultationFee) user.consultationFee = consultationFee;
    if (bio) user.bio = bio;

    // Update physiotherapist-specific fields
    if (physioProfilePhoto) user.avatar = physioProfilePhoto;
    if (physioSpecialization) user.specialization = physioSpecialization;
    if (physioQualification) user.qualification = physioQualification;
    if (physioExperience) user.experience = physioExperience;
    if (physioRegistrationNumber) user.registrationNumber = physioRegistrationNumber;
    if (physioClinicAffiliation) user.hospitalName = physioClinicAffiliation;
    if (physioAvailableDays) {
        try {
            user.availableDays = JSON.parse(physioAvailableDays);
        } catch {
            user.availableDays = physioAvailableDays;
        }
    }
    if (physioAvailableTimeSlots) user.availableTimeSlots = physioAvailableTimeSlots;
    if (physioConsultationFee) user.consultationFee = physioConsultationFee;
    if (physioBio) user.bio = physioBio;

    user.profileCompleted = true;

    await user.save({ validateBeforeSave: false });

    // Create role-specific profile
    if (role === 'doctor') {
        await Doctor.findOneAndUpdate(
            { userId: user._id },
            {
                userId: user._id,
                name: name || user.Fullname,
                qualification: qualification || '',
                specialization: specialization || '',
                experience: experience || 0,
                registrationNumber: registrationNumber || '',
                hospitalAffiliation: hospitalAffiliation || '',
                availableDays: availableDays ? JSON.parse(availableDays) : [],
                availableTimeSlots: availableTimeSlots || '',
                consultationFee: consultationFee || 0,
                bio: bio || '',
                profilePhoto: files?.profilePhoto ? files.profilePhoto[0].path : null
            },
            { upsert: true, new: true }
        );
    } else if (role === 'physiotherapist') {
        await Physio.findOneAndUpdate(
            { userId: user._id },
            {
                userId: user._id,
                name: name || user.Fullname,
                qualification: physioQualification || '',
                specialization: physioSpecialization || '',
                experience: physioExperience || 0,
                registrationNumber: physioRegistrationNumber || '',
                clinicAffiliation: physioClinicAffiliation || '',
                availableDays: physioAvailableDays ? JSON.parse(physioAvailableDays) : [],
                availableTimeSlots: physioAvailableTimeSlots || '',
                consultationFee: physioConsultationFee || 0,
                bio: physioBio || '',
                profilePhoto: files?.physioProfilePhoto ? files.physioProfilePhoto[0].path : null
            },
            { upsert: true, new: true }
        );
    } else if (role === 'patient') {
        const patientData = {
            userId: user._id,
            name: name || user.Fullname,
            gender: user.gender,
            dateOfBirth: user.dateOfBirth,
            age: age || user.age,
            mobileNumber: contact || user.mobile_number,
            email: email || user.email || '',
            address: address || user.address || '',
            surgeryType: surgeryType || '',
            surgeryDate: surgeryDate ? new Date(surgeryDate) : null,
            hospitalClinic: hospitalName || '',
            assignedDoctor: doctorName || assignedDoctor || '',
            assignedPhysiotherapist: assignedPhysiotherapist || '',
            currentCondition: currentCondition || '',
            medicalHistory: medicalHistory || '',
            allergies: allergies || '',
            bloodGroup: bloodGroup || '',
            emergencyContactNumber: emergencyContactNumber || contact || user.mobile_number,
            medicalInsurance: medicalInsurance || ''
        };

        // Handle medical report file upload
        if (files?.medicalReport) {
            patientData.medicalReport = files.medicalReport[0].path;
        }

        await Patient.findOneAndUpdate(
            { userId: user._id },
            patientData,
            { upsert: true, new: true }
        );
    }

    const updatedUser = await User.findById(user._id).select("-password -refreshToken");

    // Generate new tokens with updated user data
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const isProduction = process.env.NODE_ENV === 'production';
    const options = {
        httpOnly: true,
        sameSite: isProduction ? 'none' : 'lax',
        secure: isProduction
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, updatedUser, "Profile updated successfully"));
});

const welcome = asyncHandler(async (req, res) => {
    console.log(`Request received: ${req.method} ${req.path}`);
    return res.status(200).json(new ApiResponse(200, { message: "Welcome to the API Service!" }, "Welcome message"));
});

const createContactSubmission = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, phoneNumber, message } = req.body;

    if ([firstName, lastName, email, phoneNumber, message].some(field => !field || field.trim() === "")) {
        throw new ApiError(400, "All fields are required.");
    }

    const contact = await Contact.create({ firstName, lastName, email, phoneNumber, message });

    return res.status(201).json(new ApiResponse(201, contact, "Contact submission received."));
});

export {
    registerUser,
    registerWithPassword,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    changeCurrentPassword,
    updateUserAccount,
    updateUserAvatar,
    updateProfile,
    sendOTP,
    verifyOTP,
    setPassword,
    forgotPassword,
    resetPassword,
    welcome,
    createContactSubmission
};
