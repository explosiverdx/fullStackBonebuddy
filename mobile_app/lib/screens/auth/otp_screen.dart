import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import '../../models/user_model.dart';
import 'package:provider/provider.dart';

class OtpScreen extends StatefulWidget {
  final String phoneNumber;
  final bool isRegistration;
  
  const OtpScreen({
    super.key,
    required this.phoneNumber,
    this.isRegistration = false,
  });

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final List<TextEditingController> _otpControllers = 
      List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;
  bool _isResending = false;
  int _resendTimer = 60;
  bool _showPasswordFields = false;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;

  @override
  void initState() {
    super.initState();
    _startResendTimer();
  }

  void _startResendTimer() {
    Future.delayed(const Duration(seconds: 1), () {
      if (mounted && _resendTimer > 0) {
        setState(() => _resendTimer--);
        _startResendTimer();
      }
    });
  }

  Future<void> _verifyOtp() async {
    final otp = _otpControllers.map((c) => c.text).join();
    
    if (otp.length != 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter complete OTP')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      
      // For registration, use verifyOtp directly to get full response
      if (widget.isRegistration) {
        final response = await authProvider.authService.verifyOtp(
          widget.phoneNumber,
          otp,
        );
        
        if (mounted) {
          // Check if password creation is needed
          final needsPassword = response['data']?['needsPasswordCreation'] ?? false;
          final needsProfile = response['data']?['needsProfile'] ?? false;
          
          // Update provider state - but don't call checkAuthStatus as it will log out user without password
          if (response['data'] != null && response['data']['user'] != null) {
            // Parse user from response
            final userData = response['data']['user'];
            // If Fullname matches default pattern (patient_XXXXX), treat as empty
            final fullName = userData['Fullname']?.toString() ?? '';
            if (fullName.isNotEmpty && RegExp(r'^patient_\d{10}$').hasMatch(fullName)) {
              userData['Fullname'] = '';
            }
            // Update provider with user from response (tokens already saved by verifyOtp)
            final user = UserModel.fromJson(userData);
            authProvider.updateUser(user);
          }
          
          if (needsPassword) {
            // Show password fields
            setState(() {
              _showPasswordFields = true;
              _isLoading = false;
            });
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('OTP verified! Please set your password.'),
                backgroundColor: Colors.green,
              ),
            );
          } else {
            // Password not needed, proceed with registration
            if (needsProfile) {
              context.go('/role-selection');
            } else {
              context.go('/home');
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Registration successful!'),
                  backgroundColor: Colors.green,
                ),
              );
            }
          }
        }
      } else {
        // For login, use loginWithOtp
        final success = await authProvider.loginWithOtp(widget.phoneNumber, otp);
        
        if (mounted) {
          if (success) {
            // Check if user needs to complete profile
            final user = authProvider.user;
            final needsProfile = user?.patientProfile == null && 
                                 user?.doctorProfile == null && 
                                 user?.physiotherapistProfile == null;
            
            if (needsProfile && user?.isPatient == true) {
              // Navigate to profile completion screen or home
              context.go('/home');
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Login successful! Please complete your profile.'),
                  backgroundColor: Colors.green,
                ),
              );
            } else {
              context.go('/home');
            }
          } else {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Invalid OTP. Please try again.')),
            );
          }
        }
      }
    } catch (e) {
      if (mounted) {
        String errorMessage = 'Error verifying OTP. Please try again.';
        if (e.toString().contains('404')) {
          errorMessage = 'User not found. Please register first.';
        } else if (e.toString().contains('401') || e.toString().contains('Invalid')) {
          errorMessage = 'Invalid or expired OTP. Please request a new one.';
        } else {
          errorMessage = 'Error: ${e.toString()}';
        }
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errorMessage),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 5),
          ),
        );
      }
    } finally {
      if (mounted && !_showPasswordFields) {
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
        // Refresh user from API to get updated hasPassword status
        // Don't use checkAuthStatus() here as it might log out user if hasPassword check fails
        await authProvider.refreshUser();
        
        // Check if profile completion is needed
        final user = authProvider.user;
        final needsProfile = user == null || user.profileCompleted == false;
        
        if (needsProfile) {
          // Navigate to role selection
          setState(() => _isLoading = false);
          context.go('/role-selection');
        } else {
          setState(() => _isLoading = false);
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
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error setting password: ${e.toString()}'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 5),
          ),
        );
      }
    }
  }

  Future<void> _resendOtp() async {
    setState(() {
      _isResending = true;
      _resendTimer = 60;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      await authProvider.authService.sendOtp(widget.phoneNumber);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('OTP sent successfully')),
        );
        _startResendTimer();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isResending = false);
      }
    }
  }

  void _onOtpChanged(int index, String value) {
    if (value.isNotEmpty && index < 5) {
      _focusNodes[index + 1].requestFocus();
    }
    if (value.isEmpty && index > 0) {
      _focusNodes[index - 1].requestFocus();
    }
    
    // Auto submit when all fields are filled
    final allFilled = _otpControllers.every((c) => c.text.isNotEmpty);
    if (allFilled) {
      _verifyOtp();
    }
  }

  @override
  void dispose() {
    for (var controller in _otpControllers) {
      controller.dispose();
    }
    for (var focusNode in _focusNodes) {
      focusNode.dispose();
    }
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Verify OTP'),
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
                Icon(
                  _showPasswordFields ? Icons.lock : Icons.message,
                  size: 80,
                  color: const Color(0xFF0066CC),
                ),
                const SizedBox(height: 20),
                Text(
                  _showPasswordFields ? 'Set Password' : 'Enter OTP',
                  style: const TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 10),
                Text(
                  _showPasswordFields
                      ? 'Create a secure password for your account'
                      : 'We sent a verification code to\n${widget.phoneNumber}',
                  style: const TextStyle(fontSize: 16, color: Colors.grey),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 40),
                
                // OTP Input Fields (hidden when password fields are shown)
                if (!_showPasswordFields) ...[
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: List.generate(6, (index) {
                      return SizedBox(
                        width: 45,
                        height: 60,
                        child: TextField(
                          controller: _otpControllers[index],
                          focusNode: _focusNodes[index],
                          textAlign: TextAlign.center,
                          keyboardType: TextInputType.number,
                          maxLength: 1,
                          decoration: InputDecoration(
                            counterText: '',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          onChanged: (value) => _onOtpChanged(index, value),
                        ),
                      );
                    }),
                  ),
                  const SizedBox(height: 40),
                  
                  // Verify Button
                  ElevatedButton(
                    onPressed: _isLoading ? null : _verifyOtp,
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
                        : const Text('Verify OTP', style: TextStyle(fontSize: 16)),
                  ),
                  
                  const SizedBox(height: 20),
                  
                  // Resend OTP
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text("Didn't receive OTP? "),
                      if (_resendTimer > 0)
                        Text(
                          'Resend in $_resendTimer s',
                          style: const TextStyle(color: Colors.grey),
                        )
                      else
                        TextButton(
                          onPressed: _isResending ? null : _resendOtp,
                          child: const Text('Resend OTP'),
                        ),
                    ],
                  ),
                ],
                
                // Password Fields (shown after OTP verification for registration)
                if (_showPasswordFields) ...[
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
                  const SizedBox(height: 24),
                  
                  // Set Password Button
                  ElevatedButton(
                    onPressed: _isLoading ? null : _handleSetPassword,
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
                        : const Text('Complete Registration', style: TextStyle(fontSize: 16)),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

