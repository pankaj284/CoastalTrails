import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../theme/app_theme.dart';
import '../models/homestay.dart';
import '../services/mock_data.dart';
import '../services/auth_state.dart';
import 'details_screen.dart';
import 'login_screen.dart';
import '../widgets/figma_illustrations.dart';

class HomeScreen extends StatefulWidget {
  final VoidCallback onOpenOnboarding;
  const HomeScreen({super.key, required this.onOpenOnboarding});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  BeachLocation? _selectedLocation;
  String _searchQuery = '';
  int _activeHeroCardIndex = 0;

  DateTime _checkIn = DateTime.now().add(const Duration(days: 1));
  DateTime _checkOut = DateTime.now().add(const Duration(days: 3));

  RangeValues _priceRange = const RangeValues(1000, 2500);
  bool _onlyAvailableForDates = false;

  List<Homestay> get _filteredHomestays {
    return MockData.homestays.where((stay) {
      final matchesLocation = _selectedLocation == null || stay.location == _selectedLocation;
      final matchesSearch = _searchQuery.isEmpty ||
          stay.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          stay.subtitle.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          stay.amenities.any((a) => a.toLowerCase().contains(_searchQuery.toLowerCase()));
      final matchesPrice =
          stay.pricePerNight >= _priceRange.start && stay.pricePerNight <= _priceRange.end;
      final matchesAvailability = !_onlyAvailableForDates || stay.isAvailableForRange(_checkIn, _checkOut);

      return matchesLocation && matchesSearch && matchesPrice && matchesAvailability;
    }).toList();
  }

  Future<void> _selectDates() async {
    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 90)),
      initialDateRange: DateTimeRange(start: _checkIn, end: _checkOut),
      builder: (context, child) {
        return Theme(
          data: ThemeData.light().copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFF3354F4),
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

  void _showFilterSliderSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            final currencyFmt = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

            return Container(
              padding: const EdgeInsets.all(24),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
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
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Filter Stays',
                        style: GoogleFonts.poppins(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.textDark,
                        ),
                      ),
                      TextButton(
                        onPressed: () {
                          setSheetState(() {
                            _priceRange = const RangeValues(1000, 2500);
                            _onlyAvailableForDates = false;
                          });
                          setState(() {});
                        },
                        child: Text(
                          'Reset',
                          style: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFF3354F4)),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Nightly Budget',
                        style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600),
                      ),
                      Text(
                        '${currencyFmt.format(_priceRange.start)} - ${currencyFmt.format(_priceRange.end)}',
                        style: GoogleFonts.poppins(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF3354F4),
                        ),
                      ),
                    ],
                  ),
                  RangeSlider(
                    values: _priceRange,
                    min: 800,
                    max: 3500,
                    divisions: 27,
                    activeColor: const Color(0xFF3354F4),
                    inactiveColor: Colors.grey.shade200,
                    onChanged: (values) {
                      setSheetState(() => _priceRange = values);
                      setState(() {});
                    },
                  ),
                  const SizedBox(height: 10),
                  SwitchListTile(
                    title: Text(
                      'Show only available rooms',
                      style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600),
                    ),
                    subtitle: Text(
                      'For ${DateFormat('dd MMM').format(_checkIn)} - ${DateFormat('dd MMM').format(_checkOut)}',
                      style: GoogleFonts.poppins(fontSize: 11, color: AppTheme.textMuted),
                    ),
                    value: _onlyAvailableForDates,
                    activeThumbColor: const Color(0xFF3354F4),
                    contentPadding: EdgeInsets.zero,
                    onChanged: (val) {
                      setSheetState(() => _onlyAvailableForDates = val);
                      setState(() {});
                    },
                  ),
                  const SizedBox(height: 10),
                  InkWell(
                    onTap: () async {
                      await _selectDates();
                      setSheetState(() {});
                    },
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEFF4FF),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFD0DCFE)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.calendar_month_outlined, size: 16, color: Color(0xFF3354F4)),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Travel Dates: ${DateFormat('dd MMM').format(_checkIn)} – ${DateFormat('dd MMM').format(_checkOut)}',
                              style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF3354F4)),
                            ),
                          ),
                          Text('Change', style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w700, color: const Color(0xFF3354F4))),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(ctx),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF3354F4),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                      ),
                      child: Text(
                        'Show ${_filteredHomestays.length} Stays',
                        style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final currencyFmt = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: ListenableBuilder(
          listenable: AuthState(),
          builder: (context, _) {
            final auth = AuthState();
            final userName = auth.isLoggedIn ? (auth.userName ?? 'Traveler') : 'Traveler';

            return GestureDetector(
              onTap: () => FocusScope.of(context).unfocus(),
              behavior: HitTestBehavior.opaque,
              child: CustomScrollView(
              slivers: [
                // 1. TOP HEADER (Matches Image 2 Screen 2 & Image 1 Screen 2)
                // 1. FIGMA HEADER (Matches Figma Artboard 2: "Hi Angela!" + Avatar + Bell)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(24, 20, 24, 16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        // Left: User Avatar + Greeting
                        Row(
                          children: [
                            GestureDetector(
                              onTap: () {
                                if (auth.isLoggedIn) {
                                  // Open profile
                                } else {
                                  LoginScreen.push(context, onAuthenticated: () => setState(() {}));
                                }
                              },
                              child: Container(
                                padding: const EdgeInsets.all(2.5),
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(color: const Color(0xFF3354F4), width: 2), // Royal blue ring
                                ),
                                child: CircleAvatar(
                                  radius: 20,
                                  backgroundColor: const Color(0xFFEFF4FF),
                                  child: Text(
                                    userName.isNotEmpty ? userName[0].toUpperCase() : 'A',
                                    style: GoogleFonts.poppins(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w700,
                                      color: const Color(0xFF3354F4),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Text(
                              'Hi ${userName.isNotEmpty ? userName : 'Angela'}!',
                              style: GoogleFonts.poppins(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: const Color(0xFF1E272E),
                              ),
                            ),
                          ],
                        ),
                        // Right: Notification Bell (From Figma Screen 2)
                        Container(
                          width: 42,
                          height: 42,
                          decoration: BoxDecoration(
                            color: const Color(0xFFF1F3F6),
                            shape: BoxShape.circle,
                          ),
                          child: Stack(
                            alignment: Alignment.center,
                            children: [
                              const Icon(Icons.notifications_none_rounded, color: Color(0xFF57606F), size: 22),
                              Positioned(
                                top: 10,
                                right: 11,
                                child: Container(
                                  width: 7,
                                  height: 7,
                                  decoration: const BoxDecoration(
                                    color: Color(0xFFFF6339),
                                    shape: BoxShape.circle,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // 2. FIGMA PILL SEARCH BAR (Clean pill with Orange Search Button)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 6),
                    child: Container(
                      decoration: BoxDecoration(
                        color: const Color(0xFFF6F8FB),
                        borderRadius: BorderRadius.circular(28),
                        border: Border.all(color: const Color(0xFFE5E9F0)),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 3),
                      child: Row(
                        children: [
                          Expanded(
                            child: TextField(
                              onChanged: (val) => setState(() => _searchQuery = val),
                              style: GoogleFonts.poppins(fontSize: 14, color: const Color(0xFF1E272E)),
                              decoration: InputDecoration(
                                hintText: 'Search',
                                hintStyle: GoogleFonts.poppins(fontSize: 14, color: const Color(0xFFA4B0BE)),
                                border: InputBorder.none,
                                enabledBorder: InputBorder.none,
                                focusedBorder: InputBorder.none,
                                filled: false,
                                contentPadding: const EdgeInsets.symmetric(vertical: 12),
                              ),
                            ),
                          ),
                          // Vibrant Orange Search Action Button from Figma Screen 2
                          InkWell(
                            onTap: _showFilterSliderSheet,
                            child: Container(
                              padding: const EdgeInsets.all(9),
                              decoration: const BoxDecoration(
                                color: Color(0xFFFF6339), // Orange from Figma
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.search, color: Colors.white, size: 18),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

                // 3. FIGMA CATEGORY TABS (Beaches, Mountains, Lakes, Forests)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.only(top: 8, bottom: 4),
                    child: SizedBox(
                      height: 38,
                      child: ListView(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        children: [
                          _buildFigmaCategoryTab('Beaches', _selectedLocation == null || _selectedLocation == BeachLocation.kudle, () {
                            setState(() => _selectedLocation = null);
                          }),
                          _buildFigmaCategoryTab('Mountains', _selectedLocation == BeachLocation.om, () {
                            setState(() => _selectedLocation = BeachLocation.om);
                          }),
                          _buildFigmaCategoryTab('Lakes', _selectedLocation == BeachLocation.halfMoon, () {
                            setState(() => _selectedLocation = BeachLocation.halfMoon);
                          }),
                          _buildFigmaCategoryTab('Forests', _selectedLocation == BeachLocation.paradise, () {
                            setState(() => _selectedLocation = BeachLocation.paradise);
                          }),
                        ],
                      ),
                    ),
                  ),
                ),

                // 4. FIGMA HORIZONTAL DESTINATION CAROUSEL (Screen 2 Artboard Hero Slider)
                SliverToBoxAdapter(
                  child: Column(
                    children: [
                      const SizedBox(height: 12),
                      SizedBox(
                        height: 290,
                        child: PageView(
                          controller: PageController(viewportFraction: 0.86),
                          onPageChanged: (i) => setState(() => _activeHeroCardIndex = i),
                          children: [
                            Padding(
                              padding: const EdgeInsets.only(right: 12),
                              child: FigmaBeachVanCard(
                                title: 'Kudle Beachfront Cabin',
                                subtitle: 'Direct beach access & cliff trail walk',
                                rating: 4.5,
                                onTap: () {
                                  if (MockData.homestays.isNotEmpty) {
                                    _openDetails(MockData.homestays[0]);
                                  }
                                },
                              ),
                            ),
                            Padding(
                              padding: const EdgeInsets.only(right: 12),
                              child: FigmaResortCard(
                                title: 'Om Beach Cliff Villa',
                                subtitle: 'Panoramic Arabian sea cliff view',
                                rating: 4.8,
                                onTap: () {
                                  if (MockData.homestays.length > 1) {
                                    _openDetails(MockData.homestays[1]);
                                  }
                                },
                              ),
                            ),
                            Padding(
                              padding: const EdgeInsets.only(right: 12),
                              child: FigmaBeachVanCard(
                                title: 'Paradise Beach Eco Shack',
                                subtitle: 'Zero-footprint hammock stay & stars',
                                rating: 4.9,
                                onTap: () {
                                  if (MockData.homestays.length > 2) {
                                    _openDetails(MockData.homestays[2]);
                                  }
                                },
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),
                      // Figma Page Indicator (— • •)
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(3, (idx) {
                          final isActive = idx == _activeHeroCardIndex;
                          return AnimatedContainer(
                            duration: const Duration(milliseconds: 250),
                            margin: const EdgeInsets.symmetric(horizontal: 3),
                            width: isActive ? 22 : 6,
                            height: 4.5,
                            decoration: BoxDecoration(
                              color: isActive ? const Color(0xFF1E272E) : const Color(0xFFE2E8F0),
                              borderRadius: BorderRadius.circular(3),
                            ),
                          );
                        }),
                      ),
                    ],
                  ),
                ),

                // 5. SECTION: RECOMMENDED | VIEW ALL (Matches Image 2 Screen 2)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(24, 24, 24, 14),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Recommended',
                          style: GoogleFonts.poppins(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFF1B2834),
                          ),
                        ),
                        InkWell(
                          onTap: () => setState(() {
                            _selectedLocation = null;
                            _searchQuery = '';
                          }),
                          child: Text(
                            'View All',
                            style: GoogleFonts.poppins(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFFF5A623),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // 6. TWO-COLUMN GRID CARDS (Matches Image 2 Screen 2 Exactly!)
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  sliver: SliverGrid(
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 14,
                      mainAxisSpacing: 16,
                      childAspectRatio: 0.72,
                    ),
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final stay = _filteredHomestays[index];
                        final isAvailable = stay.isAvailableForRange(_checkIn, _checkOut);

                        return InkWell(
                          onTap: () => _openDetails(stay),
                          borderRadius: BorderRadius.circular(24),
                          child: Container(
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(24),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.04),
                                  blurRadius: 10,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Photo Card with Tag & Rating
                                Expanded(
                                  child: Stack(
                                    fit: StackFit.expand,
                                    children: [
                                      ClipRRect(
                                        borderRadius: BorderRadius.circular(22),
                                        child: Image.network(
                                          stay.imageUrls.first,
                                          fit: BoxFit.cover,
                                          errorBuilder: (context, error, stackTrace) => Container(
                                            color: const Color(0xFFEFF4FF),
                                            child: const Icon(Icons.beach_access, color: Color(0xFF3354F4), size: 32),
                                          ),
                                        ),
                                      ),
                                      // Top Location Pill
                                      Positioned(
                                        top: 10,
                                        left: 10,
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: Colors.black.withValues(alpha: 0.45),
                                            borderRadius: BorderRadius.circular(10),
                                          ),
                                          child: Text(
                                            stay.location.displayName,
                                            style: GoogleFonts.poppins(
                                              fontSize: 10,
                                              fontWeight: FontWeight.w600,
                                              color: Colors.white,
                                            ),
                                          ),
                                        ),
                                      ),
                                      // Bottom Availability Tag
                                      if (!isAvailable)
                                        Positioned(
                                          bottom: 10,
                                          left: 10,
                                          child: Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFFFF6339),
                                              borderRadius: BorderRadius.circular(8),
                                            ),
                                            child: Text(
                                              'Sold out',
                                              style: GoogleFonts.poppins(
                                                fontSize: 9,
                                                fontWeight: FontWeight.w700,
                                                color: Colors.white,
                                              ),
                                            ),
                                          ),
                                        ),
                                    ],
                                  ),
                                ),
                                // Text Information
                                Padding(
                                  padding: const EdgeInsets.fromLTRB(10, 10, 10, 12),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        stay.title,
                                        style: GoogleFonts.poppins(
                                          fontSize: 12.5,
                                          fontWeight: FontWeight.w700,
                                          color: const Color(0xFF1E272E),
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(height: 3),
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(
                                            currencyFmt.format(stay.pricePerNight),
                                            style: GoogleFonts.poppins(
                                              fontSize: 13,
                                              fontWeight: FontWeight.w800,
                                              color: const Color(0xFF3354F4),
                                            ),
                                          ),
                                          Row(
                                            children: [
                                              const Icon(Icons.star, color: Color(0xFFFFA000), size: 13),
                                              const SizedBox(width: 2),
                                              Text(
                                                '${stay.rating}',
                                                style: GoogleFonts.poppins(
                                                  fontSize: 11,
                                                  fontWeight: FontWeight.w600,
                                                  color: const Color(0xFF8A98A5),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                      childCount: _filteredHomestays.length,
                    ),
                  ),
                ),
                const SliverToBoxAdapter(child: SizedBox(height: 28)),
              ],
            ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildFigmaCategoryTab(String title, bool isSelected, VoidCallback onTap) {
    return Padding(
      padding: const EdgeInsets.only(right: 16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
          child: Text(
            title,
            style: GoogleFonts.poppins(
              fontSize: 14,
              fontWeight: isSelected ? FontWeight.w800 : FontWeight.w500,
              color: isSelected ? const Color(0xFF1E272E) : const Color(0xFFA4B0BE),
            ),
          ),
        ),
      ),
    );
  }

  void _openDetails(Homestay stay) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => DetailsScreen(
          homestay: stay,
          initialCheckIn: _checkIn,
          initialCheckOut: _checkOut,
        ),
      ),
    );
  }
}
