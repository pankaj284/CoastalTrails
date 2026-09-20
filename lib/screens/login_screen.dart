import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/auth_state.dart';
import '../widgets/travel_illustration.dart';

class LoginScreen extends StatefulWidget {
  final VoidCallback? onAuthenticated;
  const LoginScreen({super.key, this.onAuthenticated});

  static Future<bool?> push(BuildContext context, {VoidCallback? onAuthenticated}) {
    return Navigator.push<bool>(
      context,
      PageRouteBuilder(
        pageBuilder: (context, animation, secondaryAnimation) =>
            LoginScreen(onAuthenticated: onAuthenticated),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          final curved = CurvedAnimation(parent: animation, curve: Curves.easeOutCubic);
          return SlideTransition(
            position: Tween<Offset>(begin: const Offset(0, 0.1), end: Offset.zero).animate(curved),
            child: FadeTransition(opacity: curved, child: child),
          );
        },
        transitionDuration: const Duration(milliseconds: 300),
      ),
    );
  }

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _otpController = TextEditingController();

  bool _isOtpStage = false;
  bool _isLoading = false;
  String? _errorMessage;

  bool _isReturningUser = false;
  String? _detectedName;

  @override
  void initState() {
    super.initState();
    _phoneController.addListener(_onPhoneChanged);
  }

  @override
  void dispose() {
    _phoneController.removeListener(_onPhoneChanged);
    _phoneController.dispose();
    _nameController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  void _onPhoneChanged() {
    final text = _phoneController.text.trim();
    if (text.length >= 10) {
      final exists = AuthState().isExistingUser(text);
      final name = AuthState().getUserNameByPhone(text);
      if (mounted) {
        setState(() {
          _isReturningUser = exists;
          _detectedName = name;
        });
      }
    } else {
      if (_isReturningUser || _detectedName != null) {
        if (mounted) {
          setState(() {
            _isReturningUser = false;
            _detectedName = null;
          });
        }
      }
    }
  }

  void _sendOtp() {
    final phone = _phoneController.text.trim();
    if (phone.length < 10) {
      setState(() => _errorMessage = 'Enter your 10-digit mobile number');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    Future.delayed(const Duration(milliseconds: 600), () {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _isOtpStage = true;
        _otpController.text = '4291';
      });
    });
  }

  void _verifyOtp() {
    final otp = _otpController.text.trim();
    if (otp.length != 4) {
      setState(() => _errorMessage = 'Enter the 4-digit code');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    Future.delayed(const Duration(milliseconds: 500), () {
      if (!mounted) return;
      final phone = _phoneController.text.trim();
      final enteredName = _nameController.text.trim();

      AuthState().login(
        phone: phone,
        name: enteredName.isNotEmpty ? enteredName : _detectedName,
      );

      setState(() => _isLoading = false);

      if (widget.onAuthenticated != null) {
        widget.onAuthenticated!();
      }
      Navigator.pop(context, true);
    });
  }

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;
    final topPadding = MediaQuery.of(context).padding.top;

    return Scaffold(
      backgroundColor: const Color(0xFF3354F4),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // 1. TROPICAL CHARACTER ILLUSTRATION (Matches User Uploaded Reference Image 2 Screen 1)
            Stack(
              children: [
                TropicalLoginHeroWidget(height: screenHeight * 0.44),
                // Back Button
                Positioned(
                  top: topPadding + 10,
                  left: 16,
                  child: Material(
                    color: Colors.white.withValues(alpha: 0.85),
                    shape: const CircleBorder(),
                    child: InkWell(
                      customBorder: const CircleBorder(),
                      onTap: () => Navigator.pop(context),
                      child: const Padding(
                        padding: EdgeInsets.all(10),
                        child: Icon(Icons.arrow_back, color: Color(0xFF1B2834), size: 20),
                      ),
                    ),
                  ),
                ),
              ],
            ),

            // 2. CRISP WHITE CARD (Matches Reference Image 2)
            Container(
              width: double.infinity,
              constraints: BoxConstraints(minHeight: screenHeight * 0.56),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(36)),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 32),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _isOtpStage ? 'Verification' : 'Welcome!',
                    style: GoogleFonts.poppins(
                      fontSize: 28,
                      fontWeight: FontWeight.w800,
                      color: const Color(0xFF1B2834),
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _isOtpStage
                        ? 'Code sent to +91 ${_phoneController.text}'
                        : (_isReturningUser
                            ? 'Welcome back, $_detectedName! Sign in with OTP'
                            : 'Sign in to your account or register instantly'),
                    style: GoogleFonts.poppins(
                      fontSize: 13,
                      color: const Color(0xFF8A98A5),
                    ),
                  ),
                  const SizedBox(height: 28),

                  if (_errorMessage != null) ...[
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      margin: const EdgeInsets.only(bottom: 18),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFECE9),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.error_outline, color: Color(0xFFFF725E), size: 18),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _errorMessage!,
                              style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFFFF725E)),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],

                  if (!_isOtpStage) ...[
                    // Input 1: Phone / Username Pill
                    Container(
                      decoration: BoxDecoration(
                        color: const Color(0xFFEFF8F7),
                        borderRadius: BorderRadius.circular(28),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: TextField(
                        controller: _phoneController,
                        keyboardType: TextInputType.phone,
                        style: GoogleFonts.poppins(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF1B2834),
                        ),
                        decoration: InputDecoration(
                          hintText: 'Mobile or WhatsApp Number',
                          hintStyle: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFF94A5B3)),
                          prefixIcon: const Icon(Icons.phone_iphone, color: Color(0xFF3354F4), size: 20),
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                          filled: false,
                          contentPadding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Input 2: Name (auto registers new traveler)
                    Container(
                      decoration: BoxDecoration(
                        color: const Color(0xFFEFF8F7),
                        borderRadius: BorderRadius.circular(28),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: TextField(
                        controller: _nameController,
                        style: GoogleFonts.poppins(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF1B2834),
                        ),
                        decoration: InputDecoration(
                          hintText: _isReturningUser
                              ? 'Recognized: $_detectedName'
                              : 'Your Name (Auto-saved if new)',
                          hintStyle: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFF94A5B3)),
                          prefixIcon: const Icon(Icons.person_outline, color: Color(0xFF3354F4), size: 20),
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                          filled: false,
                          contentPadding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),

                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: () {},
                        child: Text(
                          'Zero passwords needed',
                          style: GoogleFonts.poppins(
                            fontSize: 12,
                            color: const Color(0xFF8A98A5),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Sign In Pill Button (Matches Image 2 Screen 1)
                    SizedBox(
                      width: double.infinity,
                      height: 54,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _sendOtp,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF3354F4),
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(28),
                          ),
                        ),
                        child: _isLoading
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                              )
                            : Text(
                                'Sign In',
                                style: GoogleFonts.poppins(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white,
                                ),
                              ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Footer Link
                    Center(
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'You have no account? ',
                            style: GoogleFonts.poppins(fontSize: 12.5, color: const Color(0xFF8A98A5)),
                          ),
                          InkWell(
                            onTap: _sendOtp,
                            child: Text(
                              'Sign up now',
                              style: GoogleFonts.poppins(
                                fontSize: 12.5,
                                fontWeight: FontWeight.w700,
                                color: const Color(0xFF3354F4),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ] else ...[
                    // OTP Verification Box
                    Container(
                      decoration: BoxDecoration(
                        color: const Color(0xFFEFF8F7),
                        borderRadius: BorderRadius.circular(28),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      child: TextField(
                        controller: _otpController,
                        keyboardType: TextInputType.number,
                        textAlign: TextAlign.center,
                        maxLength: 4,
                        autofocus: true,
                        style: GoogleFonts.poppins(
                          fontSize: 28,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 20,
                          color: const Color(0xFF3354F4),
                        ),
                        decoration: const InputDecoration(
                          counterText: '',
                          hintText: '••••',
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                          filled: false,
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    SizedBox(
                      width: double.infinity,
                      height: 54,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _verifyOtp,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF3354F4),
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(28),
                          ),
                        ),
                        child: _isLoading
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                              )
                            : Text(
                                'Verify & Enter',
                                style: GoogleFonts.poppins(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white,
                                ),
                              ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    Center(
                      child: TextButton(
                        onPressed: () => setState(() => _isOtpStage = false),
                        child: Text(
                          'Edit phone number',
                          style: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFF3354F4)),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
