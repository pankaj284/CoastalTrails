import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// 1. Figma Artboard 1: "Where do you want to go ?" Traveler Holding Open Map Hero
class FigmaMapTravelerHero extends StatelessWidget {
  final VoidCallback onGetStarted;

  const FigmaMapTravelerHero({super.key, required this.onGetStarted});

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
        statusBarBrightness: Brightness.dark,
      ),
      child: Container(
        color: const Color(0xFF3354F4), // Royal cobalt blue from Figma
        child: SafeArea(
        child: Column(
          children: [
            const SizedBox(height: 24),
            // Header Title from Figma Screen 1
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'Where do\nyou want\nto go ?',
                  style: const TextStyle(
                    fontFamily: 'Poppins',
                    fontSize: 34,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                    height: 1.15,
                    letterSpacing: -0.5,
                  ),
                ),
              ),
            ),
            // Expanded Canvas with Vector Traveler holding open map
            Expanded(
              child: LayoutBuilder(
                builder: (context, constraints) {
                  return CustomPaint(
                    size: Size(constraints.maxWidth, constraints.maxHeight),
                    painter: _MapTravelerPainter(),
                  );
                },
              ),
            ),
            // "Get Started" Pill Button from Figma Screen 1
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 24),
              child: SizedBox(
                width: double.infinity,
                height: 54,
                child: OutlinedButton(
                  onPressed: onGetStarted,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: Colors.white, width: 2),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(28),
                    ),
                    backgroundColor: Colors.white.withValues(alpha: 0.12),
                    elevation: 0,
                  ),
                  child: const Text(
                    'Get Started',
                    style: TextStyle(
                      fontFamily: 'Poppins',
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    ),
    );
  }
}

class _MapTravelerPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // 1. Clouds & Stars in the Sky
    final cloudPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.95)
      ..style = PaintingStyle.fill;

    // Top left cloud
    canvas.drawCircle(Offset(w * 0.12, h * 0.08), 28, cloudPaint);
    canvas.drawCircle(Offset(w * 0.22, h * 0.06), 38, cloudPaint);
    canvas.drawCircle(Offset(w * 0.32, h * 0.09), 24, cloudPaint);

    // Right cloud
    canvas.drawCircle(Offset(w * 0.88, h * 0.22), 34, cloudPaint);
    canvas.drawCircle(Offset(w * 0.78, h * 0.24), 26, cloudPaint);

    // Twinkling 4-point stars
    _drawStar(canvas, Offset(w * 0.85, h * 0.12), 8, Colors.white);
    _drawStar(canvas, Offset(w * 0.88, h * 0.38), 10, Colors.white);
    _drawStar(canvas, Offset(w * 0.25, h * 0.40), 6, Colors.white);
    _drawStar(canvas, Offset(w * 0.10, h * 0.28), 7, Colors.white);

    // 2. Dashed Route Lines in Sky connecting map pins
    final dashPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.6)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;

    final routePath = Path()
      ..moveTo(w * 0.22, h * 0.32)
      ..cubicTo(w * 0.35, h * 0.22, w * 0.42, h * 0.42, w * 0.55, h * 0.30)
      ..cubicTo(w * 0.65, h * 0.20, w * 0.72, h * 0.36, w * 0.80, h * 0.32);
    canvas.drawPath(routePath, dashPaint);

    // Floating location pins in sky
    _drawPin(canvas, Offset(w * 0.22, h * 0.30), 16, Colors.white, const Color(0xFF1E3BB8));
    _drawPin(canvas, Offset(w * 0.80, h * 0.30), 14, const Color(0xFFFFB800), Colors.white);

    // 3. Traveler's Open Folded Map (Origami map panels)
    final mapCenterY = h * 0.70;
    final mapWidth = w * 0.84;
    final mapHeight = h * 0.42;
    final mapLeft = (w - mapWidth) / 2;
    final mapTop = mapCenterY - (mapHeight * 0.4);

    final mapBgPaint = Paint()
      ..color = const Color(0xFFF4F8FC)
      ..style = PaintingStyle.fill;
    final mapBorderPaint = Paint()
      ..color = const Color(0xFF2344B5)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3;

    // Folded perspective panels
    final p1 = Offset(mapLeft, mapTop + 20);
    final p2 = Offset(mapLeft + mapWidth * 0.32, mapTop);
    final p3 = Offset(mapLeft + mapWidth * 0.68, mapTop + 14);
    final p4 = Offset(mapLeft + mapWidth, mapTop + 4);

    final b1 = Offset(mapLeft + 10, mapTop + mapHeight);
    final b2 = Offset(mapLeft + mapWidth * 0.32 + 6, mapTop + mapHeight - 16);
    final b3 = Offset(mapLeft + mapWidth * 0.68 + 6, mapTop + mapHeight - 6);
    final b4 = Offset(mapLeft + mapWidth - 10, mapTop + mapHeight - 20);

    // Panel 1
    final panel1 = Path()
      ..moveTo(p1.dx, p1.dy)
      ..lineTo(p2.dx, p2.dy)
      ..lineTo(b2.dx, b2.dy)
      ..lineTo(b1.dx, b1.dy)
      ..close();
    canvas.drawPath(panel1, mapBgPaint);
    canvas.drawPath(panel1, mapBorderPaint);

    // Panel 2
    final panel2 = Path()
      ..moveTo(p2.dx, p2.dy)
      ..lineTo(p3.dx, p3.dy)
      ..lineTo(b3.dx, b3.dy)
      ..lineTo(b2.dx, b2.dy)
      ..close();
    final panel2Paint = Paint()..color = const Color(0xFFE6EEF8);
    canvas.drawPath(panel2, panel2Paint);
    canvas.drawPath(panel2, mapBorderPaint);

    // Panel 3
    final panel3 = Path()
      ..moveTo(p3.dx, p3.dy)
      ..lineTo(p4.dx, p4.dy)
      ..lineTo(b4.dx, b4.dy)
      ..lineTo(b3.dx, b3.dy)
      ..close();
    canvas.drawPath(panel3, mapBgPaint);
    canvas.drawPath(panel3, mapBorderPaint);

    // Map internal road sketch lines
    final mapLinePaint = Paint()
      ..color = const Color(0xFFBACDE8)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;
    canvas.drawLine(Offset(mapLeft + 30, mapTop + 60), Offset(mapLeft + 90, mapTop + 75), mapLinePaint);
    canvas.drawLine(Offset(mapLeft + 60, mapTop + 120), Offset(mapLeft + 110, mapTop + 110), mapLinePaint);
    canvas.drawLine(Offset(mapLeft + mapWidth * 0.45, mapTop + 40), Offset(mapLeft + mapWidth * 0.55, mapTop + 80), mapLinePaint);

    // Large Red/Orange destination pin hovering on map
    _drawPin(canvas, Offset(mapLeft + 55, mapTop + 30), 22, const Color(0xFFFF6339), Colors.white);

    // 4. Traveler Arms holding the map on left and right
    final skinPaint = Paint()
      ..color = const Color(0xFFBD7D52)
      ..style = PaintingStyle.fill;

    // Left arm reaching up
    final leftArm = Path()
      ..moveTo(w * 0.15, h * 0.95)
      ..quadraticBezierTo(w * 0.10, h * 0.70, p1.dx + 4, p1.dy + 30)
      ..lineTo(p1.dx + 16, p1.dy + 30)
      ..quadraticBezierTo(w * 0.20, h * 0.75, w * 0.28, h * 0.95)
      ..close();
    canvas.drawPath(leftArm, skinPaint);
    // Left hand gripping map edge
    canvas.drawOval(Rect.fromCenter(center: Offset(p1.dx + 4, p1.dy + 34), width: 14, height: 26), skinPaint);

    // Right arm reaching up
    final rightArm = Path()
      ..moveTo(w * 0.85, h * 0.95)
      ..quadraticBezierTo(w * 0.90, h * 0.70, p4.dx - 4, p4.dy + 30)
      ..lineTo(p4.dx - 16, p4.dy + 30)
      ..quadraticBezierTo(w * 0.80, h * 0.75, w * 0.72, h * 0.95)
      ..close();
    canvas.drawPath(rightArm, skinPaint);
    // Right hand gripping map edge
    canvas.drawOval(Rect.fromCenter(center: Offset(p4.dx - 4, p4.dy + 34), width: 14, height: 26), skinPaint);

    // 5. Traveler Torso (Back View)
    final torsoCenterX = w * 0.48;
    final shirtPaint = Paint()
      ..color = const Color(0xFFFFD152) // Yellow shirt from reference
      ..style = PaintingStyle.fill;

    // Shoulders
    final shoulderPath = Path()
      ..moveTo(torsoCenterX - 75, h)
      ..quadraticBezierTo(torsoCenterX - 65, h * 0.75, torsoCenterX, h * 0.74)
      ..quadraticBezierTo(torsoCenterX + 65, h * 0.75, torsoCenterX + 75, h)
      ..close();
    canvas.drawPath(shoulderPath, shirtPaint);

    // Neck
    canvas.drawRect(Rect.fromCenter(center: Offset(torsoCenterX, h * 0.70), width: 34, height: 36), skinPaint);

    // 6. Traveler Backpack (Orange & Red)
    final packPaint = Paint()
      ..color = const Color(0xFFFF6339) // Orange backpack from reference
      ..style = PaintingStyle.fill;
    final packShadow = Paint()..color = const Color(0xFFD3431D);

    final packRect = RRect.fromRectAndRadius(
      Rect.fromCenter(center: Offset(torsoCenterX, h * 0.88), width: 90, height: 110),
      const Radius.circular(24),
    );
    canvas.drawRRect(packRect, packPaint);

    // Backpack top pocket flap
    final flapRect = RRect.fromRectAndRadius(
      Rect.fromCenter(center: Offset(torsoCenterX, h * 0.81), width: 78, height: 32),
      const Radius.circular(12),
    );
    canvas.drawRRect(flapRect, packShadow);

    // Black harness straps
    final strapPaint = Paint()
      ..color = const Color(0xFF1E272E)
      ..style = PaintingStyle.fill;
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromCenter(center: Offset(torsoCenterX - 28, h * 0.88), width: 10, height: 75), const Radius.circular(5)),
      strapPaint,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromCenter(center: Offset(torsoCenterX + 28, h * 0.88), width: 10, height: 75), const Radius.circular(5)),
      strapPaint,
    );

    // 7. Traveler Head & Curly Dark Hair (Back View)
    final hairPaint = Paint()
      ..color = const Color(0xFF1B1B1E)
      ..style = PaintingStyle.fill;

    // Curly hair clumps
    final headCenter = Offset(torsoCenterX, h * 0.62);
    canvas.drawCircle(headCenter, 38, hairPaint);
    canvas.drawCircle(Offset(headCenter.dx - 22, headCenter.dy - 10), 20, hairPaint);
    canvas.drawCircle(Offset(headCenter.dx + 22, headCenter.dy - 10), 20, hairPaint);
    canvas.drawCircle(Offset(headCenter.dx - 10, headCenter.dy - 24), 22, hairPaint);
    canvas.drawCircle(Offset(headCenter.dx + 10, headCenter.dy - 24), 22, hairPaint);
    canvas.drawCircle(Offset(headCenter.dx, headCenter.dy - 26), 24, hairPaint);
  }

  void _drawStar(Canvas canvas, Offset center, double size, Color color) {
    final paint = Paint()..color = color;
    final path = Path()
      ..moveTo(center.dx, center.dy - size)
      ..quadraticBezierTo(center.dx, center.dy, center.dx + size, center.dy)
      ..quadraticBezierTo(center.dx, center.dy, center.dx, center.dy + size)
      ..quadraticBezierTo(center.dx, center.dy, center.dx - size, center.dy)
      ..quadraticBezierTo(center.dx, center.dy, center.dx, center.dy - size)
      ..close();
    canvas.drawPath(path, paint);
  }

  void _drawPin(Canvas canvas, Offset center, double radius, Color pinColor, Color dotColor) {
    final paint = Paint()..color = pinColor;
    final path = Path()
      ..addOval(Rect.fromCircle(center: center, radius: radius))
      ..moveTo(center.dx - radius * 0.6, center.dy + radius * 0.6)
      ..lineTo(center.dx, center.dy + radius * 1.8)
      ..lineTo(center.dx + radius * 0.6, center.dy + radius * 0.6)
      ..close();
    canvas.drawPath(path, paint);

    // Inner dot
    canvas.drawCircle(center, radius * 0.38, Paint()..color = dotColor);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// 2. Figma Artboard 2: Beach Van & Surfboard Destination Card
class FigmaBeachVanCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final double rating;
  final VoidCallback onTap;

  const FigmaBeachVanCard({
    super.key,
    required this.title,
    required this.subtitle,
    required this.rating,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Beach Van Graphic Hero
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              child: SizedBox(
                height: 200,
                width: double.infinity,
                child: CustomPaint(
                  painter: _BeachVanPainter(),
                ),
              ),
            ),
            // Information Footer
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: const TextStyle(
                            fontFamily: 'Poppins',
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF1E272E),
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          subtitle,
                          style: TextStyle(
                            fontFamily: 'Poppins',
                            fontSize: 12,
                            color: Colors.grey.shade600,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF7E6),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Text(
                          rating.toStringAsFixed(1),
                          style: const TextStyle(
                            fontFamily: 'Poppins',
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFFFFA000),
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Icon(Icons.star, size: 14, color: Color(0xFFFFA000)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BeachVanPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // Sky Background Gradient
    final skyRect = Rect.fromLTWH(0, 0, w, h);
    final skyGradient = const LinearGradient(
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
      colors: [Color(0xFF81D4FA), Color(0xFFE1F5FE)],
    ).createShader(skyRect);
    canvas.drawRect(skyRect, Paint()..shader = skyGradient);

    // Warm Sun
    final sunPaint = Paint()..color = const Color(0xFFFFB800);
    canvas.drawCircle(Offset(w * 0.28, h * 0.26), 26, sunPaint);

    // Distant Green Hills & Lighthouse
    final hillPaint = Paint()..color = const Color(0xFF66BB6A);
    final hillPath = Path()
      ..moveTo(w * 0.45, h * 0.65)
      ..quadraticBezierTo(w * 0.72, h * 0.48, w, h * 0.58)
      ..lineTo(w, h)
      ..lineTo(w * 0.45, h)
      ..close();
    canvas.drawPath(hillPath, hillPaint);

    // Lighthouse
    final lightPaint = Paint()..color = Colors.white;
    canvas.drawRect(Rect.fromLTWH(w * 0.78, h * 0.44, 12, 28), lightPaint);
    canvas.drawRect(Rect.fromLTWH(w * 0.76, h * 0.41, 16, 6), Paint()..color = const Color(0xFFE53935));

    // Turquoise Ocean Waves
    final oceanPaint = Paint()..color = const Color(0xFF00ACC1);
    final oceanPath = Path()
      ..moveTo(0, h * 0.55)
      ..quadraticBezierTo(w * 0.20, h * 0.58, w * 0.45, h * 0.55)
      ..quadraticBezierTo(w * 0.65, h * 0.53, w, h * 0.62)
      ..lineTo(w, h)
      ..lineTo(0, h)
      ..close();
    canvas.drawPath(oceanPath, oceanPaint);

    // Sandy Shore
    final sandPaint = Paint()..color = const Color(0xFFFFE082);
    final sandPath = Path()
      ..moveTo(0, h * 0.68)
      ..quadraticBezierTo(w * 0.35, h * 0.65, w * 0.55, h * 0.85)
      ..lineTo(0, h)
      ..close();
    canvas.drawPath(sandPath, sandPaint);

    // Beach Camper Van (Front 3/4 view)
    final vanX = w * 0.56;
    final vanY = h * 0.70;

    // Van Body (Cyan Blue)
    final vanPaint = Paint()..color = const Color(0xFF29B6F6);
    final vanRect = RRect.fromRectAndRadius(
      Rect.fromCenter(center: Offset(vanX, vanY), width: 75, height: 60),
      const Radius.circular(12),
    );
    canvas.drawRRect(vanRect, vanPaint);

    // Van Roof Cap (White)
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromCenter(center: Offset(vanX, vanY - 26), width: 70, height: 16), const Radius.circular(8)),
      Paint()..color = Colors.white,
    );

    // Front Windshield
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromCenter(center: Offset(vanX - 12, vanY - 8), width: 34, height: 22), const Radius.circular(6)),
      Paint()..color = const Color(0xFFE0F7FA),
    );

    // Van Grill & Headlights
    canvas.drawCircle(Offset(vanX - 22, vanY + 14), 6, Paint()..color = const Color(0xFFFFF9C4));
    canvas.drawCircle(Offset(vanX + 2, vanY + 14), 6, Paint()..color = const Color(0xFFFFF9C4));

    // Wheels
    final wheelPaint = Paint()..color = const Color(0xFF263238);
    canvas.drawCircle(Offset(vanX - 18, vanY + 30), 10, wheelPaint);
    canvas.drawCircle(Offset(vanX + 20, vanY + 30), 10, wheelPaint);

    // Leaning Surfboard (Orange & White Stripe)
    final surfPaint = Paint()..color = const Color(0xFFFF7043);
    final surfPath = Path()
      ..moveTo(vanX + 26, vanY - 30)
      ..quadraticBezierTo(vanX + 38, vanY + 5, vanX + 44, vanY + 34)
      ..lineTo(vanX + 32, vanY + 34)
      ..quadraticBezierTo(vanX + 22, vanY + 5, vanX + 26, vanY - 30)
      ..close();
    canvas.drawPath(surfPath, surfPaint);

    // Palm Fronds Framing Top Right
    final palmPaint = Paint()..color = const Color(0xFF2E7D32);
    canvas.drawLine(Offset(w * 0.95, 0), Offset(w * 0.80, h * 0.22), Paint()..color = const Color(0xFF5D4037)..strokeWidth = 4);
    for (int i = 0; i < 6; i++) {
      canvas.drawLine(Offset(w * 0.80, h * 0.22), Offset(w * (0.65 + i * 0.05), h * (0.15 + i * 0.04)), palmPaint..strokeWidth = 3);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// 3. Figma Artboard 3: "Your Route" Gokarna Map Painter
class FigmaRouteMapPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // Map Base (Soft Gray)
    canvas.drawRect(Rect.fromLTWH(0, 0, w, h), Paint()..color = const Color(0xFFF0F4F8));

    // Building Blocks
    final blockPaint = Paint()..color = const Color(0xFFE2E8F0);
    final blocks = [
      Rect.fromLTWH(w * 0.08, h * 0.12, w * 0.28, h * 0.22),
      Rect.fromLTWH(w * 0.42, h * 0.08, w * 0.24, h * 0.18),
      Rect.fromLTWH(w * 0.72, h * 0.14, w * 0.22, h * 0.26),
      Rect.fromLTWH(w * 0.14, h * 0.42, w * 0.24, h * 0.22),
      Rect.fromLTWH(w * 0.48, h * 0.36, w * 0.30, h * 0.28),
      Rect.fromLTWH(w * 0.82, h * 0.48, w * 0.15, h * 0.28),
    ];
    for (final b in blocks) {
      canvas.drawRRect(RRect.fromRectAndRadius(b, const Radius.circular(8)), blockPaint);
    }

    // Secondary Street Lines
    final roadPaint = Paint()
      ..color = Colors.white
      ..strokeWidth = 14
      ..style = PaintingStyle.stroke;

    final roadPath1 = Path()
      ..moveTo(0, h * 0.38)
      ..lineTo(w, h * 0.38);
    final roadPath2 = Path()
      ..moveTo(w * 0.40, 0)
      ..lineTo(w * 0.40, h);
    canvas.drawPath(roadPath1, roadPaint);
    canvas.drawPath(roadPath2, roadPaint);

    // Active Route Path (Orange - Matching Screen 3 in Figma)
    final routePaint = Paint()
      ..color = const Color(0xFFFF6339)
      ..strokeWidth = 6
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..style = PaintingStyle.stroke;

    final route = Path()
      ..moveTo(w * 0.86, h * 0.46) // Blue start
      ..lineTo(w * 0.52, h * 0.46)
      ..lineTo(w * 0.52, h * 0.28)
      ..lineTo(w * 0.76, h * 0.28)
      ..lineTo(w * 0.76, h * 0.18); // Orange destination pin
    canvas.drawPath(route, routePaint);

    // Start Location Radar Pin (Royal Blue)
    final startOffset = Offset(w * 0.86, h * 0.46);
    canvas.drawCircle(startOffset, 18, Paint()..color = const Color(0xFF3354F4).withValues(alpha: 0.25));
    canvas.drawCircle(startOffset, 10, Paint()..color = const Color(0xFF3354F4));
    canvas.drawCircle(startOffset, 5, Paint()..color = Colors.white);

    // End Location Waypoint Pin (Orange Pin)
    final endOffset = Offset(w * 0.76, h * 0.18);
    final pinPaint = Paint()..color = const Color(0xFFFF6339);
    canvas.drawCircle(endOffset, 14, pinPaint);
    canvas.drawCircle(endOffset, 5, Paint()..color = Colors.white);
    final tipPath = Path()
      ..moveTo(endOffset.dx - 8, endOffset.dy + 8)
      ..lineTo(endOffset.dx, endOffset.dy + 22)
      ..lineTo(endOffset.dx + 8, endOffset.dy + 8)
      ..close();
    canvas.drawPath(tipPath, pinPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// 4. Figma Artboard 2 Card 2: Tropical Palm & Ocean Resort Card
class FigmaResortCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final double rating;
  final VoidCallback onTap;

  const FigmaResortCard({
    super.key,
    required this.title,
    required this.subtitle,
    required this.rating,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              child: SizedBox(
                height: 200,
                width: double.infinity,
                child: CustomPaint(
                  painter: _ResortPainter(),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: const TextStyle(
                            fontFamily: 'Poppins',
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF1E272E),
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          subtitle,
                          style: TextStyle(
                            fontFamily: 'Poppins',
                            fontSize: 12,
                            color: Colors.grey.shade600,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF7E6),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Text(
                          rating.toStringAsFixed(1),
                          style: const TextStyle(
                            fontFamily: 'Poppins',
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFFFFA000),
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Icon(Icons.star, size: 14, color: Color(0xFFFFA000)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ResortPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // Tropical Gradient Sky
    final skyRect = Rect.fromLTWH(0, 0, w, h);
    final skyGradient = const LinearGradient(
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
      colors: [Color(0xFF4FC3F7), Color(0xFFB2EBF2)],
    ).createShader(skyRect);
    canvas.drawRect(skyRect, Paint()..shader = skyGradient);

    // Warm Sun
    canvas.drawCircle(Offset(w * 0.75, h * 0.25), 24, Paint()..color = const Color(0xFFFFCA28));

    // Distant Sea Waves
    final seaPaint = Paint()..color = const Color(0xFF0097A7);
    final seaPath = Path()
      ..moveTo(0, h * 0.50)
      ..quadraticBezierTo(w * 0.35, h * 0.45, w * 0.65, h * 0.52)
      ..lineTo(w, h * 0.48)
      ..lineTo(w, h)
      ..lineTo(0, h)
      ..close();
    canvas.drawPath(seaPath, seaPaint);

    // Swimming Pool / Deck Terrace with Blue Tiling
    final poolPaint = Paint()..color = const Color(0xFF00ACC1);
    final poolRect = Rect.fromLTWH(w * 0.40, h * 0.62, w * 0.60, h * 0.38);
    canvas.drawRect(poolRect, poolPaint);

    // Tile lines
    final tilePaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.3)
      ..strokeWidth = 1.5;
    for (double y = h * 0.68; y < h; y += 18) {
      canvas.drawLine(Offset(w * 0.40, y), Offset(w, y), tilePaint);
    }
    for (double x = w * 0.45; x < w; x += 30) {
      canvas.drawLine(Offset(x, h * 0.62), Offset(x, h), tilePaint);
    }

    // Sandy Cliff Shore on the Left
    final cliffPaint = Paint()..color = const Color(0xFFFFD54F);
    final cliffPath = Path()
      ..moveTo(0, h * 0.58)
      ..quadraticBezierTo(w * 0.25, h * 0.60, w * 0.40, h * 0.75)
      ..lineTo(w * 0.40, h)
      ..lineTo(0, h)
      ..close();
    canvas.drawPath(cliffPath, cliffPaint);

    // Tropical Palm Tree Trunk & Fronds
    final trunkPaint = Paint()
      ..color = const Color(0xFF5D4037)
      ..strokeWidth = 10
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;
    final trunkPath = Path()
      ..moveTo(w * 0.12, h)
      ..quadraticBezierTo(w * 0.16, h * 0.60, w * 0.18, h * 0.30);
    canvas.drawPath(trunkPath, trunkPaint);

    // Palm Fronds
    final frondPaint = Paint()..color = const Color(0xFF2E7D32);
    final palmCenter = Offset(w * 0.18, h * 0.30);
    _drawFrond(canvas, palmCenter, -0.6, 55, frondPaint);
    _drawFrond(canvas, palmCenter, -0.1, 65, frondPaint);
    _drawFrond(canvas, palmCenter, 0.4, 60, frondPaint);
    _drawFrond(canvas, palmCenter, 0.9, 50, frondPaint);
    _drawFrond(canvas, palmCenter, -1.2, 50, frondPaint);
  }

  void _drawFrond(Canvas canvas, Offset origin, double angle, double length, Paint paint) {
    canvas.save();
    canvas.translate(origin.dx, origin.dy);
    canvas.rotate(angle);
    final frond = Path()
      ..moveTo(0, 0)
      ..quadraticBezierTo(length * 0.5, -12, length, 0)
      ..quadraticBezierTo(length * 0.5, 12, 0, 0)
      ..close();
    canvas.drawPath(frond, paint);
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

