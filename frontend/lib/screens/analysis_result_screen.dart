import 'package:flutter/material.dart';

// TODO: Implementasi AnalysisResultScreen
// - Tampilkan daftar ingredients dengan highlight untuk flagged_items
// - Tampilkan badge risk_level (HIGH/MEDIUM/LOW) dengan warna berbeda
// - Tampilkan explanation dari AI
class AnalysisResultScreen extends StatelessWidget {
  final List<String> ingredients;
  final List<String> flaggedItems;
  final String riskLevel;
  final String explanation;

  const AnalysisResultScreen({
    super.key,
    required this.ingredients,
    required this.flaggedItems,
    required this.riskLevel,
    required this.explanation,
  });

  @override
  Widget build(BuildContext context) {
    // TODO: Implementasi UI hasil analisis
    return const Scaffold(
      body: Center(child: Text('Analysis Result Screen — TODO')),
    );
  }
}
