import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:foodcheck_ai/screens/analysis_result_screen.dart';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/// Wraps [widget] in a [MaterialApp] so Theme and Navigator are available.
Widget _wrap(Widget widget) => MaterialApp(home: widget);

/// Builds an [AnalysisResultScreen] with the given parameters.
Widget _buildScreen({
  List<String> ingredients = const [],
  List<String> flaggedItems = const [],
  String riskLevel = 'LOW',
  String explanation = 'Tidak ada kandungan berbahaya.',
}) {
  return _wrap(
    AnalysisResultScreen(
      ingredients: ingredients,
      flaggedItems: flaggedItems,
      riskLevel: riskLevel,
      explanation: explanation,
    ),
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

void main() {
  group('AnalysisResultScreen', () {
    // ── Persyaratan 8.1 — Daftar bahan ditampilkan ─────────────────────────

    testWidgets('menampilkan semua ingredients sebagai chip',
        (WidgetTester tester) async {
      await tester.pumpWidget(_buildScreen(
        ingredients: ['gula', 'natrium benzoat', 'perisa buatan'],
        riskLevel: 'HIGH',
        flaggedItems: ['gula', 'natrium benzoat'],
      ));

      expect(find.text('gula'), findsOneWidget);
      expect(find.text('natrium benzoat'), findsOneWidget);
      expect(find.text('perisa buatan'), findsOneWidget);
    });

    testWidgets('menampilkan teks "Daftar Bahan" sebagai judul seksi',
        (WidgetTester tester) async {
      await tester.pumpWidget(_buildScreen(
        ingredients: ['tepung terigu'],
        riskLevel: 'LOW',
      ));

      expect(find.text('Daftar Bahan'), findsOneWidget);
    });

    // ── Persyaratan 8.2 — flagged_items di-highlight ────────────────────────

    testWidgets('flagged_items ditampilkan dengan warna merah (highlight)',
        (WidgetTester tester) async {
      await tester.pumpWidget(_buildScreen(
        ingredients: ['gula', 'air', 'garam'],
        flaggedItems: ['gula'],
        riskLevel: 'HIGH',
      ));

      // Find the Chip for 'gula' and verify its backgroundColor is red.
      final flaggedChip = tester.widget<Chip>(
        find.ancestor(
          of: find.text('gula'),
          matching: find.byType(Chip),
        ),
      );
      expect(flaggedChip.backgroundColor, Colors.red.shade400);
    });

    testWidgets('bahan tidak berisiko tidak memiliki highlight merah',
        (WidgetTester tester) async {
      await tester.pumpWidget(_buildScreen(
        ingredients: ['gula', 'air'],
        flaggedItems: ['gula'],
        riskLevel: 'HIGH',
      ));

      final safeChip = tester.widget<Chip>(
        find.ancestor(
          of: find.text('air'),
          matching: find.byType(Chip),
        ),
      );
      expect(safeChip.backgroundColor, isNot(Colors.red.shade400));
    });

    testWidgets('tidak ada highlight saat flaggedItems kosong',
        (WidgetTester tester) async {
      await tester.pumpWidget(_buildScreen(
        ingredients: ['tepung terigu', 'air', 'garam'],
        flaggedItems: [],
        riskLevel: 'LOW',
      ));

      final chips = tester.widgetList<Chip>(find.byType(Chip));
      for (final chip in chips) {
        expect(chip.backgroundColor, isNot(Colors.red.shade400));
      }
    });

    // ── Persyaratan 8.1 — Badge risk_level ditampilkan ─────────────────────

    testWidgets('menampilkan badge "RISIKO TINGGI" untuk riskLevel HIGH',
        (WidgetTester tester) async {
      await tester.pumpWidget(_buildScreen(
        ingredients: ['gula'],
        flaggedItems: ['gula'],
        riskLevel: 'HIGH',
      ));

      expect(find.text('RISIKO TINGGI'), findsOneWidget);
    });

    testWidgets('menampilkan badge "RISIKO SEDANG" untuk riskLevel MEDIUM',
        (WidgetTester tester) async {
      await tester.pumpWidget(_buildScreen(
        ingredients: ['pemanis buatan'],
        flaggedItems: ['pemanis buatan'],
        riskLevel: 'MEDIUM',
      ));

      expect(find.text('RISIKO SEDANG'), findsOneWidget);
    });

    testWidgets('menampilkan badge "RISIKO RENDAH" untuk riskLevel LOW',
        (WidgetTester tester) async {
      await tester.pumpWidget(_buildScreen(
        ingredients: ['air', 'garam'],
        flaggedItems: [],
        riskLevel: 'LOW',
      ));

      expect(find.text('RISIKO RENDAH'), findsOneWidget);
    });

    testWidgets('badge HIGH berwarna merah', (WidgetTester tester) async {
      await tester.pumpWidget(_buildScreen(
        ingredients: ['gula'],
        flaggedItems: ['gula'],
        riskLevel: 'HIGH',
      ));

      final badgeContainer = tester.widget<Container>(
        find.ancestor(
          of: find.text('RISIKO TINGGI'),
          matching: find.byType(Container),
        ).first,
      );
      final decoration = badgeContainer.decoration as BoxDecoration;
      expect(decoration.color, Colors.red);
    });

    testWidgets('badge MEDIUM berwarna oranye', (WidgetTester tester) async {
      await tester.pumpWidget(_buildScreen(
        ingredients: ['pemanis buatan'],
        flaggedItems: ['pemanis buatan'],
        riskLevel: 'MEDIUM',
      ));

      final badgeContainer = tester.widget<Container>(
        find.ancestor(
          of: find.text('RISIKO SEDANG'),
          matching: find.byType(Container),
        ).first,
      );
      final decoration = badgeContainer.decoration as BoxDecoration;
      expect(decoration.color, Colors.orange);
    });

    testWidgets('badge LOW berwarna hijau', (WidgetTester tester) async {
      await tester.pumpWidget(_buildScreen(
        ingredients: ['air'],
        flaggedItems: [],
        riskLevel: 'LOW',
      ));

      final badgeContainer = tester.widget<Container>(
        find.ancestor(
          of: find.text('RISIKO RENDAH'),
          matching: find.byType(Container),
        ).first,
      );
      final decoration = badgeContainer.decoration as BoxDecoration;
      expect(decoration.color, Colors.green);
    });

    // ── Persyaratan 8.1 — Teks explanation ditampilkan ─────────────────────

    testWidgets('menampilkan teks explanation dari AI',
        (WidgetTester tester) async {
      const explanationText =
          'Produk ini mengandung kadar gula tinggi yang perlu diperhatikan.';

      await tester.pumpWidget(_buildScreen(
        ingredients: ['gula'],
        flaggedItems: ['gula'],
        riskLevel: 'HIGH',
        explanation: explanationText,
      ));

      expect(find.text(explanationText), findsOneWidget);
    });

    testWidgets('menampilkan judul "Penjelasan AI"',
        (WidgetTester tester) async {
      await tester.pumpWidget(_buildScreen(explanation: 'Aman dikonsumsi.'));

      expect(find.text('Penjelasan AI'), findsOneWidget);
    });

    // ── Persyaratan 8.1 — AppBar dan struktur layar ─────────────────────────

    testWidgets('menampilkan AppBar dengan judul "Hasil Analisis"',
        (WidgetTester tester) async {
      await tester.pumpWidget(_buildScreen());

      expect(find.text('Hasil Analisis'), findsOneWidget);
    });

    // ── Kasus tepi — daftar bahan kosong ────────────────────────────────────

    testWidgets('menampilkan layar tanpa error saat ingredients kosong',
        (WidgetTester tester) async {
      await tester.pumpWidget(_buildScreen(
        ingredients: [],
        flaggedItems: [],
        riskLevel: 'LOW',
        explanation: 'Tidak ada bahan teridentifikasi.',
      ));

      expect(find.text('Daftar Bahan'), findsOneWidget);
      expect(find.byType(Chip), findsNothing);
    });

    // ── Kasus tepi — riskLevel case-insensitive ──────────────────────────────

    testWidgets('menangani riskLevel huruf kecil dengan benar',
        (WidgetTester tester) async {
      await tester.pumpWidget(_buildScreen(
        ingredients: ['gula'],
        flaggedItems: ['gula'],
        riskLevel: 'high',
      ));

      expect(find.text('RISIKO TINGGI'), findsOneWidget);
    });
  });
}
