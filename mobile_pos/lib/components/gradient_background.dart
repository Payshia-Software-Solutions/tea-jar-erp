import 'package:flutter/material.dart';

class GradientBackground extends StatelessWidget {
  final Widget child;

  const GradientBackground({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;

    final baseColor = isDarkMode ? const Color(0xFF0A0A0A) : const Color(0xFFF5F5F5);
    final glowColor1 = isDarkMode ? Colors.redAccent.withOpacity(0.15) : Colors.blue.withOpacity(0.25);
    final glowColor2 = isDarkMode ? Colors.purpleAccent.withOpacity(0.08) : Colors.purple.withOpacity(0.15);

    return Container(
      color: baseColor,
      child: Stack(
        children: [
          // The gradient glow effect
          Positioned(
            top: -150,
            left: -50,
            right: -50,
            height: 500,
            child: Container(
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  center: const Alignment(0, -0.5),
                  radius: 0.8,
                  colors: [
                    glowColor1,
                    glowColor2,
                    baseColor.withOpacity(0.0),
                  ],
                  stops: const [0.0, 0.5, 1.0],
                ),
              ),
            ),
          ),
          // The actual app content (Scaffold etc.)
          child,
        ],
      ),
    );
  }
}
