import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:foodcheck_ai/widgets/loading_overlay.dart';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/// Wraps [LoadingOverlay] in a fixed 400×600 box so Positioned.fill has room.
Widget _buildOverlay({required bool isLoading, Widget child = const SizedBox.expand()}) {
  return MaterialApp(
    home: SizedBox(
      width: 400,
      height: 600,
      child: LoadingOverlay(isLoading: isLoading, child: child),
    ),
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

void main() {
  group('LoadingOverlay', () {
    // ── Persyaratan 9.1 — Indikator loading tampil saat isLoading = true ───

    testWidgets('menampilkan CircularProgressIndicator saat isLoading = true',
        (WidgetTester tester) async {
      await tester.pumpWidget(_buildOverlay(isLoading: true));

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('menampilkan teks "Memproses..." saat isLoading = true',
        (WidgetTester tester) async {
      await tester.pumpWidget(_buildOverlay(isLoading: true));

      expect(find.text('Memproses...'), findsOneWidget);
    });

    testWidgets('menampilkan overlay gelap saat isLoading = true',
        (WidgetTester tester) async {
      await tester.pumpWidget(_buildOverlay(isLoading: true));

      expect(find.byType(ColoredBox), findsOneWidget);
      final coloredBox = tester.widget<ColoredBox>(find.byType(ColoredBox));
      expect(coloredBox.color, Colors.black54);
    });

    // ── Persyaratan 9.1 — Indikator loading hilang saat isLoading = false ──

    testWidgets(
        'tidak menampilkan CircularProgressIndicator saat isLoading = false',
        (WidgetTester tester) async {
      await tester.pumpWidget(_buildOverlay(isLoading: false));

      expect(find.byType(CircularProgressIndicator), findsNothing);
    });

    testWidgets('tidak menampilkan teks "Memproses..." saat isLoading = false',
        (WidgetTester tester) async {
      await tester.pumpWidget(_buildOverlay(isLoading: false));

      expect(find.text('Memproses...'), findsNothing);
    });

    testWidgets('tidak menampilkan overlay gelap saat isLoading = false',
        (WidgetTester tester) async {
      await tester.pumpWidget(_buildOverlay(isLoading: false));

      expect(find.byType(ColoredBox), findsNothing);
    });

    // ── Child selalu dirender ────────────────────────────────────────────────

    testWidgets('child tetap dirender saat isLoading = true',
        (WidgetTester tester) async {
      await tester.pumpWidget(_buildOverlay(
        isLoading: true,
        child: const Text('konten di bawah'),
      ));

      expect(find.text('konten di bawah'), findsOneWidget);
    });

    testWidgets('child dirender saat isLoading = false',
        (WidgetTester tester) async {
      await tester.pumpWidget(_buildOverlay(
        isLoading: false,
        child: const Text('konten terlihat'),
      ));

      expect(find.text('konten terlihat'), findsOneWidget);
    });

    // ── Transisi state loading ───────────────────────────────────────────────

    testWidgets('indikator muncul lalu hilang setelah state berubah',
        (WidgetTester tester) async {
      bool isLoading = true;

      await tester.pumpWidget(
        StatefulBuilder(
          builder: (context, setState) => MaterialApp(
            home: Column(
              children: [
                SizedBox(
                  width: 400,
                  height: 500,
                  child: LoadingOverlay(
                    isLoading: isLoading,
                    child: const SizedBox.expand(),
                  ),
                ),
                ElevatedButton(
                  onPressed: () => setState(() => isLoading = false),
                  child: const Text('Selesai'),
                ),
              ],
            ),
          ),
        ),
      );

      // Loading aktif — indikator tampil.
      expect(find.byType(CircularProgressIndicator), findsOneWidget);

      // Ubah state ke tidak loading.
      await tester.tap(find.text('Selesai'));
      await tester.pump();

      // Indikator harus hilang.
      expect(find.byType(CircularProgressIndicator), findsNothing);
    });
  });
}
