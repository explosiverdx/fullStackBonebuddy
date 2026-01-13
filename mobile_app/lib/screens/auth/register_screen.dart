import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl_phone_field/intl_phone_field.dart';
import '../../providers/auth_provider.dart';
import 'package:provider/provider.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  final _otpController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _phoneFieldKey = GlobalKey<State>();
  String _fullPhoneNumber = '';
  String _registrationStep = 'phone'; // 'phone', 'otp', 'password'
  bool _isLoading = false;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  String? _accessToken; // Store token after OTP verification

  @override
  void dispose() {
    _phoneController.dispose();
    _otpController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleGetOtp() async {
    // Ensure phone number is captured from the field
    if (_phoneController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter phone number')),
      );
      return;
    }

    // Get the full phone number - use _fullPhoneNumber if set, otherwise construct from controller
    String phoneNumber = _fullPhoneNumber;
    if (phoneNumber.isEmpty) {
      // If _fullPhoneNumber is empty, try to get it from the IntlPhoneField
      // The IntlPhoneField should have set it via onChanged, but if not, construct it
      final phoneText = _phoneController.text.trim();
      if (phoneText.isNotEmpty) {
        // Remove any non-digit characters except +
        String cleanedPhone = phoneText.replaceAll(RegExp(r'[^\d+]'), '');
        // If it starts with +91, use it as is, otherwise prepend +91
        if (cleanedPhone.startsWith('+91')) {
          phoneNumber = cleanedPhone;
        } else if (cleanedPhone.startsWith('91') && cleanedPhone.length > 2) {
          phoneNumber = '+$cleanedPhone';
        } else if (cleanedPhone.isNotEmpty) {
          phoneNumber = '+91$cleanedPhone';
        }
      }
    }

    print('📱 Sending OTP to: $phoneNumber (from _fullPhoneNumber: $_fullPhoneNumber, controller: ${_phoneController.text})');

    if (phoneNumber.isEmpty || phoneNumber.length < 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid phone number')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      print('📤 Calling sendOtp with: $phoneNumber');
      await authProvider.authService.sendOtp(phoneNumber);
      print('✅ OTP sent successfully');
      
      if (mounted) {
        setState(() {
          _registrationStep = 'otp';
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('OTP sent to your phone'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        String errorMessage = 'Error sending OTP. Please try again.';
        if (e.toString().contains('409') || e.toString().contains('already exists')) {
          errorMessage = 'This phone number is already registered. Please login instead.';
        }
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errorMessage),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 5),
          ),
        );
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _handleVerifyOtp() async {
    if (_otpController.text.isEmpty || _otpController.text.length != 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid 6-digit OTP')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final response = await authProvider.authService.verifyOtp(
        _fullPhoneNumber,
        _otpController.text,
      );
      
      if (mounted) {
        // Check if password is needed
        final needsPassword = response['data']?['needsPasswordCreation'] ?? false;
        final needsProfile = response['data']?['needsProfile'] ?? false;
        
        // Update provider state with user data (already saved by verifyOtp)
        if (response['data'] != null && response['data']['user'] != null) {
          // Update provider state manually since verifyOtp already saved tokens
          await authProvider.checkAuthStatus();
        }
        
        if (needsPassword) {
          // Get access token from storage (saved by verifyOtp)
          final token = await authProvider.authService.getAccessToken();
          setState(() {
            _accessToken = token;
            _registrationStep = 'password';
            _isLoading = false;
          });
        } else {
          // Password not needed, check if profile is needed
          if (needsProfile) {
            // Navigate to role selection
            if (mounted) {
              context.go('/role-selection');
            }
          } else {
            // Registration complete
            if (mounted) {
              context.go('/home');
            }
          }
        }
      }
    } catch (e) {
      if (mounted) {
        String errorMessage = 'Invalid OTP. Please try again.';
        if (e.toString().contains('expired')) {
          errorMessage = 'OTP has expired. Please request a new one.';
        } else if (e.toString().contains('404')) {
          errorMessage = 'User not found. Please register first.';
        }
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errorMessage),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 5),
          ),
        );
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _handleSetPassword() async {
    if (!_formKey.currentState!.validate()) return;

    if (_passwordController.text != _confirmPasswordController.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Passwords do not match'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      await authProvider.authService.setPassword(_passwordController.text);
      
      if (mounted) {
        // Reload user data
        await authProvider.checkAuthStatus();
        
        // Check if profile completion is needed
        final user = authProvider.user;
        final needsProfile = user == null || user.profileCompleted == false;
        
        if (needsProfile) {
          // Navigate to role selection
          context.go('/role-selection');
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Registration completed successfully!'),
              backgroundColor: Colors.green,
            ),
          );
          context.go('/home');
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error setting password: ${e.toString()}'),
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
        title: const Text('Register'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 40),
                const Icon(
                  Icons.person_add,
                  size: 80,
                  color: Color(0xFF0066CC),
                ),
                const SizedBox(height: 20),
                const Text(
                  'Create Account',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF0066CC),
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 10),
                const Text(
                  'Join BoneBuddy today',
                  style: TextStyle(fontSize: 16, color: Colors.grey),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 40),
                
                // Phone Number Field (always visible)
                IntlPhoneField(
                  controller: _phoneController,
                  enabled: _registrationStep == 'phone',
                  decoration: const InputDecoration(
                    labelText: 'Phone Number',
                    border: OutlineInputBorder(),
                  ),
                  initialCountryCode: 'IN',
                  onChanged: (phone) {
                    if (phone != null) {
                      _fullPhoneNumber = phone.completeNumber;
                    }
                  },
                  onCountryChanged: (country) {
                    // Update phone number when country changes
                    if (_phoneController.text.isNotEmpty) {
                      final phoneText = _phoneController.text.trim();
                      _fullPhoneNumber = '+${country.dialCode}$phoneText';
                    }
                  },
                  validator: (phone) {
                    if (_registrationStep == 'phone' && (phone == null || phone.number.isEmpty)) {
                      return 'Please enter phone number';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                
                // OTP Field (shown after phone step)
                if (_registrationStep == 'otp' || _registrationStep == 'password') ...[
                  TextFormField(
                    controller: _otpController,
                    enabled: _registrationStep == 'otp',
                    keyboardType: TextInputType.number,
                    maxLength: 6,
                    decoration: const InputDecoration(
                      labelText: 'Enter OTP',
                      border: OutlineInputBorder(),
                      counterText: '',
                    ),
                    validator: (value) {
                      if (_registrationStep == 'otp' && (value == null || value.isEmpty)) {
                        return 'Please enter OTP';
                      }
                      if (_registrationStep == 'otp' && value != null && value.length != 6) {
                        return 'OTP must be 6 digits';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                ],
                
                // Password Fields (shown after OTP verification)
                if (_registrationStep == 'password') ...[
                  TextFormField(
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    decoration: InputDecoration(
                      labelText: 'Password',
                      border: const OutlineInputBorder(),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassword ? Icons.visibility : Icons.visibility_off,
                        ),
                        onPressed: () {
                          setState(() => _obscurePassword = !_obscurePassword);
                        },
                      ),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter password';
                      }
                      if (value.length < 6) {
                        return 'Password must be at least 6 characters';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  
                  TextFormField(
                    controller: _confirmPasswordController,
                    obscureText: _obscureConfirmPassword,
                    decoration: InputDecoration(
                      labelText: 'Confirm Password',
                      border: const OutlineInputBorder(),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscureConfirmPassword ? Icons.visibility : Icons.visibility_off,
                        ),
                        onPressed: () {
                          setState(() => _obscureConfirmPassword = !_obscureConfirmPassword);
                        },
                      ),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please confirm password';
                      }
                      if (value != _passwordController.text) {
                        return 'Passwords do not match';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                ],
                
                const SizedBox(height: 24),
                
                // Action Button (changes based on step)
                ElevatedButton(
                  onPressed: _isLoading ? null : () {
                    if (_registrationStep == 'phone') {
                      _handleGetOtp();
                    } else if (_registrationStep == 'otp') {
                      _handleVerifyOtp();
                    } else if (_registrationStep == 'password') {
                      _handleSetPassword();
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0066CC),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
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
                          _registrationStep == 'phone'
                              ? 'Get OTP'
                              : _registrationStep == 'otp'
                                  ? 'Verify OTP'
                                  : 'Complete Registration',
                          style: const TextStyle(fontSize: 16),
                        ),
                ),
                
                // Back button for OTP and Password steps
                if (_registrationStep != 'phone') ...[
                  const SizedBox(height: 16),
                  TextButton(
                    onPressed: _isLoading
                        ? null
                        : () {
                            if (_registrationStep == 'otp') {
                              setState(() {
                                _registrationStep = 'phone';
                                _otpController.clear();
                              });
                            } else if (_registrationStep == 'password') {
                              setState(() {
                                _registrationStep = 'otp';
                                _passwordController.clear();
                                _confirmPasswordController.clear();
                              });
                            }
                          },
                    child: const Text('Back'),
                  ),
                ],
                
                const SizedBox(height: 16),
                
                // Login Link
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text("Already have an account? "),
                    TextButton(
                      onPressed: () => context.pop(),
                      child: const Text('Login'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

