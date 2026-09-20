import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Figma Design System Palette (from user uploaded Figma screen designs)
  static const Color royalBlue = Color(0xFF3354F4);
  static const Color vibrantOrange = Color(0xFFFF6339);
  static const Color softBlueLight = Color(0xFFEFF4FF);
  static const Color charcoalDark = Color(0xFF1E272E);
  static const Color mutedGrey = Color(0xFFA4B0BE);

  // Legacy compatibility mappings
  static const Color oceanTeal = Color(0xFF3354F4);
  static const Color oceanTealLight = Color(0xFF5374F8);
  static const Color oceanTealSoft = Color(0xFFEFF4FF);
  static const Color backgroundAqua = Color(0xFF3354F4);

  static const Color sunsetCoral = Color(0xFFFF6339);
  static const Color coralLight = Color(0xFFFFECE7);
  static const Color beachSand = Color(0xFFFDE49E);
  static const Color sandDark = Color(0xFFF5BE58);

  static const Color skyBlue = Color(0xFF90D7EE);
  static const Color palmGreen = Color(0xFF389D7E);

  static const Color textDark = Color(0xFF1E272E);
  static const Color textMuted = Color(0xFF747D8C);
  static const Color cardWhite = Colors.white;

  static const Color surfaceMuted = Color(0xFFF8FAFD);
  static const Color borderSubtle = Color(0xFFE5E9F0);

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: surfaceMuted,
      primaryColor: royalBlue,
      colorScheme: const ColorScheme.light(
        primary: royalBlue,
        secondary: vibrantOrange,
        surface: cardWhite,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: textDark,
      ),
      textTheme: TextTheme(
        displayLarge: GoogleFonts.poppins(
          fontSize: 26,
          fontWeight: FontWeight.w700,
          color: textDark,
          letterSpacing: 1.2,
        ),
        displayMedium: GoogleFonts.poppins(
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: textDark,
          letterSpacing: 1.0,
        ),
        headlineMedium: GoogleFonts.poppins(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: textDark,
        ),
        titleMedium: GoogleFonts.poppins(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: textDark,
        ),
        bodyLarge: GoogleFonts.poppins(
          fontSize: 14,
          fontWeight: FontWeight.w400,
          color: textDark,
        ),
        bodyMedium: GoogleFonts.poppins(
          fontSize: 13,
          fontWeight: FontWeight.w400,
          color: textMuted,
        ),
        labelLarge: GoogleFonts.poppins(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.5,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: oceanTeal,
          foregroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          textStyle: GoogleFonts.poppins(
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      cardTheme: CardThemeData(
        color: cardWhite,
        elevation: 2,
        shadowColor: oceanTeal.withValues(alpha: 0.08),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(28),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: oceanTealSoft,
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(20),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(20),
          borderSide: const BorderSide(color: borderSubtle, width: 1.2),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(20),
          borderSide: const BorderSide(color: oceanTeal, width: 2),
        ),
      ),
    );
  }
}
