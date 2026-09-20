import 'package:flutter/material.dart';
import '../widgets/figma_illustrations.dart';

class OnboardingScreen extends StatelessWidget {
  final VoidCallback onFinish;

  const OnboardingScreen({super.key, required this.onFinish});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF3354F4), // Royal blue background from Figma
      body: FigmaMapTravelerHero(
        onGetStarted: onFinish,
      ),
    );
  }
}
