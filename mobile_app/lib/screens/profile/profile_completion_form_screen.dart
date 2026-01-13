import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:file_picker/file_picker.dart';
import 'package:intl/intl.dart';
import '../../providers/auth_provider.dart';
import '../../services/user_service.dart';
import '../../services/api_service.dart';
import 'package:dio/dio.dart';
import 'dart:io';
import 'dart:convert';

class ProfileCompletionFormScreen extends StatefulWidget {
  final String role; // 'patient', 'doctor', 'physio'
  final bool isEditMode;
  final dynamic existingUser; // UserModel when editing

  const ProfileCompletionFormScreen({
    super.key,
    required this.role,
    this.isEditMode = false,
    this.existingUser,
  });

  @override
  State<ProfileCompletionFormScreen> createState() => _ProfileCompletionFormScreenState();
}

class _ProfileCompletionFormScreenState extends State<ProfileCompletionFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _userService = UserService();
  bool _isLoading = false;
  
  // Common fields
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _dobController = TextEditingController();
  String? _gender;
  final _addressController = TextEditingController();
  
  // Patient fields
  final _emergencyContactController = TextEditingController();
  String? _surgeryType;
  final _surgeryDateController = TextEditingController();
  final _currentConditionController = TextEditingController();
  final _doctorNameController = TextEditingController();
  final _hospitalNameController = TextEditingController();
  final _assignedPhysioController = TextEditingController();
  final _medicalHistoryController = TextEditingController();
  final _allergiesController = TextEditingController();
  final _bloodGroupController = TextEditingController();
  final _medicalInsuranceController = TextEditingController();
  File? _medicalReport;
  
  // Doctor/Physio fields
  File? _profilePhoto;
  final _specializationController = TextEditingController();
  final _experienceController = TextEditingController();
  final _qualificationController = TextEditingController();
  final _registrationNumberController = TextEditingController();
  final _affiliationController = TextEditingController();
  List<String> _availableDays = [];
  final _availableTimeSlotsController = TextEditingController();
  final _consultationFeeController = TextEditingController();
  final _bioController = TextEditingController();
  
  final List<String> _daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  @override
  void initState() {
    super.initState();
    _loadUserData();
  }
  
  void _loadUserData() {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final user = widget.existingUser ?? authProvider.user;
    
    if (user != null) {
      // Common fields
      _nameController.text = user.fullName ?? '';
      _emailController.text = user.email ?? '';
      _phoneController.text = user.phoneNumber ?? '';
      
      // Load role-specific profile data if in edit mode
      if (widget.isEditMode) {
        _loadRoleSpecificData(user);
      }
    }
  }
  
  void _loadRoleSpecificData(dynamic user) {
    // The backend merges profile data directly into the user object
    // So we need to check both the profile object and the user object directly
    
    if (widget.role == 'patient') {
      // Try to get from patientProfile first, then from user object directly
      Map<String, dynamic>? profile;
      if (user.patientProfile != null) {
        profile = user.patientProfile as Map<String, dynamic>;
      } else {
        // Data might be directly on user object (from backend merge)
        profile = {};
      }
      
      // Load from user object directly (backend merges patient data into user)
      _dobController.text = user.dateOfBirth != null 
          ? DateFormat('yyyy-MM-dd').format(DateTime.parse(user.dateOfBirth.toString()))
          : (profile['dateOfBirth'] != null 
              ? DateFormat('yyyy-MM-dd').format(DateTime.parse(profile['dateOfBirth'].toString()))
              : '');
      _gender = user.gender ?? profile['gender'];
      _addressController.text = user.address ?? profile['address'] ?? '';
      _emergencyContactController.text = user.emergencyContactNumber ?? profile['emergencyContactNumber'] ?? '';
      _surgeryType = user.surgeryType ?? profile['surgeryType'];
      _surgeryDateController.text = user.surgeryDate != null
          ? DateFormat('yyyy-MM-dd').format(DateTime.parse(user.surgeryDate.toString()))
          : (profile['surgeryDate'] != null
              ? DateFormat('yyyy-MM-dd').format(DateTime.parse(profile['surgeryDate'].toString()))
              : '');
      _currentConditionController.text = user.currentCondition ?? profile['currentCondition'] ?? '';
      _doctorNameController.text = user.assignedDoctor ?? profile['assignedDoctor'] ?? '';
      _hospitalNameController.text = user.hospitalClinic ?? user.hospitalName ?? profile['hospitalClinic'] ?? '';
      _assignedPhysioController.text = user.assignedPhysiotherapist ?? user.assignedPhysio ?? profile['assignedPhysiotherapist'] ?? '';
      _medicalHistoryController.text = user.medicalHistory ?? profile['medicalHistory'] ?? '';
      _allergiesController.text = user.allergies ?? profile['allergies'] ?? '';
      _bloodGroupController.text = user.bloodGroup ?? profile['bloodGroup'] ?? '';
      _medicalInsuranceController.text = user.medicalInsurance ?? profile['medicalInsurance'] ?? '';
    } else if (widget.role == 'doctor') {
      // Try to get from doctorProfile first, then from user object directly
      Map<String, dynamic>? profile;
      if (user.doctorProfile != null) {
        profile = user.doctorProfile as Map<String, dynamic>;
      } else {
        profile = {};
      }
      
      // Load from user object directly (backend might merge doctor data)
      _qualificationController.text = user.qualification ?? profile['qualification'] ?? '';
      _specializationController.text = user.specialization ?? profile['specialization'] ?? '';
      _experienceController.text = user.experience?.toString() ?? profile['experience']?.toString() ?? '';
      _registrationNumberController.text = user.registrationNumber ?? profile['registrationNumber'] ?? '';
      _affiliationController.text = user.hospitalAffiliation ?? profile['hospitalAffiliation'] ?? '';
      _availableDays = user.availableDays != null 
          ? List<String>.from(user.availableDays)
          : (profile['availableDays'] != null 
              ? List<String>.from(profile['availableDays'])
              : []);
      _availableTimeSlotsController.text = user.availableTimeSlots ?? profile['availableTimeSlots'] ?? '';
      _consultationFeeController.text = user.consultationFee?.toString() ?? profile['consultationFee']?.toString() ?? '';
      _bioController.text = user.bio ?? profile['bio'] ?? '';
    } else if (widget.role == 'physio') {
      // Try to get from physiotherapistProfile first, then from user object directly
      Map<String, dynamic>? profile;
      if (user.physiotherapistProfile != null) {
        profile = user.physiotherapistProfile as Map<String, dynamic>;
      } else {
        profile = {};
      }
      
      // Load from user object directly (backend might merge physio data)
      _qualificationController.text = user.qualification ?? profile['qualification'] ?? '';
      _specializationController.text = user.specialization ?? profile['specialization'] ?? '';
      _experienceController.text = user.experience?.toString() ?? profile['experience']?.toString() ?? '';
      _registrationNumberController.text = user.registrationNumber ?? profile['registrationNumber'] ?? '';
      _affiliationController.text = user.clinicAffiliation ?? profile['clinicAffiliation'] ?? '';
      _availableDays = user.availableDays != null 
          ? List<String>.from(user.availableDays)
          : (profile['availableDays'] != null 
              ? List<String>.from(profile['availableDays'])
              : []);
      _availableTimeSlotsController.text = user.availableTimeSlots ?? profile['availableTimeSlots'] ?? '';
      _consultationFeeController.text = user.consultationFee?.toString() ?? profile['consultationFee']?.toString() ?? '';
      _bioController.text = user.bio ?? profile['bio'] ?? '';
    }
  }
  
  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _dobController.dispose();
    _addressController.dispose();
    _emergencyContactController.dispose();
    _surgeryDateController.dispose();
    _currentConditionController.dispose();
    _doctorNameController.dispose();
    _hospitalNameController.dispose();
    _assignedPhysioController.dispose();
    _medicalHistoryController.dispose();
    _allergiesController.dispose();
    _bloodGroupController.dispose();
    _medicalInsuranceController.dispose();
    _specializationController.dispose();
    _experienceController.dispose();
    _qualificationController.dispose();
    _registrationNumberController.dispose();
    _affiliationController.dispose();
    _availableTimeSlotsController.dispose();
    _consultationFeeController.dispose();
    _bioController.dispose();
    super.dispose();
  }
  
  Future<void> _pickFile(bool isImage) async {
    try {
      FilePickerResult? result = await FilePicker.platform.pickFiles(
        type: isImage ? FileType.image : FileType.any,
      );
      
      if (result != null && result.files.single.path != null) {
        setState(() {
          if (isImage) {
            _profilePhoto = File(result.files.single.path!);
          } else {
            _medicalReport = File(result.files.single.path!);
          }
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error picking file: $e')),
      );
    }
  }
  
  int? _calculateAge() {
    if (_dobController.text.isEmpty) return null;
    try {
      final dob = DateFormat('yyyy-MM-dd').parse(_dobController.text);
      final today = DateTime.now();
      int age = today.year - dob.year;
      if (today.month < dob.month || (today.month == dob.month && today.day < dob.day)) {
        age--;
      }
      return age;
    } catch (e) {
      return null;
    }
  }
  
  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isLoading = true);
    
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final user = authProvider.user;
      
      Map<String, dynamic> formData = {
        'name': _nameController.text.trim(),
        'email': _emailController.text.trim().isEmpty ? null : _emailController.text.trim(),
        'contact': user?.phoneNumber ?? _phoneController.text.trim(),
        'dob': _dobController.text,
        'gender': _gender,
        'address': _addressController.text.trim(),
        'role': widget.role == 'physio' ? 'physiotherapist' : widget.role,
      };
      
      if (widget.role == 'patient') {
        formData.addAll({
          'emergencyContactNumber': _emergencyContactController.text.trim(),
          'surgeryType': _surgeryType,
          'surgeryDate': _surgeryDateController.text,
          'currentCondition': _currentConditionController.text.trim(),
          'doctorName': _doctorNameController.text.trim().isEmpty ? null : _doctorNameController.text.trim(),
          'hospitalName': _hospitalNameController.text.trim().isEmpty ? null : _hospitalNameController.text.trim(),
          'assignedPhysiotherapist': _assignedPhysioController.text.trim().isEmpty ? null : _assignedPhysioController.text.trim(),
          'medicalHistory': _medicalHistoryController.text.trim().isEmpty ? null : _medicalHistoryController.text.trim(),
          'allergies': _allergiesController.text.trim().isEmpty ? null : _allergiesController.text.trim(),
          'bloodGroup': _bloodGroupController.text.trim().isEmpty ? null : _bloodGroupController.text.trim(),
          'medicalInsurance': _medicalInsuranceController.text.trim().isEmpty ? null : _medicalInsuranceController.text.trim(),
        });
      } else       if (widget.role == 'doctor') {
        formData.addAll({
          'specialization': _specializationController.text.trim(),
          'experience': int.tryParse(_experienceController.text) ?? 0,
          'qualification': _qualificationController.text.trim(),
          'registrationNumber': _registrationNumberController.text.trim(),
          'hospitalAffiliation': _affiliationController.text.trim(),
          'availableDays': _availableDays,
          'availableTimeSlots': _availableTimeSlotsController.text.trim(),
          if (_consultationFeeController.text.trim().isNotEmpty)
            'consultationFee': int.tryParse(_consultationFeeController.text),
          if (_bioController.text.trim().isNotEmpty)
            'bio': _bioController.text.trim(),
        });
      } else if (widget.role == 'physio') {
        formData.addAll({
          'physioSpecialization': _specializationController.text.trim(),
          'physioQualification': _qualificationController.text.trim(),
          'physioExperience': int.tryParse(_experienceController.text) ?? 0,
          'physioRegistrationNumber': _registrationNumberController.text.trim(),
          'physioClinicAffiliation': _affiliationController.text.trim(),
          'physioAvailableDays': _availableDays,
          'physioAvailableTimeSlots': _availableTimeSlotsController.text.trim(),
          if (_consultationFeeController.text.trim().isNotEmpty)
            'physioConsultationFee': int.tryParse(_consultationFeeController.text),
          if (_bioController.text.trim().isNotEmpty)
            'physioBio': _bioController.text.trim(),
        });
      }
      
      // Create FormData for multipart upload
      final multipartFormData = FormData();
      
      // Add all text fields
      formData.forEach((key, value) {
        if (value != null) {
          if (value is List) {
            // For arrays, send as JSON string (backend will parse it)
            multipartFormData.fields.add(
              MapEntry(key, jsonEncode(value)),
            );
          } else {
            multipartFormData.fields.add(
              MapEntry(key, value.toString()),
            );
          }
        }
      });
      
      // Add profile photo if selected
      if (_profilePhoto != null) {
        multipartFormData.files.add(
          MapEntry(
            widget.role == 'doctor' ? 'profilePhoto' : 'physioProfilePhoto',
            await MultipartFile.fromFile(_profilePhoto!.path),
          ),
        );
      }
      
      // Add medical report if selected (for patients)
      if (widget.role == 'patient' && _medicalReport != null) {
        multipartFormData.files.add(
          MapEntry(
            'medicalReport',
            await MultipartFile.fromFile(_medicalReport!.path),
          ),
        );
      }
      
      // Submit profile using FormData
      final updatedUser = await _userService.completeProfile(multipartFormData);
      
      print('✅ Profile submitted. Updated user profileCompleted: ${updatedUser.profileCompleted}');
      
      // Update AuthProvider with the updated user immediately
      authProvider.updateUser(updatedUser);
      
      // Wait for provider to update and notify listeners
      await Future.delayed(const Duration(milliseconds: 200));
      
      // Also refresh from API to ensure we have the latest data
      await authProvider.refreshUser();
      
      // Wait a bit more to ensure state is fully updated and router has latest data
      await Future.delayed(const Duration(milliseconds: 800));
      
      if (mounted) {
        // Get fresh user data
        final user = authProvider.user;
        
        print('🔍 Checking user after refresh. profileCompleted: ${user?.profileCompleted}, role: ${user?.role}');
        
        // Check if profile is completed - must be explicitly true
        final isProfileCompleted = user?.profileCompleted == true;
        print('🔍 Final check - isProfileCompleted: $isProfileCompleted');
        
        if (user != null && (isProfileCompleted || widget.isEditMode)) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(widget.isEditMode 
                  ? 'Profile updated successfully!'
                  : 'Profile completed successfully!'),
              backgroundColor: Colors.green,
            ),
          );
          
          // Wait a bit before navigation to ensure all state is updated
          await Future.delayed(const Duration(milliseconds: 300));
          
          if (mounted) {
            if (widget.isEditMode) {
              // In edit mode, just go back to the profile screen
              context.pop();
            } else {
              // Profile is completed, navigate to profile screen
              // Use pushReplacement to prevent going back to the form
              print('🚀 Navigating to profile screen. Role: ${user.role}');
              if (user.isPatient) {
                context.go('/profile/patient');
              } else if (user.isDoctor) {
                context.go('/profile/doctor');
              } else if (user.isPhysiotherapist) {
                context.go('/profile/physiotherapist');
              } else {
                context.go('/profile');
              }
              
              // Force a rebuild of the router to pick up the updated user data
              await Future.delayed(const Duration(milliseconds: 100));
            }
          }
        } else {
          // Profile not completed yet, show error
          setState(() => _isLoading = false);
          print('❌ Profile not completed. profileCompleted: ${user?.profileCompleted}');
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Profile completion status: ${user?.profileCompleted}. Please try again.'),
              backgroundColor: Colors.orange,
              duration: const Duration(seconds: 5),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 5),
          ),
        );
        setState(() => _isLoading = false);
      }
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.isEditMode 
            ? 'Edit ${widget.role == 'patient' ? 'Patient' : widget.role == 'doctor' ? 'Doctor' : 'Physiotherapist'} Profile'
            : 'Complete ${widget.role == 'patient' ? 'Patient' : widget.role == 'doctor' ? 'Doctor' : 'Physiotherapist'} Profile'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            if (widget.isEditMode) {
              // In edit mode, navigate back to the appropriate profile screen
              final authProvider = Provider.of<AuthProvider>(context, listen: false);
              final user = authProvider.user;
              if (user != null) {
                if (user.isPatient) {
                  context.go('/profile/patient');
                } else if (user.isDoctor) {
                  context.go('/profile/doctor');
                } else if (user.isPhysiotherapist) {
                  context.go('/profile/physiotherapist');
                } else {
                  context.pop();
                }
              } else {
                context.pop();
              }
            } else {
              // In create mode, go back to role selection
              context.go('/role-selection');
            }
          },
        ),
      ),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Common Fields
              _buildSectionTitle('Personal Information'),
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: 'Full Name *',
                  border: OutlineInputBorder(),
                ),
                validator: (value) => value?.isEmpty ?? true ? 'Please enter your name' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _emailController,
                decoration: const InputDecoration(
                  labelText: 'Email (optional)',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _phoneController,
                decoration: const InputDecoration(
                  labelText: 'Phone Number *',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.phone,
                enabled: false, // Phone is set during registration
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _dobController,
                decoration: const InputDecoration(
                  labelText: 'Date of Birth *',
                  border: OutlineInputBorder(),
                  suffixIcon: Icon(Icons.calendar_today),
                ),
                readOnly: true,
                onTap: () async {
                  final date = await showDatePicker(
                    context: context,
                    initialDate: DateTime.now().subtract(const Duration(days: 365 * 25)),
                    firstDate: DateTime(1900),
                    lastDate: DateTime.now(),
                  );
                  if (date != null) {
                    setState(() {
                      _dobController.text = DateFormat('yyyy-MM-dd').format(date);
                    });
                  }
                },
                validator: (value) => value?.isEmpty ?? true ? 'Please select date of birth' : null,
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _gender,
                decoration: const InputDecoration(
                  labelText: 'Gender *',
                  border: OutlineInputBorder(),
                ),
                items: ['Male', 'Female', 'Other'].map((gender) {
                  return DropdownMenuItem(value: gender, child: Text(gender));
                }).toList(),
                onChanged: (value) => setState(() => _gender = value),
                validator: (value) => value == null ? 'Please select gender' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _addressController,
                decoration: const InputDecoration(
                  labelText: 'Address *',
                  border: OutlineInputBorder(),
                ),
                maxLines: 3,
                validator: (value) => value?.isEmpty ?? true ? 'Please enter your address' : null,
              ),
              const SizedBox(height: 24),
              
              // Role-specific fields
              if (widget.role == 'patient') ..._buildPatientFields(),
              if (widget.role == 'doctor') ..._buildDoctorFields(),
              if (widget.role == 'physio') ..._buildPhysioFields(),
              
              const SizedBox(height: 32),
              
              // Submit Button
              ElevatedButton(
                onPressed: _isLoading ? null : _submitForm,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0066CC),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: _isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : Text(
                        widget.isEditMode ? 'Update Profile' : 'Submit',
                        style: const TextStyle(fontSize: 16),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16, top: 8),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.bold,
          color: Color(0xFF0066CC),
        ),
      ),
    );
  }
  
  List<Widget> _buildPatientFields() {
    final age = _calculateAge();
    return [
      _buildSectionTitle('Patient Information'),
      TextFormField(
        initialValue: age?.toString() ?? '',
        decoration: const InputDecoration(
          labelText: 'Age *',
          border: OutlineInputBorder(),
          helperText: 'Auto-calculated from date of birth',
        ),
        readOnly: true,
        enabled: false,
      ),
      const SizedBox(height: 16),
      TextFormField(
        controller: _emergencyContactController,
        decoration: const InputDecoration(
          labelText: 'Emergency Contact Number *',
          border: OutlineInputBorder(),
        ),
        keyboardType: TextInputType.phone,
        maxLength: 10,
        validator: (value) => value?.isEmpty ?? true ? 'Please enter emergency contact' : null,
      ),
      const SizedBox(height: 16),
      DropdownButtonFormField<String>(
        value: _surgeryType,
        decoration: const InputDecoration(
          labelText: 'Surgery Type *',
          border: OutlineInputBorder(),
        ),
        items: ['Fracture', 'Knee Replacement', 'Hip Replacement', 'Spine Surgery', 'Other']
            .map((type) => DropdownMenuItem(value: type, child: Text(type)))
            .toList(),
        onChanged: (value) => setState(() => _surgeryType = value),
        validator: (value) => value == null ? 'Please select surgery type' : null,
      ),
      const SizedBox(height: 16),
      TextFormField(
        controller: _surgeryDateController,
        decoration: const InputDecoration(
          labelText: 'Surgery Date *',
          border: OutlineInputBorder(),
          suffixIcon: Icon(Icons.calendar_today),
        ),
        readOnly: true,
        onTap: () async {
          final date = await showDatePicker(
            context: context,
            initialDate: DateTime.now(),
            firstDate: DateTime(2000),
            lastDate: DateTime.now(),
          );
          if (date != null) {
            setState(() {
              _surgeryDateController.text = DateFormat('yyyy-MM-dd').format(date);
            });
          }
        },
        validator: (value) => value?.isEmpty ?? true ? 'Please select surgery date' : null,
      ),
      const SizedBox(height: 16),
      TextFormField(
        controller: _currentConditionController,
        decoration: const InputDecoration(
          labelText: 'Current Condition *',
          border: OutlineInputBorder(),
        ),
        maxLines: 2,
        validator: (value) => value?.isEmpty ?? true ? 'Please describe your current condition' : null,
      ),
      const SizedBox(height: 16),
      TextFormField(
        controller: _doctorNameController,
        decoration: const InputDecoration(
          labelText: 'Doctor Name (optional)',
          border: OutlineInputBorder(),
        ),
      ),
      const SizedBox(height: 16),
      TextFormField(
        controller: _hospitalNameController,
        decoration: const InputDecoration(
          labelText: 'Hospital/Clinic Name (optional)',
          border: OutlineInputBorder(),
        ),
      ),
      const SizedBox(height: 16),
      TextFormField(
        controller: _assignedPhysioController,
        decoration: const InputDecoration(
          labelText: 'Assigned Physiotherapist (optional)',
          border: OutlineInputBorder(),
        ),
      ),
      const SizedBox(height: 16),
      TextFormField(
        controller: _medicalHistoryController,
        decoration: const InputDecoration(
          labelText: 'Medical History (optional)',
          border: OutlineInputBorder(),
        ),
        maxLines: 3,
      ),
      const SizedBox(height: 16),
      TextFormField(
        controller: _allergiesController,
        decoration: const InputDecoration(
          labelText: 'Allergies (optional)',
          border: OutlineInputBorder(),
        ),
      ),
      const SizedBox(height: 16),
      TextFormField(
        controller: _bloodGroupController,
        decoration: const InputDecoration(
          labelText: 'Blood Group (optional)',
          border: OutlineInputBorder(),
        ),
      ),
      const SizedBox(height: 16),
      TextFormField(
        controller: _medicalInsuranceController,
        decoration: const InputDecoration(
          labelText: 'Medical Insurance (optional)',
          border: OutlineInputBorder(),
        ),
      ),
      const SizedBox(height: 16),
      InkWell(
        onTap: () => _pickFile(false),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            border: Border.all(color: Colors.grey),
            borderRadius: BorderRadius.circular(4),
          ),
          child: Row(
            children: [
              const Icon(Icons.attach_file),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  _medicalReport?.path.split('/').last ?? 'Medical Report (optional)',
                  style: TextStyle(
                    color: _medicalReport != null ? Colors.black : Colors.grey,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    ];
  }
  
  List<Widget> _buildDoctorFields() {
    return [
      _buildSectionTitle('Doctor Information'),
      InkWell(
        onTap: () => _pickFile(true),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            border: Border.all(color: Colors.grey),
            borderRadius: BorderRadius.circular(4),
          ),
          child: Row(
            children: [
              const Icon(Icons.camera_alt),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  _profilePhoto?.path.split('/').last ?? 'Profile Photo *',
                  style: TextStyle(
                    color: _profilePhoto != null ? Colors.black : Colors.grey,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
      const SizedBox(height: 16),
      TextFormField(
        controller: _specializationController,
        decoration: const InputDecoration(
          labelText: 'Specialization *',
          border: OutlineInputBorder(),
        ),
        validator: (value) => value?.isEmpty ?? true ? 'Please enter specialization' : null,
      ),
      const SizedBox(height: 16),
      TextFormField(
        controller: _experienceController,
        decoration: const InputDecoration(
          labelText: 'Experience (years) *',
          border: OutlineInputBorder(),
        ),
        keyboardType: TextInputType.number,
        validator: (value) => value?.isEmpty ?? true ? 'Please enter experience' : null,
      ),
      const SizedBox(height: 16),
      TextFormField(
        controller: _qualificationController,
        decoration: const InputDecoration(
          labelText: 'Qualification *',
          border: OutlineInputBorder(),
        ),
        validator: (value) => value?.isEmpty ?? true ? 'Please enter qualification' : null,
      ),
      const SizedBox(height: 16),
      TextFormField(
        controller: _registrationNumberController,
        decoration: const InputDecoration(
          labelText: 'Registration Number / License ID (optional)',
          border: OutlineInputBorder(),
        ),
      ),
      const SizedBox(height: 16),
      TextFormField(
        controller: _affiliationController,
        decoration: const InputDecoration(
          labelText: 'Hospital / Clinic Affiliation *',
          border: OutlineInputBorder(),
        ),
        validator: (value) => value?.isEmpty ?? true ? 'Please enter hospital affiliation' : null,
      ),
      const SizedBox(height: 16),
      _buildSectionTitle('Available Days *'),
      Wrap(
        spacing: 8,
        children: _daysOfWeek.map((day) {
          return FilterChip(
            label: Text(day),
            selected: _availableDays.contains(day),
            onSelected: (selected) {
              setState(() {
                if (selected) {
                  _availableDays.add(day);
                } else {
                  _availableDays.remove(day);
                }
              });
            },
          );
        }).toList(),
      ),
      const SizedBox(height: 16),
      TextFormField(
        controller: _availableTimeSlotsController,
        decoration: const InputDecoration(
          labelText: 'Available Time Slots (e.g. 9am - 5pm) *',
          border: OutlineInputBorder(),
        ),
        validator: (value) => value?.isEmpty ?? true ? 'Please enter available time slots' : null,
      ),
      const SizedBox(height: 16),
      TextFormField(
        controller: _consultationFeeController,
        decoration: const InputDecoration(
          labelText: 'Consultation Fee (optional)',
          border: OutlineInputBorder(),
        ),
        keyboardType: TextInputType.number,
      ),
      const SizedBox(height: 16),
      TextFormField(
        controller: _bioController,
        decoration: const InputDecoration(
          labelText: 'Short Bio / About Doctor (optional)',
          border: OutlineInputBorder(),
        ),
        maxLines: 3,
      ),
    ];
  }
  
  List<Widget> _buildPhysioFields() {
    return [
      _buildSectionTitle('Physiotherapist Information'),
      InkWell(
        onTap: () => _pickFile(true),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            border: Border.all(color: Colors.grey),
            borderRadius: BorderRadius.circular(4),
          ),
          child: Row(
            children: [
              const Icon(Icons.camera_alt),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  _profilePhoto?.path.split('/').last ?? 'Profile Photo *',
                  style: TextStyle(
                    color: _profilePhoto != null ? Colors.black : Colors.grey,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
      const SizedBox(height: 16),
      TextFormField(
        controller: _specializationController,
        decoration: const InputDecoration(
          labelText: 'Specialization / Focus Area *',
          border: OutlineInputBorder(),
        ),
        validator: (value) => value?.isEmpty ?? true ? 'Please enter specialization' : null,
      ),
      const SizedBox(height: 16),
      TextFormField(
        controller: _qualificationController,
        decoration: const InputDecoration(
          labelText: 'Qualification *',
          border: OutlineInputBorder(),
        ),
        validator: (value) => value?.isEmpty ?? true ? 'Please enter qualification' : null,
      ),
      const SizedBox(height: 16),
      TextFormField(
        controller: _experienceController,
        decoration: const InputDecoration(
          labelText: 'Experience (years) *',
          border: OutlineInputBorder(),
        ),
        keyboardType: TextInputType.number,
        validator: (value) => value?.isEmpty ?? true ? 'Please enter experience' : null,
      ),
      const SizedBox(height: 16),
      TextFormField(
        controller: _registrationNumberController,
        decoration: const InputDecoration(
          labelText: 'Registration / License Number (optional)',
          border: OutlineInputBorder(),
        ),
      ),
      const SizedBox(height: 16),
      TextFormField(
        controller: _affiliationController,
        decoration: const InputDecoration(
          labelText: 'Clinic / Hospital Affiliation *',
          border: OutlineInputBorder(),
        ),
        validator: (value) => value?.isEmpty ?? true ? 'Please enter clinic affiliation' : null,
      ),
      const SizedBox(height: 16),
      _buildSectionTitle('Available Days *'),
      Wrap(
        spacing: 8,
        children: _daysOfWeek.map((day) {
          return FilterChip(
            label: Text(day),
            selected: _availableDays.contains(day),
            onSelected: (selected) {
              setState(() {
                if (selected) {
                  _availableDays.add(day);
                } else {
                  _availableDays.remove(day);
                }
              });
            },
          );
        }).toList(),
      ),
      const SizedBox(height: 16),
      TextFormField(
        controller: _availableTimeSlotsController,
        decoration: const InputDecoration(
          labelText: 'Available Time Slots (e.g. 9am - 5pm) *',
          border: OutlineInputBorder(),
        ),
        validator: (value) => value?.isEmpty ?? true ? 'Please enter available time slots' : null,
      ),
      const SizedBox(height: 16),
      TextFormField(
        controller: _consultationFeeController,
        decoration: const InputDecoration(
          labelText: 'Consultation / Session Fee (optional)',
          border: OutlineInputBorder(),
        ),
        keyboardType: TextInputType.number,
      ),
      const SizedBox(height: 16),
      TextFormField(
        controller: _bioController,
        decoration: const InputDecoration(
          labelText: 'Short Bio / Description (optional)',
          border: OutlineInputBorder(),
        ),
        maxLines: 3,
      ),
    ];
  }
}

