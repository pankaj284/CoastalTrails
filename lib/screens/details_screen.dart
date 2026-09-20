import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../theme/app_theme.dart';
import '../models/homestay.dart';
import '../services/auth_state.dart';
import '../widgets/auth_bottom_sheet.dart';
import '../widgets/booking_modal.dart';
import 'route_screen.dart';

class DetailsScreen extends StatefulWidget {
  final Homestay homestay;
  final DateTime? initialCheckIn;
  final DateTime? initialCheckOut;

  const DetailsScreen({
    super.key,
    required this.homestay,
    this.initialCheckIn,
    this.initialCheckOut,
  });

  @override
  State<DetailsScreen> createState() => _DetailsScreenState();
}

class _DetailsScreenState extends State<DetailsScreen> {
  int _activeImageIndex = 0;
  late DateTime _checkIn;
  late DateTime _checkOut;

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

  void _onReserveTapped() {
    if (!_isAvailable) {
      _selectDates();
      return;
    }

    if (AuthState().isLoggedIn) {
      BookingModal.show(context, widget.homestay, initialCheckIn: _checkIn, initialCheckOut: _checkOut);
    } else {
      AuthBottomSheet.show(
        context,
        onAuthenticated: () {
          BookingModal.show(context, widget.homestay, initialCheckIn: _checkIn, initialCheckOut: _checkOut);
        },
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final stay = widget.homestay;
    final currencyFmt = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);
    final dateFmt = DateFormat('dd MMM');

    final totalTariff = stay.pricePerNight * _nights;
    final advanceDeposit = totalTariff * 0.20;

    return Scaffold(
      backgroundColor: Colors.white,
      body: CustomScrollView(
        slivers: [
          // Collapsible Image Header with Hero Slider
          SliverAppBar(
            expandedHeight: 320,
            pinned: true,
            backgroundColor: AppTheme.oceanTeal,
            leading: Padding(
              padding: const EdgeInsets.all(8.0),
              child: CircleAvatar(
                backgroundColor: Colors.white.withValues(alpha: 0.85),
                child: IconButton(
                  icon: const Icon(Icons.arrow_back_ios_new, size: 16, color: AppTheme.textDark),
                  onPressed: () => Navigator.pop(context),
                ),
              ),
            ),
            actions: [
              Padding(
                padding: const EdgeInsets.all(8.0),
                child: CircleAvatar(
                  backgroundColor: Colors.white.withValues(alpha: 0.9),
                  child: IconButton(
                    icon: const Icon(Icons.favorite_border, size: 20, color: AppTheme.sunsetCoral),
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('${stay.title} saved to favorites!'),
                          duration: const Duration(seconds: 2),
                          behavior: SnackBarBehavior.floating,
                        ),
                      );
                    },
                  ),
                ),
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  PageView.builder(
                    itemCount: stay.imageUrls.length,
                    onPageChanged: (i) => setState(() => _activeImageIndex = i),
                    itemBuilder: (context, index) {
                      return Image.network(
                        stay.imageUrls[index],
                        fit: BoxFit.cover,
                        errorBuilder: (ctx, err, stack) => Container(
                          color: AppTheme.oceanTealSoft,
                          child: const Icon(Icons.beach_access, size: 64, color: AppTheme.oceanTeal),
                        ),
                      );
                    },
                  ),
                  // Gradient Vignette
                  Positioned(
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 80,
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.bottomCenter,
                          end: Alignment.topCenter,
                          colors: [Colors.black.withValues(alpha: 0.5), Colors.transparent],
                        ),
                      ),
                    ),
                  ),
                  // Dots Indicator
                  Positioned(
                    bottom: 16,
                    left: 0,
                    right: 0,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(
                        stay.imageUrls.length,
                        (idx) => Container(
                          width: idx == _activeImageIndex ? 18 : 6,
                          height: 6,
                          margin: const EdgeInsets.symmetric(horizontal: 3),
                          decoration: BoxDecoration(
                            color: idx == _activeImageIndex ? Colors.white : Colors.white.withValues(alpha: 0.5),
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Content Body
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(22),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title & Golden Price Row (Reference Image Screen 3)
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              stay.title,
                              style: GoogleFonts.poppins(
                                fontSize: 22,
                                fontWeight: FontWeight.w800,
                                color: AppTheme.textDark,
                                height: 1.2,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: AppTheme.oceanTealSoft,
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.location_on, size: 12, color: AppTheme.oceanTeal),
                                      const SizedBox(width: 3),
                                      Text(
                                        stay.location.displayName,
                                        style: GoogleFonts.poppins(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w700,
                                          color: AppTheme.oceanTeal,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 8),
                                const Icon(Icons.star, color: Colors.amber, size: 15),
                                const SizedBox(width: 3),
                                Text(
                                  '${stay.rating}',
                                  style: GoogleFonts.poppins(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                    color: AppTheme.textDark,
                                  ),
                                ),
                                Text(
                                  ' (${stay.reviewsCount})',
                                  style: GoogleFonts.poppins(fontSize: 11, color: AppTheme.textMuted),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            currencyFmt.format(stay.pricePerNight),
                            style: GoogleFonts.poppins(
                              fontSize: 22,
                              fontWeight: FontWeight.w800,
                              color: const Color(0xFFF39C12), // Warm golden orange from reference
                            ),
                          ),
                          Text(
                            '/ night',
                            style: GoogleFonts.poppins(
                              fontSize: 12,
                              color: AppTheme.textMuted,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    stay.subtitle,
                    style: GoogleFonts.poppins(
                      fontSize: 13,
                      color: AppTheme.textMuted,
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Date Selection & Room Availability Banner Card
                  InkWell(
                    onTap: _selectDates,
                    borderRadius: BorderRadius.circular(20),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: _isAvailable ? const Color(0xFFEFF9F6) : AppTheme.coralLight,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: _isAvailable ? const Color(0xFF1B998B) : AppTheme.sunsetCoral,
                          width: 1.4,
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  Icon(
                                    Icons.calendar_month,
                                    size: 18,
                                    color: _isAvailable ? const Color(0xFF1B998B) : AppTheme.sunsetCoral,
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    '${dateFmt.format(_checkIn)} - ${dateFmt.format(_checkOut)} ($_nights night${_nights > 1 ? 's' : ''})',
                                    style: GoogleFonts.poppins(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w700,
                                      color: AppTheme.textDark,
                                    ),
                                  ),
                                ],
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  'Change Dates',
                                  style: GoogleFonts.poppins(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: AppTheme.oceanTeal,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              Icon(
                                _isAvailable ? Icons.check_circle : Icons.cancel,
                                size: 16,
                                color: _isAvailable ? const Color(0xFF1B998B) : AppTheme.sunsetCoral,
                              ),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  _isAvailable
                                      ? 'Available! $_roomsLeft of ${stay.totalRooms} rooms free for selected dates.'
                                      : 'Sold out for these specific dates. Tap "Change Dates" to pick available days.',
                                  style: GoogleFonts.poppins(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: _isAvailable ? const Color(0xFF1B998B) : AppTheme.sunsetCoral,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Walking Distance Highlight & Route Navigation
                  InkWell(
                    onTap: () => RouteScreen.push(
                      context,
                      startLocation: 'Kudle Beach Clifftop',
                      destination: stay.title,
                    ),
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEFF4FF),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFD0DCFE)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.directions_walk, color: Color(0xFF3354F4), size: 20),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              '${stay.walkingMinutesToBeach} min trail walk • Tap to view route & transit',
                              style: GoogleFonts.poppins(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: const Color(0xFF3354F4),
                              ),
                            ),
                          ),
                          const Icon(Icons.arrow_forward_ios, size: 12, color: Color(0xFF3354F4)),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Verified Host Card
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppTheme.oceanTealSoft,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 24,
                          backgroundColor: AppTheme.oceanTeal,
                          child: Text(
                            stay.hostName[0],
                            style: GoogleFonts.poppins(
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                              fontSize: 18,
                            ),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    stay.hostName,
                                    style: GoogleFonts.poppins(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w700,
                                      color: AppTheme.textDark,
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  const Icon(Icons.verified, color: AppTheme.oceanTeal, size: 16),
                                ],
                              ),
                              Text(
                                'Verified Gokarna Host • WhatsApp Automated Approval',
                                style: GoogleFonts.poppins(
                                  fontSize: 11,
                                  color: AppTheme.oceanTeal,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 22),

                  // Verified Badges Chips
                  Text(
                    'Verified Badges',
                    style: GoogleFonts.poppins(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.textDark,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: stay.verifiedBadges.map((badge) {
                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFF7E6),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFFFD591)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.check_circle, color: Color(0xFFFA8C16), size: 14),
                            const SizedBox(width: 6),
                            Text(
                              badge,
                              style: GoogleFonts.poppins(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: const Color(0xFFD46B08),
                              ),
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 22),

                  // About Stay
                  Text(
                    'About this Stay',
                    style: GoogleFonts.poppins(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.textDark,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    stay.description,
                    style: GoogleFonts.poppins(
                      fontSize: 13,
                      height: 1.5,
                      color: AppTheme.textDark.withValues(alpha: 0.8),
                    ),
                  ),
                  const SizedBox(height: 22),

                  // Amenities Grid
                  Text(
                    'Amenities & Features',
                    style: GoogleFonts.poppins(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.textDark,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Column(
                    children: stay.amenities.map((item) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: AppTheme.oceanTealSoft,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.check, size: 14, color: AppTheme.oceanTeal),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                item,
                                style: GoogleFonts.poppins(fontSize: 13, color: AppTheme.textDark),
                              ),
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 90),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomSheet: Container(
        padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 18,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: SafeArea(
          child: Row(
            children: [
              Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        currencyFmt.format(stay.pricePerNight),
                        style: GoogleFonts.poppins(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.oceanTeal,
                        ),
                      ),
                      Text(
                        ' / night',
                        style: GoogleFonts.poppins(fontSize: 12, color: AppTheme.textMuted),
                      ),
                    ],
                  ),
                  Text(
                    _isAvailable
                        ? 'Pay ${currencyFmt.format(advanceDeposit)} advance for $_nights night(s)'
                        : 'Dates unavailable',
                    style: GoogleFonts.poppins(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: _isAvailable ? AppTheme.sunsetCoral : Colors.grey,
                    ),
                  ),
                ],
              ),
              const Spacer(),
              ElevatedButton(
                onPressed: _onReserveTapped,
                style: ElevatedButton.styleFrom(
                  backgroundColor: _isAvailable ? const Color(0xFFFF6339) : Colors.grey.shade400,
                  padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                  elevation: 0,
                ),
                child: Row(
                  children: [
                    Text(
                      _isAvailable ? 'Book Now' : 'Change Dates',
                      style: GoogleFonts.poppins(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                        letterSpacing: 0.3,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Icon(
                      _isAvailable ? Icons.arrow_forward_rounded : Icons.edit_calendar,
                      size: 16,
                      color: Colors.white,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
