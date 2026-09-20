import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../theme/app_theme.dart';
import '../models/booking.dart';
import '../services/auth_state.dart';

class HoldTimerScreen extends StatefulWidget {
  final Booking booking;
  const HoldTimerScreen({super.key, required this.booking});

  @override
  State<HoldTimerScreen> createState() => _HoldTimerScreenState();
}

class _HoldTimerScreenState extends State<HoldTimerScreen> with SingleTickerProviderStateMixin {
  late Timer _timer;
  int _secondsRemaining = 900; // 15 minutes = 900 seconds
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);

    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_secondsRemaining > 0) {
        setState(() => _secondsRemaining--);
      } else {
        _timer.cancel();
        _onTimeout();
      }
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    _pulseController.dispose();
    super.dispose();
  }

  void _onTimeout() {
    setState(() {
      widget.booking.status = BookingStatus.timedOut;
    });
    AuthState().updateBookingStatus(widget.booking.id, BookingStatus.timedOut);
  }

  void _simulateHostAccept() {
    _timer.cancel();
    setState(() {
      widget.booking.status = BookingStatus.confirmed;
    });
    AuthState().updateBookingStatus(widget.booking.id, BookingStatus.confirmed);
  }

  void _simulateHostDecline() {
    _timer.cancel();
    setState(() {
      widget.booking.status = BookingStatus.declined;
    });
    AuthState().updateBookingStatus(widget.booking.id, BookingStatus.declined);
  }

  String _formatTimer(int totalSeconds) {
    final m = (totalSeconds ~/ 60).toString().padLeft(2, '0');
    final s = (totalSeconds % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    final isConfirmed = widget.booking.status == BookingStatus.confirmed;
    final isDeclined = widget.booking.status == BookingStatus.declined;
    final isPending = widget.booking.status == BookingStatus.awaitingHost;

    final currencyFmt = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

    return Scaffold(
      backgroundColor: isConfirmed
          ? const Color(0xFFEAF8F5)
          : (isPending ? AppTheme.backgroundAqua : Colors.grey.shade100),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(
            Icons.close,
            color: isPending ? Colors.white : AppTheme.textDark,
          ),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          isConfirmed ? 'Stay Confirmed!' : 'Booking Request',
          style: GoogleFonts.poppins(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: isPending ? Colors.white : AppTheme.textDark,
          ),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
          child: Column(
            children: [
              // Main Interactive Status Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(32),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.08),
                      blurRadius: 24,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    // Beacon / Icon Animation
                    if (isPending) ...[
                      AnimatedBuilder(
                        animation: _pulseController,
                        builder: (context, child) {
                          return Container(
                            width: 84 + (_pulseController.value * 12),
                            height: 84 + (_pulseController.value * 12),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: AppTheme.oceanTealSoft,
                              border: Border.all(
                                color: AppTheme.oceanTeal.withValues(alpha: 0.6 - (_pulseController.value * 0.4)),
                                width: 3,
                              ),
                            ),
                            child: const Center(
                              child: Icon(Icons.chat_bubble_outline, color: AppTheme.oceanTeal, size: 36),
                            ),
                          );
                        },
                      ),
                      const SizedBox(height: 18),
                      Text(
                        'Pinging Host on WhatsApp...',
                        style: GoogleFonts.poppins(
                          fontSize: 17,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.textDark,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Host has 15 minutes to accept your request before inventory hold auto-releases.',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.poppins(
                          fontSize: 12,
                          color: AppTheme.textMuted,
                          height: 1.4,
                        ),
                      ),
                      const SizedBox(height: 16),
                      // Countdown Badge
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                        decoration: BoxDecoration(
                          color: AppTheme.coralLight,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.timer_outlined, color: AppTheme.sunsetCoral, size: 18),
                            const SizedBox(width: 8),
                            Text(
                              _formatTimer(_secondsRemaining),
                              style: GoogleFonts.poppins(
                                fontSize: 20,
                                fontWeight: FontWeight.w800,
                                color: AppTheme.sunsetCoral,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ] else if (isConfirmed) ...[
                      Container(
                        width: 76,
                        height: 76,
                        decoration: const BoxDecoration(
                          color: Color(0xFFD8F3ED),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.check_circle, color: Color(0xFF1B998B), size: 48),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Booking Confirmed! 🎉',
                        style: GoogleFonts.poppins(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.textDark,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Host accepted your reservation via WhatsApp.',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.poppins(fontSize: 13, color: AppTheme.textMuted),
                      ),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          color: AppTheme.oceanTealSoft,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Text(
                          'Passcode / Ref: ${widget.booking.referenceCode}',
                          style: GoogleFonts.poppins(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.oceanTeal,
                            letterSpacing: 1.0,
                          ),
                        ),
                      ),
                    ] else ...[
                      const Icon(Icons.cancel_outlined, color: AppTheme.sunsetCoral, size: 64),
                      const SizedBox(height: 14),
                      Text(
                        isDeclined ? 'Host Declined' : 'Request Timed Out',
                        style: GoogleFonts.poppins(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.textDark,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Your 20% advance authorization was instantly unfrozen. No funds were debited.',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.poppins(fontSize: 12, color: AppTheme.textMuted),
                      ),
                    ],

                    const Divider(height: 36),

                    // Stay Summary Details
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: Image.network(
                            widget.booking.homestay.imageUrls.first,
                            width: 68,
                            height: 68,
                            fit: BoxFit.cover,
                            errorBuilder: (ctx, err, stack) => Container(
                              width: 68,
                              height: 68,
                              color: AppTheme.oceanTealSoft,
                              child: const Icon(Icons.beach_access, color: AppTheme.oceanTeal),
                            ),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                widget.booking.homestay.title,
                                style: GoogleFonts.poppins(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: AppTheme.textDark,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '${widget.booking.homestay.location.displayName} • ${widget.booking.nights} night(s)',
                                style: GoogleFonts.poppins(
                                  fontSize: 12,
                                  color: AppTheme.textMuted,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Host: ${widget.booking.homestay.hostName}',
                                style: GoogleFonts.poppins(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: AppTheme.oceanTeal,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 18),

                    // Split Payment Breakdown
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: AppTheme.surfaceMuted,
                        borderRadius: BorderRadius.circular(18),
                      ),
                      child: Column(
                        children: [
                          _buildPriceRow(
                            '20% Advance Online Lock',
                            currencyFmt.format(widget.booking.advancePaid),
                            isBold: false,
                            subtitle: isConfirmed ? 'Captured via UPI' : 'Pre-authorized hold',
                          ),
                          const SizedBox(height: 8),
                          _buildPriceRow(
                            '80% Balance at Property',
                            currencyFmt.format(widget.booking.balancePayableAtProperty),
                            isBold: false,
                            subtitle: 'Pay directly to host at check-in (Cash / UPI)',
                          ),
                          const Divider(height: 18),
                          _buildPriceRow(
                            'Total Stay Tariff',
                            currencyFmt.format(widget.booking.totalAmount),
                            isBold: true,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Prototype Testing Action Bar
              if (isPending) ...[
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: Column(
                    children: [
                      Text(
                        '⚡ PROTOTYPE TEST CONTROLS',
                        style: GoogleFonts.poppins(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.2,
                          color: AppTheme.textMuted,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: _simulateHostAccept,
                              icon: const Icon(Icons.check, size: 16),
                              label: const Text('Host: Accept'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF1B998B),
                                padding: const EdgeInsets.symmetric(vertical: 12),
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: _simulateHostDecline,
                              icon: const Icon(Icons.close, size: 16),
                              label: const Text('Host: Decline'),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: AppTheme.sunsetCoral,
                                side: const BorderSide(color: AppTheme.sunsetCoral),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(24),
                                ),
                                padding: const EdgeInsets.symmetric(vertical: 12),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ] else if (isConfirmed) ...[
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton.icon(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.map_outlined),
                    label: const Text('View Directions & My Bookings'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.oceanTeal,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPriceRow(String label, String amount, {bool isBold = false, String? subtitle}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: GoogleFonts.poppins(
                fontSize: isBold ? 14 : 12,
                fontWeight: isBold ? FontWeight.w700 : FontWeight.w500,
                color: AppTheme.textDark,
              ),
            ),
            if (subtitle != null) ...[
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: GoogleFonts.poppins(
                  fontSize: 10,
                  color: AppTheme.textMuted,
                ),
              ),
            ],
          ],
        ),
        Text(
          amount,
          style: GoogleFonts.poppins(
            fontSize: isBold ? 16 : 13,
            fontWeight: isBold ? FontWeight.w800 : FontWeight.w600,
            color: isBold ? AppTheme.oceanTeal : AppTheme.textDark,
          ),
        ),
      ],
    );
  }
}
