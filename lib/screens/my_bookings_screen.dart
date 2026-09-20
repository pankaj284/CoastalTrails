import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../theme/app_theme.dart';
import '../models/booking.dart';
import '../services/auth_state.dart';
import 'hold_timer_screen.dart';

class MyBookingsScreen extends StatelessWidget {
  final VoidCallback onExplore;
  const MyBookingsScreen({super.key, required this.onExplore});

  @override
  Widget build(BuildContext context) {
    final currencyFmt = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);
    final dateFmt = DateFormat('dd MMM');

    return Scaffold(
      backgroundColor: AppTheme.surfaceMuted,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text(
          'My Trips & Stays',
          style: GoogleFonts.poppins(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: AppTheme.textDark,
          ),
        ),
        centerTitle: false,
      ),
      body: ListenableBuilder(
        listenable: AuthState(),
        builder: (context, _) {
          final bookings = AuthState().bookings;

          if (bookings.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: const BoxDecoration(
                        color: AppTheme.oceanTealSoft,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.beach_access, size: 54, color: AppTheme.oceanTeal),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      'No Gokarna Stays Yet',
                      style: GoogleFonts.poppins(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.textDark,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Reserve a beach shack or cliff cottage with a 20% advance lock.',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.poppins(fontSize: 13, color: AppTheme.textMuted),
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: onExplore,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.oceanTeal,
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                      ),
                      child: const Text('Explore Kudle & Om Stays'),
                    ),
                  ],
                ),
              ),
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.all(18),
            itemCount: bookings.length,
            separatorBuilder: (ctx, idx) => const SizedBox(height: 14),
            itemBuilder: (context, index) {
              final b = bookings[index];
              final isConfirmed = b.status == BookingStatus.confirmed;
              final isPending = b.status == BookingStatus.awaitingHost;

              return InkWell(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => HoldTimerScreen(booking: b),
                    ),
                  );
                },
                borderRadius: BorderRadius.circular(24),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.04),
                        blurRadius: 16,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(16),
                            child: Image.network(
                              b.homestay.imageUrls.first,
                              width: 76,
                              height: 76,
                              fit: BoxFit.cover,
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Text(
                                        b.homestay.title,
                                        style: GoogleFonts.poppins(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w700,
                                          color: AppTheme.textDark,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '${b.homestay.location.displayName} • ${b.nights} night(s)',
                                  style: GoogleFonts.poppins(
                                    fontSize: 12,
                                    color: AppTheme.textMuted,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  '${dateFmt.format(b.checkIn)} - ${dateFmt.format(b.checkOut)}',
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
                      const SizedBox(height: 12),
                      const Divider(height: 1),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          // Status Badge
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: isConfirmed
                                  ? const Color(0xFFD8F3ED)
                                  : (isPending ? AppTheme.coralLight : Colors.grey.shade200),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  isConfirmed
                                      ? Icons.check_circle
                                      : (isPending ? Icons.timer : Icons.info_outline),
                                  size: 14,
                                  color: isConfirmed
                                      ? const Color(0xFF1B998B)
                                      : (isPending ? AppTheme.sunsetCoral : Colors.grey.shade700),
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  b.status.label,
                                  style: GoogleFonts.poppins(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: isConfirmed
                                        ? const Color(0xFF1B998B)
                                        : (isPending ? AppTheme.sunsetCoral : Colors.grey.shade700),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Text(
                            currencyFmt.format(b.totalAmount),
                            style: GoogleFonts.poppins(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.textDark,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
