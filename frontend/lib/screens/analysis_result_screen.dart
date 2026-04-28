import 'package:flutter/material.dart';

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

  Color _riskColor() {
    switch (riskLevel.toUpperCase()) {
      case 'HIGH':
        return Colors.red;
      case 'MEDIUM':
        return Colors.orange;
      default:
        return Colors.green;
    }
  }

  String _riskLabel() {
    switch (riskLevel.toUpperCase()) {
      case 'HIGH':
        return 'RISIKO TINGGI';
      case 'MEDIUM':
        return 'RISIKO SEDANG';
      default:
        return 'RISIKO RENDAH';
    }
  }

  @override
  Widget build(BuildContext context) {
    final riskColor = _riskColor();
    final flaggedSet = flaggedItems.map((e) => e.toLowerCase()).toSet();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Hasil Analisis'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Risk level badge
            Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                decoration: BoxDecoration(
                  color: riskColor,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  _riskLabel(),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Explanation card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Penjelasan AI',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    Text(explanation),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Ingredients list
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Daftar Bahan',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: ingredients.map((ingredient) {
                        final isFlagged = flaggedSet.contains(ingredient.toLowerCase());
                        return Chip(
                          label: Text(
                            ingredient,
                            style: TextStyle(
                              color: isFlagged ? Colors.white : null,
                              fontWeight: isFlagged ? FontWeight.bold : null,
                            ),
                          ),
                          backgroundColor: isFlagged ? Colors.red.shade400 : null,
                        );
                      }).toList(),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
