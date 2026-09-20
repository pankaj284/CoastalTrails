import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../theme/app_theme.dart';
import '../models/homestay.dart';
import '../models/booking.dart';
import '../services/auth_state.dart';
import '../screens/hold_timer_screen.dart';

class BookingModal extends StatefulWidget {
  final Homestay homestay;
  final DateTime? initialCheckIn;
  final DateTime? initialCheckOut;

  const BookingModal({
    super.key,
    required this.homestay,
    this.initialCheckIn,
    this.initialCheckOut,
  });

  static Future<void> show(
    BuildContext context,
    Homestay homestay, {
    DateTime? initialCheckIn,
    DateTime? initialCheckOut,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => BookingModal(
        homestay: homestay,
        initialCheckIn: initialCheckIn,
        initialCheckOut: initialCheckOut,
      ),
    );
  }

  @override
  State<BookingModal> createState() => _BookingModalState();
}

class _BookingModalState extends State<BookingModal> {
  late DateTime _checkIn;
  late DateTime _checkOut;
  int _guests = 2;
  bool _isProcessing = false;

  @override
  void initState() {
    super.initState();
    _checkIn = widget.initialCheckIn ?? DateTime.now().add(const Duration(days: 1));
    _checkOut = widget.initialCheckOut ?? DateTime.now().add(const Duration(days: 3));
  }

  int get _nights => _checkOut.difference(_checkIn).inDays > 0
      ? _checkOut.difference(_checkIn).inDays
      : 1;

  bool get _isAvailable => widget.homestay.isAvailableForRange(_checkIn, _checkOut);
  int get _roomsLeft => widget.homestay.availableRoomsOn(_checkIn, _checkOut);

  double get _totalTariff => widget.homestay.pricePerNight * _nights;
  double get _advanceDeposit => _totalTariff * 0.20; // 20% advance
  double get _balancePayable => _totalTariff * 0.80; // 80% at check-in

  void _selectDates() async {
    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 90)),
      initialDateRange: DateTimeRange(start: _checkIn, end: _checkOut),
      builder: (context, child) {
        return Theme(
          data: ThemeData.light().copyWith(
            colorScheme: const ColorScheme.light(
              primary: AppTheme.oceanTeal,
              onPrimary: Colors.white,
              surface: Colors.white,
              onSurface: AppTheme.textDark,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        _checkIn = picked.start;
        _checkOut = picked.end;
      });
    }
  }

  void _confirmAndLock() {
    if (!_isAvailable) return;

    setState(() => _isProcessing = true);

    Future.delayed(const Duration(milliseconds: 900), () {
      final code = 'GK-${DateTime.now().millisecondsSinceEpoch.toString().substring(8)}';
      final newBooking = Booking(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        referenceCode: code,
        homestay: widget.homestay,
        checkIn: _checkIn,
        checkOut: _checkOut,
        guestsCount: _guests,
        totalAmount: _totalTariff,
        advancePaid: _advanceDeposit,
        balancePayableAtProperty: _balancePayable,
        status: BookingStatus.awaitingHost,
        createdAt: DateTime.now(),
        holdExpiresAt: DateTime.now().add(const Duration(minutes: 15)),
      );

      AuthState().addBooking(newBooking);

      if (mounted) {
        Navigator.pop(context); // close modal
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => HoldTimerScreen(booking: newBooking),
          ),
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final dateFmt = DateFormat('dd MMM yyyy');
    final currencyFmt = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

    return Container(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 28,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(36)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 48,
              height: 5,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
          const SizedBox(height: 18),

          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Lock Your Dates',
                    style: GoogleFonts.poppins(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.textDark,
                    ),
                  ),
                  Text(
                    widget.homestay.title,
                    style: GoogleFonts.poppins(fontSize: 12, color: AppTheme.textMuted),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppTheme.oceanTealSoft,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${currencyFmt.format(widget.homestay.pricePerNight)}/night',
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.oceanTeal,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Date Selector Card
          InkWell(
            onTap: _selectDates,
            borderRadius: BorderRadius.circular(20),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: _isAvailable ? AppTheme.surfaceMuted : AppTheme.coralLight,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: _isAvailable ? AppTheme.borderSubtle : AppTheme.sunsetCoral,
                  width: 1.4,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.calendar_month,
                    color: _isAvailable ? AppTheme.oceanTeal : AppTheme.sunsetCoral,
                    size: 22,
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${dateFmt.format(_checkIn)}  →  ${dateFmt.format(_checkOut)}',
                          style: GoogleFonts.poppins(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.textDark,
                          ),
                        ),
                        Text(
                          _isAvailable
                              ? '$_nights night(s) selected • $_roomsLeft rooms available'
                              : '⚠️ Fully booked on these dates (Tap to change)',
                          style: GoogleFonts.poppins(
                            fontSize: 11,
                            fontWeight: _isAvailable ? FontWeight.w400 : FontWeight.w600,
                            color: _isAvailable ? AppTheme.textMuted : AppTheme.sunsetCoral,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Icon(
                    Icons.edit_outlined,
                    size: 16,
                    color: _isAvailable ? AppTheme.oceanTeal : AppTheme.sunsetCoral,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),

          // Guests Selector
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: AppTheme.surfaceMuted,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppTheme.borderSubtle),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.group_outlined, color: AppTheme.oceanTeal, size: 22),
                    const SizedBox(width: 14),
                    Text(
                      'Guests',
                      style: GoogleFonts.poppins(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textDark,
                      ),
                    ),
                  ],
                ),
                Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.remove_circle_outline, color: AppTheme.oceanTeal, size: 22),
                      onPressed: _guests > 1 ? () => setState(() => _guests--) : null,
                    ),
                    Text(
                      '$_guests',
                      style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w700),
                    ),
                    IconButton(
                      icon: const Icon(Icons.add_circle_outline, color: AppTheme.oceanTeal, size: 22),
                      onPressed: _guests < 6 ? () => setState(() => _guests++) : null,
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),

          // Pricing Breakdown Box
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.oceanTealSoft.withValues(alpha: 0.5),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppTheme.borderSubtle),
            ),
            child: Column(
              children: [
                _buildFeeLine(
                  'Total Tariff (${_nights}n × ${currencyFmt.format(widget.homestay.pricePerNight)})',
                  currencyFmt.format(_totalTariff),
                ),
                const SizedBox(height: 8),
                _buildFeeLine(
                  '20% Advance Online Deposit',
                  currencyFmt.format(_advanceDeposit),
                  highlight: true,
                  note: 'Locks room for 15 mins via WhatsApp ping to host',
                ),
                const Divider(height: 18),
                _buildFeeLine(
                  'Pay at Property Check-in',
                  currencyFmt.format(_balancePayable),
                  note: 'Remaining balance paid directly to host in cash/UPI',
                ),
              ],
            ),
          ),
          const SizedBox(height: 22),

          // Lock Button
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: (_isProcessing || !_isAvailable) ? null : _confirmAndLock,
              style: ElevatedButton.styleFrom(
                backgroundColor: _isAvailable ? AppTheme.sunsetCoral : Colors.grey.shade400,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
              ),
              child: _isProcessing
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                    )
                  : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          _isAvailable
                              ? 'Authorize ${currencyFmt.format(_advanceDeposit)} & Lock Stay'
                              : 'Select Available Dates to Book',
                          style: GoogleFonts.poppins(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Icon(
                          _isAvailable ? Icons.arrow_forward : Icons.calendar_today,
                          size: 18,
                          color: Colors.white,
                        ),
                      ],
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFeeLine(String label, String amount, {bool highlight = false, String? note}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: GoogleFonts.poppins(
                fontSize: 12,
                fontWeight: highlight ? FontWeight.w700 : FontWeight.w500,
                color: highlight ? AppTheme.oceanTeal : AppTheme.textDark,
              ),
            ),
            Text(
              amount,
              style: GoogleFonts.poppins(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: highlight ? AppTheme.oceanTeal : AppTheme.textDark,
              ),
            ),
          ],
        ),
        if (note != null) ...[
          const SizedBox(height: 2),
          Text(
            note,
            style: GoogleFonts.poppins(fontSize: 10, color: AppTheme.textMuted),
          ),
        ],
      ],
    );
  }
}
