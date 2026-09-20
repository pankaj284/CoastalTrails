import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';
import '../services/auth_state.dart';
import 'login_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  void _showEditProfile(BuildContext context) {
    final nameController = TextEditingController(text: AuthState().userName ?? '');
    final emailController = TextEditingController(text: AuthState().email ?? '');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: EdgeInsets.only(
          left: 24,
          right: 24,
          top: 24,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 28,
        ),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'Edit Profile',
              style: GoogleFonts.poppins(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppTheme.textDark,
              ),
            ),
            const SizedBox(height: 18),
            Text(
              'Full Name',
              style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 6),
            TextField(
              controller: nameController,
              decoration: const InputDecoration(
                hintText: 'Your name',
                prefixIcon: Icon(Icons.person_outline, color: AppTheme.oceanTeal, size: 20),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Email (Optional)',
              style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 6),
            TextField(
              controller: emailController,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(
                hintText: 'traveler@coastaltrails.in',
                prefixIcon: Icon(Icons.email_outlined, color: AppTheme.oceanTeal, size: 20),
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: () {
                  AuthState().updateProfile(
                    name: nameController.text.trim(),
                    email: emailController.text.trim(),
                  );
                  Navigator.pop(ctx);
                },
                child: Text(
                  'Save Changes',
                  style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showHelplineModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
            const SizedBox(height: 18),
            Text(
              'Local Gokarna Helplines',
              style: GoogleFonts.poppins(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppTheme.textDark,
              ),
            ),
            const SizedBox(height: 16),
            _buildHelplineItem('Kudle Beach Auto Stand', '+91 94481 00012', Icons.local_taxi),
            const Divider(height: 20),
            _buildHelplineItem('Om Beach Boat Ferry', '+91 97410 44552', Icons.directions_boat),
            const Divider(height: 20),
            _buildHelplineItem('Gokarna Coastal Police', '112 / 08386-256333', Icons.local_police),
            const Divider(height: 20),
            _buildHelplineItem('24/7 Gokarna Connect Desk', '+91 98450 12345', Icons.support_agent),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  void _showAboutModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                const Icon(Icons.waves, color: AppTheme.oceanTeal, size: 22),
                const SizedBox(width: 8),
                Text(
                  'About Coastal Trails',
                  style: GoogleFonts.poppins(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textDark,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Text(
              'We connect conscious travelers directly with authentic, offline family-run homestays across Gokarna.\n\n'
              '• 10% Fair Aggregation: Keeps travel affordable and sustains local families.\n'
              '• Split-Deposit Model: Pay 20% online to lock your stay; pay the remaining 80% directly to your host upon check-in.\n'
              '• Zero Native App Burden: Hosts coordinate via instant WhatsApp.',
              style: GoogleFonts.poppins(
                fontSize: 13,
                color: AppTheme.textDark.withValues(alpha: 0.8),
                height: 1.5,
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  static Widget _buildHelplineItem(String title, String phone, IconData icon) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppTheme.oceanTealSoft,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: AppTheme.oceanTeal, size: 18),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600),
              ),
              Text(
                phone,
                style: GoogleFonts.poppins(fontSize: 12, color: AppTheme.oceanTeal, fontWeight: FontWeight.w600),
              ),
            ],
          ),
        ),
        const Icon(Icons.call_outlined, color: AppTheme.oceanTeal, size: 18),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FBFA),
      body: SafeArea(
        child: ListenableBuilder(
          listenable: AuthState(),
          builder: (context, _) {
            final auth = AuthState();
            final isLoggedIn = auth.isLoggedIn;
            final userName = auth.userName ?? 'Traveler';
            final phone = auth.phoneNumber ?? '';

            return SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 1. CLEAN APP HEADER
                  Text(
                    'Profile',
                    style: GoogleFonts.poppins(
                      fontSize: 26,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.textDark,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 18),

                  // 2. HERO IDENTITY CARD
                  if (isLoggedIn) ...[
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.04),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        children: [
                          Row(
                            children: [
                              CircleAvatar(
                                radius: 28,
                                backgroundColor: AppTheme.oceanTealSoft,
                                child: Text(
                                  userName.isNotEmpty ? userName[0].toUpperCase() : 'T',
                                  style: GoogleFonts.poppins(
                                    fontSize: 22,
                                    fontWeight: FontWeight.w700,
                                    color: AppTheme.oceanTeal,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      userName,
                                      style: GoogleFonts.poppins(
                                        fontSize: 17,
                                        fontWeight: FontWeight.w700,
                                        color: AppTheme.textDark,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      phone,
                                      style: GoogleFonts.poppins(
                                        fontSize: 13,
                                        color: AppTheme.textMuted,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              IconButton(
                                icon: const Icon(Icons.edit_outlined, color: AppTheme.oceanTeal, size: 20),
                                onPressed: () => _showEditProfile(context),
                              ),
                            ],
                          ),
                          const SizedBox(height: 18),
                          const Divider(height: 1),
                          const SizedBox(height: 14),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceAround,
                            children: [
                              _buildQuickStat('${auth.bookings.length}', 'Bookings'),
                              Container(width: 1, height: 24, color: Colors.grey.shade200),
                              _buildQuickStat('3', 'Wishlist'),
                              Container(width: 1, height: 24, color: Colors.grey.shade200),
                              _buildQuickStat('5.0 ★', 'Guest Rating'),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ] else ...[
                    // CLEAN GUEST BANNER
                    Container(
                      padding: const EdgeInsets.all(22),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.04),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: AppTheme.oceanTealSoft,
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.person_outline, color: AppTheme.oceanTeal, size: 24),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Browsing as Guest',
                                      style: GoogleFonts.poppins(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w700,
                                        color: AppTheme.textDark,
                                      ),
                                    ),
                                    Text(
                                      'Sign in to reserve stays & contact hosts',
                                      style: GoogleFonts.poppins(
                                        fontSize: 12,
                                        color: AppTheme.textMuted,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          SizedBox(
                            width: double.infinity,
                            height: 46,
                            child: ElevatedButton(
                              onPressed: () => LoginScreen.push(context),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.oceanTeal,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16),
                                ),
                              ),
                              child: Text(
                                'Sign In or Register in 10s →',
                                style: GoogleFonts.poppins(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],

                  const SizedBox(height: 28),

                  // 3. SETTINGS & HELP GROUPED MENU
                  Text(
                    'Preferences & Support',
                    style: GoogleFonts.poppins(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.textDark,
                    ),
                  ),
                  const SizedBox(height: 10),

                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.03),
                          blurRadius: 10,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        SwitchListTile(
                          value: auth.whatsappAlertsEnabled,
                          activeThumbColor: AppTheme.oceanTeal,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 4),
                          secondary: const Icon(Icons.chat_bubble_outline, color: AppTheme.oceanTeal, size: 20),
                          title: Text(
                            'Host WhatsApp Alerts',
                            style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600),
                          ),
                          subtitle: Text(
                            'Instant hold confirmations via WhatsApp',
                            style: GoogleFonts.poppins(fontSize: 11, color: AppTheme.textMuted),
                          ),
                          onChanged: (v) => auth.updateProfile(whatsappAlerts: v),
                        ),
                        const Divider(height: 1, indent: 18, endIndent: 18),
                        ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 2),
                          leading: const Icon(Icons.currency_rupee, color: AppTheme.oceanTeal, size: 20),
                          title: Text(
                            'Currency',
                            style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600),
                          ),
                          trailing: Text(
                            'INR (₹)',
                            style: GoogleFonts.poppins(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.oceanTeal,
                            ),
                          ),
                        ),
                        const Divider(height: 1, indent: 18, endIndent: 18),
                        ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 2),
                          leading: const Icon(Icons.support_agent, color: AppTheme.oceanTeal, size: 20),
                          title: Text(
                            'Local Helplines & Ferry',
                            style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600),
                          ),
                          trailing: const Icon(Icons.chevron_right, size: 20, color: AppTheme.textMuted),
                          onTap: () => _showHelplineModal(context),
                        ),
                        const Divider(height: 1, indent: 18, endIndent: 18),
                        ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 2),
                          leading: const Icon(Icons.info_outline, color: AppTheme.oceanTeal, size: 20),
                          title: Text(
                            'About & 10% Local Model',
                            style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600),
                          ),
                          trailing: const Icon(Icons.chevron_right, size: 20, color: AppTheme.textMuted),
                          onTap: () => _showAboutModal(context),
                        ),
                      ],
                    ),
                  ),

                  if (isLoggedIn) ...[
                    const SizedBox(height: 24),
                    Center(
                      child: TextButton.icon(
                        onPressed: () => auth.logout(),
                        icon: const Icon(Icons.logout, size: 16, color: AppTheme.sunsetCoral),
                        label: Text(
                          'Log Out',
                          style: GoogleFonts.poppins(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.sunsetCoral,
                          ),
                        ),
                      ),
                    ),
                  ],

                  const SizedBox(height: 32),
                  Center(
                    child: Text(
                      'Coastal Trails v1.2.0 • Gokarna, Karnataka',
                      style: GoogleFonts.poppins(fontSize: 11, color: AppTheme.textMuted),
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildQuickStat(String value, String label) {
    return Column(
      children: [
        Text(
          value,
          style: GoogleFonts.poppins(
            fontSize: 15,
            fontWeight: FontWeight.w700,
            color: AppTheme.textDark,
          ),
        ),
        Text(
          label,
          style: GoogleFonts.poppins(
            fontSize: 11,
            color: AppTheme.textMuted,
          ),
        ),
      ],
    );
  }
}
