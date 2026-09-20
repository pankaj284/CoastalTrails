import 'package:flutter/material.dart';

enum IllustrationType { explore, journey, traveler }

class TravelIllustrationWidget extends StatelessWidget {
  final IllustrationType type;
  final double height;

  const TravelIllustrationWidget({
    super.key,
    required this.type,
    this.height = 320,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height,
      width: double.infinity,
      child: CustomPaint(
        painter: _TravelPainter(type),
      ),
    );
  }
}

class _TravelPainter extends CustomPainter {
  final IllustrationType type;
  _TravelPainter(this.type);

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // Background Sky Gradient
    final skyPaint = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [Color(0xFFE3F7F5), Color(0xFFC7ECE8)],
      ).createShader(Rect.fromLTWH(0, 0, w, h));
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(0, 0, w, h), const Radius.circular(28)),
      skyPaint,
    );

    // Warm Sun in upper sky
    final sunPaint = Paint()
      ..shader = RadialGradient(
        colors: [
          const Color(0xFFFFF2B2),
          const Color(0xFFFDE49E).withValues(alpha: 0.6),
          Colors.transparent,
        ],
        stops: const [0.3, 0.7, 1.0],
      ).createShader(Rect.fromCircle(center: Offset(w * 0.5, h * 0.28), radius: 55));
    canvas.drawCircle(Offset(w * 0.5, h * 0.28), 55, sunPaint);

    // Birds soaring
    _drawBird(canvas, w * 0.38, h * 0.12, 12);
    _drawBird(canvas, w * 0.44, h * 0.09, 10);
    _drawBird(canvas, w * 0.49, h * 0.14, 8);

    switch (type) {
      case IllustrationType.explore:
        _drawExplore(canvas, w, h);
        break;
      case IllustrationType.journey:
        _drawJourney(canvas, w, h);
        break;
      case IllustrationType.traveler:
        _drawTraveler(canvas, w, h);
        break;
    }
  }

  void _drawBird(Canvas canvas, double x, double y, double size) {
    final birdPaint = Paint()
      ..color = const Color(0xFF27555D)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.6
      ..strokeCap = StrokeCap.round;
    final path = Path()
      ..moveTo(x - size, y + size * 0.3)
      ..quadraticBezierTo(x - size * 0.5, y - size * 0.4, x, y)
      ..quadraticBezierTo(x + size * 0.5, y - size * 0.4, x + size, y + size * 0.3);
    canvas.drawPath(path, birdPaint);
  }

  void _drawExplore(Canvas canvas, double w, double h) {
    // 1. Clouds
    _drawCloud(canvas, w * 0.22, h * 0.14, 38);
    _drawCloud(canvas, w * 0.76, h * 0.12, 44);

    // 2. Hot Air Balloons
    _drawHotAirBalloon(canvas, w * 0.18, h * 0.22, 28, const Color(0xFF4FA8A8), const Color(0xFFFF725E));
    _drawHotAirBalloon(canvas, w * 0.82, h * 0.25, 22, const Color(0xFFFF725E), const Color(0xFFFDE49E));

    // 3. Mountains in background
    final mountainPaint = Paint()..color = const Color(0xFFBCE3E8);
    final mPath = Path()
      ..moveTo(0, h * 0.65)
      ..lineTo(w * 0.35, h * 0.38)
      ..lineTo(w * 0.55, h * 0.55)
      ..lineTo(w * 0.8, h * 0.32)
      ..lineTo(w, h * 0.60)
      ..lineTo(w, h)
      ..lineTo(0, h)
      ..close();
    canvas.drawPath(mPath, mountainPaint);

    // Mountain caps (white snow / quartz cliff)
    final snowPaint = Paint()..color = Colors.white.withValues(alpha: 0.9);
    final sPath = Path()
      ..moveTo(w * 0.35, h * 0.38)
      ..lineTo(w * 0.27, h * 0.47)
      ..lineTo(w * 0.33, h * 0.46)
      ..lineTo(w * 0.38, h * 0.50)
      ..lineTo(w * 0.44, h * 0.46)
      ..close();
    canvas.drawPath(sPath, snowPaint);

    // 4. Shrubs and Foliage
    final bushPaint = Paint()..color = const Color(0xFF67B5AE);
    final bushPaintDark = Paint()..color = const Color(0xFF4A9B94);
    canvas.drawCircle(Offset(w * 0.12, h * 0.68), 35, bushPaint);
    canvas.drawCircle(Offset(w * 0.25, h * 0.70), 28, bushPaintDark);
    canvas.drawCircle(Offset(w * 0.82, h * 0.68), 38, bushPaint);
    canvas.drawCircle(Offset(w * 0.94, h * 0.67), 30, bushPaintDark);

    // 5. Sand Foreground
    final sandPaint = Paint()..color = const Color(0xFFFDE7AC);
    final sandPath = Path()
      ..moveTo(0, h * 0.72)
      ..quadraticBezierTo(w * 0.3, h * 0.68, w * 0.6, h * 0.74)
      ..quadraticBezierTo(w * 0.85, h * 0.78, w, h * 0.72)
      ..lineTo(w, h)
      ..lineTo(0, h)
      ..close();
    canvas.drawPath(sandPath, sandPaint);

    // Sand textures & seashells
    final dotPaint = Paint()..color = const Color(0xFFE8C27B);
    canvas.drawCircle(Offset(w * 0.2, h * 0.82), 3.5, dotPaint);
    canvas.drawCircle(Offset(w * 0.45, h * 0.88), 3, dotPaint);
    canvas.drawCircle(Offset(w * 0.7, h * 0.84), 3.5, dotPaint);

    // Character Shadow
    final shadowPaint = Paint()..color = Colors.black.withValues(alpha: 0.1);
    canvas.drawOval(Rect.fromLTWH(w * 0.40, h * 0.88, 50, 10), shadowPaint);
    canvas.drawOval(Rect.fromLTWH(w * 0.62, h * 0.86, 30, 8), shadowPaint);

    // 6. Character (Walking Explorer with Suitcase)
    _drawWalkingTraveler(canvas, w * 0.46, h * 0.62);
  }

  void _drawJourney(Canvas canvas, double w, double h) {
    // 1. Clouds
    _drawCloud(canvas, w * 0.2, h * 0.12, 34);
    _drawCloud(canvas, w * 0.65, h * 0.16, 38);

    // 2. Distant sea mountains
    final mPaint = Paint()..color = const Color(0xFFC7EBF0);
    final mPath = Path()
      ..moveTo(0, h * 0.58)
      ..lineTo(w * 0.4, h * 0.38)
      ..lineTo(w * 0.7, h * 0.60)
      ..lineTo(w, h * 0.52)
      ..lineTo(w, h)
      ..close();
    canvas.drawPath(mPath, mPaint);

    // 3. Blue Ocean Waves
    final seaPaint = Paint()..color = const Color(0xFF70C2D9);
    final seaPath = Path()
      ..moveTo(0, h * 0.58)
      ..lineTo(w, h * 0.58)
      ..lineTo(w, h * 0.72)
      ..lineTo(0, h * 0.72)
      ..close();
    canvas.drawPath(seaPath, seaPaint);

    // White wave foam ripples
    final wavePaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.85)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.0;
    canvas.drawArc(Rect.fromLTWH(0, h * 0.67, w * 0.3, 14), 0, 3.14, false, wavePaint);
    canvas.drawArc(Rect.fromLTWH(w * 0.3, h * 0.67, w * 0.35, 14), 0, 3.14, false, wavePaint);
    canvas.drawArc(Rect.fromLTWH(w * 0.65, h * 0.67, w * 0.35, 14), 0, 3.14, false, wavePaint);

    // 4. Beach Sand
    final sandPaint = Paint()..color = const Color(0xFFFDE7AC);
    final sandPath = Path()
      ..moveTo(0, h * 0.70)
      ..quadraticBezierTo(w * 0.5, h * 0.66, w, h * 0.70)
      ..lineTo(w, h)
      ..lineTo(0, h)
      ..close();
    canvas.drawPath(sandPath, sandPaint);

    // 5. Coconut Palm Tree with Coconuts
    _drawPalmTree(canvas, w * 0.80, h * 0.72);

    // 6. Coastal Aloe / Bush on left
    _drawBeachPlant(canvas, w * 0.16, h * 0.74);

    // Character Shadow
    final shadowPaint = Paint()..color = Colors.black.withValues(alpha: 0.1);
    canvas.drawOval(Rect.fromLTWH(w * 0.40, h * 0.88, 48, 10), shadowPaint);

    // 7. Photographer Character
    _drawPhotographer(canvas, w * 0.46, h * 0.64);
  }

  void _drawTraveler(Canvas canvas, double w, double h) {
    // 1. Clouds & Airplane
    _drawCloud(canvas, w * 0.3, h * 0.14, 34);
    _drawAirplane(canvas, w * 0.72, h * 0.18);

    // 2. Coastal Terminal / Resort Building
    _drawTerminalBuilding(canvas, w * 0.75, h * 0.62);

    // 3. Trees beside terminal
    final treePaint = Paint()..color = const Color(0xFFFF725E);
    canvas.drawOval(Rect.fromLTWH(w * 0.12, h * 0.55, 18, 48), treePaint);
    canvas.drawOval(Rect.fromLTWH(w * 0.22, h * 0.52, 22, 54), treePaint);

    // 4. Lavender / Soft Ground
    final groundPaint = Paint()..color = const Color(0xFFEAE5F5);
    final gPath = Path()
      ..moveTo(0, h * 0.72)
      ..lineTo(w, h * 0.72)
      ..lineTo(w, h)
      ..lineTo(0, h)
      ..close();
    canvas.drawPath(gPath, groundPaint);

    // Character Shadow
    final shadowPaint = Paint()..color = Colors.black.withValues(alpha: 0.1);
    canvas.drawOval(Rect.fromLTWH(w * 0.42, h * 0.87, 46, 10), shadowPaint);
    canvas.drawOval(Rect.fromLTWH(w * 0.62, h * 0.86, 30, 8), shadowPaint);

    // 5. Traveler with Selfie Stick
    _drawSelfieTraveler(canvas, w * 0.48, h * 0.63);
  }

  // --- Character & Object Helpers ---

  void _drawCloud(Canvas canvas, double x, double y, double r) {
    final p = Paint()..color = Colors.white.withValues(alpha: 0.94);
    canvas.drawCircle(Offset(x, y), r * 0.7, p);
    canvas.drawCircle(Offset(x + r * 0.6, y - r * 0.2), r * 0.6, p);
    canvas.drawCircle(Offset(x + r * 1.2, y), r * 0.5, p);
  }

  void _drawHotAirBalloon(Canvas canvas, double x, double y, double r, Color c1, Color c2) {
    final p1 = Paint()..color = c1;
    final p2 = Paint()..color = c2;
    canvas.drawOval(Rect.fromLTWH(x - r, y - r * 1.2, r * 2, r * 2.4), p1);
    canvas.drawOval(Rect.fromLTWH(x - r * 0.4, y - r * 1.2, r * 0.8, r * 2.4), p2);

    // Basket
    final basketPaint = Paint()..color = const Color(0xFF8B6B48);
    canvas.drawRect(Rect.fromLTWH(x - 4, y + r * 1.5, 8, 8), basketPaint);
    final linePaint = Paint()
      ..color = const Color(0xFF1B3D44)
      ..strokeWidth = 1.0;
    canvas.drawLine(Offset(x - 4, y + r * 1.1), Offset(x - 3, y + r * 1.5), linePaint);
    canvas.drawLine(Offset(x + 4, y + r * 1.1), Offset(x + 3, y + r * 1.5), linePaint);
  }

  void _drawWalkingTraveler(Canvas canvas, double cx, double cy) {
    final stroke = Paint()
      ..color = const Color(0xFF1B3D44)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.2;

    // Head
    canvas.drawCircle(Offset(cx, cy - 50), 12, Paint()..color = const Color(0xFFFBE4D5));
    canvas.drawCircle(Offset(cx, cy - 50), 12, stroke);
    // Cap / hair (teal)
    final hairPaint = Paint()..color = const Color(0xFF448A84);
    canvas.drawArc(Rect.fromLTWH(cx - 12, cy - 62, 24, 16), 3.14, 3.14, true, hairPaint);
    // Spectacles
    canvas.drawLine(Offset(cx - 5, cy - 50), Offset(cx + 4, cy - 50), stroke);

    // Coral Jacket / Body
    final bodyPaint = Paint()..color = const Color(0xFFFF725E);
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(cx - 12, cy - 36, 24, 38), const Radius.circular(8)),
      bodyPaint,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(cx - 12, cy - 36, 24, 38), const Radius.circular(8)),
      stroke,
    );

    // Camera around neck
    final camPaint = Paint()..color = const Color(0xFF1B3D44);
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(cx - 5, cy - 26, 10, 8), const Radius.circular(2)),
      camPaint,
    );
    canvas.drawCircle(Offset(cx, cy - 22), 2, Paint()..color = Colors.white);

    // Teal Legs / Trousers
    final legPaint = Paint()..color = const Color(0xFF5AB6AC);
    // Left leg
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(cx - 10, cy + 2, 8, 38), const Radius.circular(4)),
      legPaint,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(cx - 10, cy + 2, 8, 38), const Radius.circular(4)),
      stroke,
    );
    // Right leg
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(cx + 2, cy + 2, 8, 38), const Radius.circular(4)),
      legPaint,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(cx + 2, cy + 2, 8, 38), const Radius.circular(4)),
      stroke,
    );

    // Yellow Suitcase being pulled
    final suitX = cx + 24;
    final suitY = cy + 4;
    final suitPaint = Paint()..color = const Color(0xFFF9B853);
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(suitX, suitY, 18, 32), const Radius.circular(5)),
      suitPaint,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(suitX, suitY, 18, 32), const Radius.circular(5)),
      stroke,
    );
    // Suitcase ribs
    canvas.drawLine(Offset(suitX + 4, suitY + 10), Offset(suitX + 14, suitY + 10), stroke);
    canvas.drawLine(Offset(suitX + 4, suitY + 20), Offset(suitX + 14, suitY + 20), stroke);

    // Suitcase handle
    canvas.drawLine(Offset(cx + 8, cy - 10), Offset(suitX + 9, suitY), stroke);
  }

  void _drawPhotographer(Canvas canvas, double cx, double cy) {
    final stroke = Paint()
      ..color = const Color(0xFF1B3D44)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.2;

    // Head
    canvas.drawCircle(Offset(cx, cy - 48), 12, Paint()..color = const Color(0xFFFBE4D5));
    canvas.drawCircle(Offset(cx, cy - 48), 12, stroke);
    // Teal Cap
    canvas.drawArc(Rect.fromLTWH(cx - 12, cy - 60, 24, 16), 3.14, 3.14, true, Paint()..color = const Color(0xFF448A84));

    // Grey-cyan Shirt
    final shirtPaint = Paint()..color = const Color(0xFFD4EAE8);
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(cx - 13, cy - 34, 26, 36), const Radius.circular(8)),
      shirtPaint,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(cx - 13, cy - 34, 26, 36), const Radius.circular(8)),
      stroke,
    );

    // Camera raised to eyes
    final camPaint = Paint()..color = const Color(0xFF1B3D44);
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(cx - 8, cy - 50, 16, 12), const Radius.circular(3)),
      camPaint,
    );
    canvas.drawCircle(Offset(cx, cy - 44), 3.5, Paint()..color = Colors.white);

    // Backpack behind
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(cx + 10, cy - 32, 12, 28), const Radius.circular(5)),
      Paint()..color = const Color(0xFF5AB6AC),
    );

    // Teal Legs
    final legPaint = Paint()..color = const Color(0xFF5AB6AC);
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(cx - 9, cy + 2, 8, 38), const Radius.circular(4)), legPaint);
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(cx - 9, cy + 2, 8, 38), const Radius.circular(4)), stroke);
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(cx + 2, cy + 2, 8, 38), const Radius.circular(4)), legPaint);
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(cx + 2, cy + 2, 8, 38), const Radius.circular(4)), stroke);
  }

  void _drawSelfieTraveler(Canvas canvas, double cx, double cy) {
    final stroke = Paint()
      ..color = const Color(0xFF1B3D44)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.2;

    // Head
    canvas.drawCircle(Offset(cx, cy - 48), 12, Paint()..color = const Color(0xFFFBE4D5));
    canvas.drawCircle(Offset(cx, cy - 48), 12, stroke);
    // Yellow T-shirt
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(cx - 12, cy - 34, 24, 34), const Radius.circular(8)),
      Paint()..color = const Color(0xFFF9B853),
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(cx - 12, cy - 34, 24, 34), const Radius.circular(8)),
      stroke,
    );

    // Arm holding selfie stick
    final stickPaint = Paint()
      ..color = const Color(0xFF1B3D44)
      ..strokeWidth = 2.5;
    canvas.drawLine(Offset(cx - 8, cy - 25), Offset(cx - 32, cy - 56), stickPaint);
    // Phone at end of stick
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(cx - 40, cy - 64, 14, 10), const Radius.circular(2)),
      Paint()..color = const Color(0xFF4FA8A8),
    );

    // Other hand waving peace sign
    canvas.drawLine(Offset(cx + 12, cy - 20), Offset(cx + 22, cy - 38), stickPaint);

    // Teal Shorts & Legs
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(cx - 11, cy, 22, 16), const Radius.circular(4)),
      Paint()..color = const Color(0xFF5AB6AC),
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(cx - 11, cy, 22, 16), const Radius.circular(4)),
      stroke,
    );

    // Bare legs
    canvas.drawLine(Offset(cx - 6, cy + 16), Offset(cx - 6, cy + 36), stroke);
    canvas.drawLine(Offset(cx + 6, cy + 16), Offset(cx + 6, cy + 36), stroke);

    // Suitcase beside
    final suitPaint = Paint()..color = const Color(0xFFF9B853);
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(cx + 22, cy + 6, 18, 30), const Radius.circular(5)),
      suitPaint,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(cx + 22, cy + 6, 18, 30), const Radius.circular(5)),
      stroke,
    );
  }

  void _drawPalmTree(Canvas canvas, double x, double y) {
    // Curved trunk
    final trunkPaint = Paint()
      ..color = const Color(0xFFFF725E)
      ..strokeWidth = 10
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;
    final trunkPath = Path()
      ..moveTo(x, y)
      ..quadraticBezierTo(x - 12, y - 60, x - 6, y - 110);
    canvas.drawPath(trunkPath, trunkPaint);

    // Coconuts
    final cocoPaint = Paint()..color = const Color(0xFF8B5A2B);
    canvas.drawCircle(Offset(x - 10, y - 106), 4.5, cocoPaint);
    canvas.drawCircle(Offset(x - 4, y - 104), 4.5, cocoPaint);
    canvas.drawCircle(Offset(x - 12, y - 100), 4, cocoPaint);

    // Palm fronds
    final frondPaint = Paint()
      ..color = const Color(0xFFFF725E)
      ..strokeWidth = 6
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;
    canvas.drawLine(Offset(x - 6, y - 110), Offset(x - 36, y - 130), frondPaint);
    canvas.drawLine(Offset(x - 6, y - 110), Offset(x + 24, y - 134), frondPaint);
    canvas.drawLine(Offset(x - 6, y - 110), Offset(x + 36, y - 112), frondPaint);
    canvas.drawLine(Offset(x - 6, y - 110), Offset(x - 42, y - 105), frondPaint);
    canvas.drawLine(Offset(x - 6, y - 110), Offset(x - 8, y - 145), frondPaint);
  }

  void _drawBeachPlant(Canvas canvas, double x, double y) {
    final p = Paint()
      ..color = const Color(0xFF459B93)
      ..strokeWidth = 6
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(Offset(x, y), Offset(x - 14, y - 24), p);
    canvas.drawLine(Offset(x, y), Offset(x, y - 32), p);
    canvas.drawLine(Offset(x, y), Offset(x + 14, y - 22), p);
  }

  void _drawAirplane(Canvas canvas, double x, double y) {
    final p = Paint()..color = const Color(0xFFB5C9E0);
    canvas.drawCircle(Offset(x, y), 5, p);
    // Dotted flight trail
    final dotP = Paint()..color = const Color(0xFFB5C9E0).withValues(alpha: 0.6);
    canvas.drawCircle(Offset(x - 10, y + 6), 2, dotP);
    canvas.drawCircle(Offset(x - 20, y + 14), 2, dotP);
    canvas.drawCircle(Offset(x - 30, y + 24), 2, dotP);
  }

  void _drawTerminalBuilding(Canvas canvas, double x, double y) {
    // Base structure
    final bPaint = Paint()..color = const Color(0xFF75B9E8);
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(x - 35, y - 30, 70, 48), const Radius.circular(6)),
      bPaint,
    );
    // Yellow roof / banner
    final bannerPaint = Paint()..color = const Color(0xFFF9B853);
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(x - 38, y - 42, 76, 16), const Radius.circular(4)),
      bannerPaint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class TropicalLoginHeroWidget extends StatelessWidget {
  final double height;
  const TropicalLoginHeroWidget({super.key, this.height = 300});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height,
      width: double.infinity,
      child: CustomPaint(
        painter: _TropicalLoginHeroPainter(),
      ),
    );
  }
}

class _TropicalLoginHeroPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // 1. Turquoise Sky Background
    final bgPaint = Paint()..color = const Color(0xFF00C9B7);
    canvas.drawRect(Rect.fromLTWH(0, 0, w, h), bgPaint);

    // 2. White Sun Disc
    final sunPaint = Paint()..color = Colors.white;
    canvas.drawCircle(Offset(w * 0.76, h * 0.28), 34, sunPaint);

    // 3. Floating Soft Clouds
    final cloudPaint = Paint()..color = Colors.white.withValues(alpha: 0.35);
    canvas.drawCircle(Offset(w * 0.22, h * 0.20), 22, cloudPaint);
    canvas.drawCircle(Offset(w * 0.28, h * 0.18), 30, cloudPaint);
    canvas.drawCircle(Offset(w * 0.34, h * 0.21), 20, cloudPaint);

    // 4. Palm Fronds / Tropical Leaves in Bottom Corners
    final leafPaint = Paint()..color = const Color(0xFF00897B);
    // Left leaves
    canvas.drawCircle(Offset(w * 0.08, h * 0.90), 40, leafPaint);
    canvas.drawCircle(Offset(w * 0.14, h * 0.94), 36, leafPaint);
    // Right leaves
    canvas.drawCircle(Offset(w * 0.90, h * 0.92), 42, leafPaint);
    canvas.drawCircle(Offset(w * 0.82, h * 0.96), 34, leafPaint);

    // 5. THE TRAVELER CHARACTER (Sunglasses, Tropical Hawaiian Shirt, Camera)
    final cx = w * 0.44;
    final cy = h * 0.64;

    final skinPaint = Paint()..color = const Color(0xFFFCD5B5);
    final hairPaint = Paint()..color = const Color(0xFF2C3440);
    final darkOutline = Paint()
      ..color = const Color(0xFF1E2833)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;

    // Body / Torso (Hawaiian Shirt)
    final shirtPaint = Paint()..color = const Color(0xFF00BFA5);
    final shirtPath = Path()
      ..moveTo(cx - 50, cy + 20)
      ..lineTo(cx + 50, cy + 20)
      ..lineTo(cx + 42, cy + 105)
      ..lineTo(cx - 42, cy + 105)
      ..close();
    canvas.drawPath(shirtPath, shirtPaint);

    // Shirt collar & floral leaf pattern
    final floralPaint = Paint()..color = Colors.white.withValues(alpha: 0.85);
    canvas.drawOval(Rect.fromLTWH(cx - 30, cy + 35, 14, 22), floralPaint);
    canvas.drawOval(Rect.fromLTWH(cx + 16, cy + 42, 16, 20), floralPaint);
    canvas.drawOval(Rect.fromLTWH(cx - 20, cy + 72, 18, 20), floralPaint);
    canvas.drawOval(Rect.fromLTWH(cx + 10, cy + 78, 14, 18), floralPaint);

    // Terracotta Shorts at bottom
    final shortsPaint = Paint()..color = const Color(0xFFE8824E);
    canvas.drawRect(Rect.fromLTWH(cx - 40, cy + 105, 80, 35), shortsPaint);

    // Arms
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(cx - 65, cy + 26, 22, 60), const Radius.circular(10)),
      skinPaint,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(cx + 43, cy + 26, 22, 60), const Radius.circular(10)),
      skinPaint,
    );

    // Neck
    canvas.drawRect(Rect.fromLTWH(cx - 14, cy - 8, 28, 30), skinPaint);

    // Head
    canvas.drawOval(Rect.fromLTWH(cx - 28, cy - 64, 56, 64), skinPaint);

    // Ears
    canvas.drawCircle(Offset(cx - 28, cy - 30), 8, skinPaint);
    canvas.drawCircle(Offset(cx + 28, cy - 30), 8, skinPaint);

    // Stylish Hair
    final hairPath = Path()
      ..moveTo(cx - 30, cy - 44)
      ..quadraticBezierTo(cx - 32, cy - 78, cx - 8, cy - 82)
      ..quadraticBezierTo(cx + 26, cy - 84, cx + 34, cy - 68)
      ..quadraticBezierTo(cx + 36, cy - 42, cx + 28, cy - 34)
      ..lineTo(cx + 24, cy - 46)
      ..quadraticBezierTo(cx + 6, cy - 60, cx - 18, cy - 50)
      ..close();
    canvas.drawPath(hairPath, hairPaint);

    // Cool Black Sunglasses
    final glassesPaint = Paint()..color = const Color(0xFF1B2028);
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(cx - 24, cy - 42, 22, 14), const Radius.circular(4)),
      glassesPaint,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(cx + 2, cy - 42, 22, 14), const Radius.circular(4)),
      glassesPaint,
    );
    // Bridge
    canvas.drawLine(Offset(cx - 2, cy - 36), Offset(cx + 2, cy - 36), darkOutline);
    // Lens Glare / Reflection
    final glarePaint = Paint()..color = Colors.white.withValues(alpha: 0.5)..strokeWidth = 1.5;
    canvas.drawLine(Offset(cx - 18, cy - 40), Offset(cx - 8, cy - 32), glarePaint);
    canvas.drawLine(Offset(cx + 8, cy - 40), Offset(cx + 18, cy - 32), glarePaint);

    // Smiling Mouth
    final smilePath = Path()
      ..moveTo(cx - 10, cy - 14)
      ..quadraticBezierTo(cx, cy - 6, cx + 10, cy - 14);
    canvas.drawPath(
      smilePath,
      Paint()
        ..color = const Color(0xFF9E3D34)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.5
        ..strokeCap = StrokeCap.round,
    );

    // Camera around neck & hands
    final cameraStrap = Paint()
      ..color = const Color(0xFF263238)
      ..strokeWidth = 2.0;
    canvas.drawLine(Offset(cx - 14, cy + 18), Offset(cx - 16, cy + 62), cameraStrap);
    canvas.drawLine(Offset(cx + 14, cy + 18), Offset(cx + 16, cy + 62), cameraStrap);

    // Camera Body
    final camBody = Paint()..color = const Color(0xFF212529);
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(cx - 24, cy + 56, 48, 30), const Radius.circular(6)),
      camBody,
    );
    // Camera Lens (Circle)
    canvas.drawCircle(Offset(cx, cy + 71), 10, Paint()..color = const Color(0xFF495057));
    canvas.drawCircle(Offset(cx, cy + 71), 6, Paint()..color = const Color(0xFF00C9B7));
    canvas.drawCircle(Offset(cx - 2, cy + 69), 2, Paint()..color = Colors.white);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

