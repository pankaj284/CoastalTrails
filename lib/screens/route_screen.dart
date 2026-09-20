import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../widgets/figma_illustrations.dart';

class RouteScreen extends StatefulWidget {
  final String startLocation;
  final String destination;

  const RouteScreen({
    super.key,
    this.startLocation = 'Kudle Beach Clifftop',
    this.destination = 'Om Beach Rock Formations',
  });

  static Future<void> push(BuildContext context, {String? startLocation, String? destination}) {
    return Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => RouteScreen(
          startLocation: startLocation ?? 'Kudle Beach Clifftop',
          destination: destination ?? 'Om Beach Rock Formations',
        ),
      ),
    );
  }

  @override
  State<RouteScreen> createState() => _RouteScreenState();
}

class _RouteScreenState extends State<RouteScreen> {
  int _selectedModeIndex = 1; // 0: Walking, 1: Scooter/Bike (active in Figma), 2: Car, 3: Bus

  final List<_TransitMode> _modes = const [
    _TransitMode(icon: Icons.directions_walk, time: '120min', label: 'Walking'),
    _TransitMode(icon: Icons.two_wheeler, time: '60min', label: 'Scooter'),
    _TransitMode(icon: Icons.directions_car, time: '45min', label: 'Car/Auto'),
    _TransitMode(icon: Icons.directions_bus, time: '35min', label: 'Bus/Ferry'),
  ];

  void _callDriver() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const CircleAvatar(
                  radius: 26,
                  backgroundColor: Color(0xFFEFF4FF),
                  child: Icon(Icons.person, color: Color(0xFF3354F4), size: 30),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Manjunath Gowda',
                        style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w700),
                      ),
                      Text(
                        'Verified Gokarna Auto • KA-30-A-4120',
                        style: GoogleFonts.poppins(fontSize: 12, color: Colors.grey.shade600),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE8F5E9),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.star, size: 14, color: Colors.green),
                      SizedBox(width: 3),
                      Text('4.9', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.green)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFF7F9FC),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Estimated Fare (${_modes[_selectedModeIndex].time})', style: GoogleFonts.poppins(fontSize: 13, color: Colors.grey.shade700)),
                  Text('₹180', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w800, color: const Color(0xFFFF6339))),
                ],
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton.icon(
                onPressed: () {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Calling Driver Manjunath Gowda (+91 94481 23456)...'),
                      behavior: SnackBarBehavior.floating,
                      backgroundColor: const Color(0xFF3354F4),
                    ),
                  );
                },
                icon: const Icon(Icons.phone, color: Colors.white),
                label: Text('Dial +91 94481 23456', style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.white)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFFF6339),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(26)),
                  elevation: 0,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        automaticallyImplyLeading: false,
        backgroundColor: const Color(0xFF3354F4),
        elevation: 0,
        leading: Navigator.canPop(context)
            ? IconButton(
                icon: const Icon(Icons.arrow_back, color: Colors.white),
                onPressed: () => Navigator.pop(context),
              )
            : null,
        title: Text(
          'Your Route',
          style: GoogleFonts.poppins(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: Colors.white,
          ),
        ),
        centerTitle: true,
      ),
      body: Column(
        children: [
          // 1. Interactive Gokarna Trail Map (Matching Figma Screen 3)
          Expanded(
            flex: 5,
            child: SizedBox(
              width: double.infinity,
              child: CustomPaint(
                painter: FigmaRouteMapPainter(),
              ),
            ),
          ),

          // 2. White Rounded Bottom Sheet (Matching Figma Screen 3)
          Expanded(
            flex: 6,
            child: Container(
              padding: const EdgeInsets.fromLTRB(24, 20, 24, 24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.08),
                    blurRadius: 20,
                    offset: const Offset(0, -6),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Start Point Row
                  Row(
                    children: [
                      Container(
                        width: 38,
                        height: 38,
                        decoration: const BoxDecoration(
                          color: Color(0xFF3354F4),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.directions_walk, color: Colors.white, size: 20),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.startLocation,
                              style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w700, color: const Color(0xFF1E272E)),
                            ),
                            Text(
                              'Starting point • Cliff trail head',
                              style: GoogleFonts.poppins(fontSize: 11, color: Colors.grey.shade500),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),

                  // Distance & Duration Center Row
                  Padding(
                    padding: const EdgeInsets.only(left: 18, top: 4, bottom: 4),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 2,
                          height: 38,
                          color: Colors.grey.shade300,
                        ),
                        const SizedBox(width: 32),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Distance', style: GoogleFonts.poppins(fontSize: 10, color: Colors.grey.shade500)),
                            Text('4,2km', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w800, color: const Color(0xFF1E272E))),
                          ],
                        ),
                        const SizedBox(width: 48),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Time', style: GoogleFonts.poppins(fontSize: 10, color: Colors.grey.shade500)),
                            Text('60min', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w800, color: const Color(0xFF1E272E))),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // Destination Row
                  Row(
                    children: [
                      Container(
                        width: 38,
                        height: 38,
                        decoration: const BoxDecoration(
                          color: Color(0xFFFF6339),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.location_on, color: Colors.white, size: 20),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.destination,
                              style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w700, color: const Color(0xFF1E272E)),
                            ),
                            Text(
                              'Destination • Beachside shack',
                              style: GoogleFonts.poppins(fontSize: 11, color: Colors.grey.shade500),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),

                  const Spacer(),

                  // Transit Modes Row (From Figma Screen 3)
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: List.generate(_modes.length, (idx) {
                      final mode = _modes[idx];
                      final isSelected = idx == _selectedModeIndex;
                      return GestureDetector(
                        onTap: () => setState(() => _selectedModeIndex = idx),
                        child: Container(
                          padding: EdgeInsets.symmetric(horizontal: isSelected ? 10 : 6, vertical: 7),
                          decoration: BoxDecoration(
                            color: isSelected ? const Color(0xFF3354F4) : Colors.transparent,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                mode.icon,
                                size: 16,
                                color: isSelected ? Colors.white : Colors.grey.shade400,
                              ),
                              const SizedBox(width: 5),
                              Text(
                                mode.time,
                                style: GoogleFonts.poppins(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: isSelected ? Colors.white : Colors.grey.shade400,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    }),
                  ),

                  const SizedBox(height: 16),

                  // "Call Driver" Orange Pill Button (From Figma Screen 3)
                  SizedBox(
                    width: double.infinity,
                    height: 54,
                    child: ElevatedButton(
                      onPressed: _callDriver,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFFF6339), // Vibrant Orange from Figma
                        foregroundColor: Colors.white,
                        elevation: 4,
                        shadowColor: const Color(0xFFFF6339).withValues(alpha: 0.4),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(27)),
                      ),
                      child: Text(
                        'Call Driver',
                        style: GoogleFonts.poppins(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _TransitMode {
  final IconData icon;
  final String time;
  final String label;
  const _TransitMode({required this.icon, required this.time, required this.label});
}
