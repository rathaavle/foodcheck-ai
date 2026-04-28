import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:foodcheck_ai/widgets/error_dialog.dart';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/// Renders a button that opens [ErrorDialog] when tapped.
Widget _scaffoldWithDialog({
  required String message,
  VoidCallback? onRetry,
}) {
  return MaterialApp(
    home: Scaffold(
      body: Builder(
        builder: (context) => ElevatedButton(
          onPressed: () =>
              ErrorDialog.show(context, message, onRetry: onRetry),
          child: const Text('Buka Dialog'),
        ),
      ),
    ),
  );
}

Future<void> _openDialog(WidgetTester tester) async {
  await tester.tap(find.text('Buka Dialog'));
  await tester.pumpAndSettle();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

void main() {
  group('ErrorDialog', () {
    // ── Persyaratan 10.1 / 10.2 — Pesan error ditampilkan ──────────────────

    testWidgets('menampilkan pesan error yang diberikan',
        (WidgetTester tester) async {
      const errorMsg = 'Gagal terhubung ke server. Periksa koneksi Anda.';
      await tester.pumpWidget(
          _scaffoldWithDialog(message: errorMsg));
      await _openDialog(tester);

      expect(find.text(errorMsg), findsOneWidget);
    });

    testWidgets('menampilkan judul "Terjadi Kesalahan"',
        (WidgetTester tester) async {
      await tester.pumpWidget(
          _scaffoldWithDialog(message: 'Error apapun'));
      await _openDialog(tester);

      expect(find.text('Terjadi Kesalahan'), findsOneWidget);
    });

    testWidgets('menampilkan ikon error', (WidgetTester tester) async {
      await tester.pumpWidget(
          _scaffoldWithDialog(message: 'Error apapun'));
      await _openDialog(tester);

      expect(find.byIcon(Icons.error_outline), findsOneWidget);
    });

    // ── Tombol "Tutup" selalu ada ────────────────────────────────────────────

    testWidgets('menampilkan tombol "Tutup"', (WidgetTester tester) async {
      await tester.pumpWidget(
          _scaffoldWithDialog(message: 'Error apapun'));
      await _openDialog(tester);

      expect(find.text('Tutup'), findsOneWidget);
    });

    testWidgets('tombol "Tutup" menutup dialog', (WidgetTester tester) async {
      await tester.pumpWidget(
          _scaffoldWithDialog(message: 'Error apapun'));
      await _openDialog(tester);

      expect(find.byType(AlertDialog), findsOneWidget);

      await tester.tap(find.text('Tutup'));
      await tester.pumpAndSettle();

      expect(find.byType(AlertDialog), findsNothing);
    });

    // ── Tombol "Coba Lagi" — hanya tampil jika onRetry diberikan ───────────

    testWidgets('tidak menampilkan tombol "Coba Lagi" jika onRetry null',
        (WidgetTester tester) async {
      await tester.pumpWidget(
          _scaffoldWithDialog(message: 'Error', onRetry: null));
      await _openDialog(tester);

      expect(find.text('Coba Lagi'), findsNothing);
    });

    testWidgets('menampilkan tombol "Coba Lagi" jika onRetry diberikan',
        (WidgetTester tester) async {
      await tester.pumpWidget(
          _scaffoldWithDialog(message: 'Error', onRetry: () {}));
      await _openDialog(tester);

      expect(find.text('Coba Lagi'), findsOneWidget);
    });

    testWidgets('tombol "Coba Lagi" memanggil callback onRetry',
        (WidgetTester tester) async {
      bool retryCalled = false;

      await tester.pumpWidget(
          _scaffoldWithDialog(message: 'Error', onRetry: () {
        retryCalled = true;
      }));
      await _openDialog(tester);

      await tester.tap(find.text('Coba Lagi'));
      await tester.pumpAndSettle();

      expect(retryCalled, isTrue);
    });

    testWidgets('tombol "Coba Lagi" menutup dialog sebelum memanggil callback',
        (WidgetTester tester) async {
      await tester.pumpWidget(
          _scaffoldWithDialog(message: 'Error', onRetry: () {}));
      await _openDialog(tester);

      expect(find.byType(AlertDialog), findsOneWidget);

      await tester.tap(find.text('Coba Lagi'));
      await tester.pumpAndSettle();

      expect(find.byType(AlertDialog), findsNothing);
    });

    // ── ErrorDialog.show — static helper ────────────────────────────────────

    testWidgets('ErrorDialog.show menampilkan dialog dengan pesan yang benar',
        (WidgetTester tester) async {
      const msg = 'Teks tidak dapat dikenali. Coba unggah ulang.';
      await tester.pumpWidget(_scaffoldWithDialog(message: msg));
      await _openDialog(tester);

      expect(find.text(msg), findsOneWidget);
      expect(find.byType(AlertDialog), findsOneWidget);
    });

    // ── Kasus tepi — pesan panjang ───────────────────────────────────────────

    testWidgets('menampilkan pesan error yang panjang tanpa overflow',
        (WidgetTester tester) async {
      const longMsg =
          'Gagal membaca teks dari gambar. Pastikan gambar cukup jelas, '
          'pencahayaan memadai, dan seluruh label terlihat dalam frame, '
          'kemudian coba lagi.';

      await tester.pumpWidget(_scaffoldWithDialog(message: longMsg));
      await _openDialog(tester);

      expect(find.text(longMsg), findsOneWidget);
      // Tidak ada RenderFlex overflow — jika ada, test akan throw error.
    });
  });
}
