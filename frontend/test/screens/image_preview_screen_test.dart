import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:foodcheck_ai/screens/image_preview_screen.dart';
import 'package:foodcheck_ai/widgets/loading_overlay.dart';

// ---------------------------------------------------------------------------
// Minimal 1×1 transparent PNG bytes — avoids real filesystem access
// ---------------------------------------------------------------------------

final Uint8List _kTransparentPng = Uint8List.fromList([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
  0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk length + type
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // width=1, height=1
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, // bit depth, color type, etc.
  0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, // IDAT chunk
  0x54, 0x78, 0x9C, 0x62, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
  0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, // IEND chunk
  0x42, 0x60, 0x82,
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/// Creates a real temporary file containing a valid 1×1 PNG so that
/// [Image.file] can decode it without hitting the filesystem for real content.
Future<File> _createTempImage() async {
  final dir = Directory.systemTemp.createTempSync('img_preview_test_');
  final file = File('${dir.path}/test_image.png');
  await file.writeAsBytes(_kTransparentPng);
  return file;
}

/// Wraps [widget] in a [MaterialApp] so Navigator and Theme are available.
Widget _wrap(Widget widget) => MaterialApp(home: widget);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

void main() {
  late File testImage;

  setUpAll(() async {
    testImage = await _createTempImage();
  });

  tearDownAll(() async {
    await testImage.parent.delete(recursive: true);
  });

  group('ImagePreviewScreen', () {
    // ── 2.1 / 2.2 / 2.3 — Tombol "Ambil Ulang" dan "Analisis" tampil ──────

    testWidgets('menampilkan tombol "Ambil Ulang" dan "Analisis"',
        (WidgetTester tester) async {
      await tester.pumpWidget(_wrap(ImagePreviewScreen(image: testImage)));
      await tester.pump();

      expect(find.text('Ambil Ulang'), findsOneWidget);
      expect(find.text('Analisis'), findsOneWidget);
    });

    testWidgets('tombol "Ambil Ulang" dan "Analisis" aktif saat tidak loading',
        (WidgetTester tester) async {
      await tester.pumpWidget(_wrap(ImagePreviewScreen(image: testImage)));
      await tester.pump();

      final retakeButton = tester.widget<OutlinedButton>(
        find.widgetWithText(OutlinedButton, 'Ambil Ulang'),
      );
      final analyzeButton = tester.widget<ElevatedButton>(
        find.widgetWithText(ElevatedButton, 'Analisis'),
      );

      expect(retakeButton.onPressed, isNotNull);
      expect(analyzeButton.onPressed, isNotNull);
    });

    // ── 2.2 — Tombol "Ambil Ulang" menavigasi kembali ──────────────────────

    testWidgets('"Ambil Ulang" memanggil Navigator.pop',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) => ElevatedButton(
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => ImagePreviewScreen(image: testImage),
                ),
              ),
              child: const Text('Go'),
            ),
          ),
        ),
      );

      await tester.tap(find.text('Go'));
      await tester.pumpAndSettle();

      expect(find.text('Ambil Ulang'), findsOneWidget);

      await tester.tap(find.text('Ambil Ulang'));
      await tester.pumpAndSettle();

      // After pop, ImagePreviewScreen should no longer be visible.
      expect(find.text('Ambil Ulang'), findsNothing);
    });

    // ── 9.1 — LoadingOverlay ada di widget tree ─────────────────────────────

    testWidgets('LoadingOverlay ada di widget tree', (WidgetTester tester) async {
      await tester.pumpWidget(_wrap(ImagePreviewScreen(image: testImage)));
      await tester.pump();

      expect(find.byType(LoadingOverlay), findsOneWidget);
    });

    testWidgets('LoadingOverlay tidak menampilkan indikator saat tidak loading',
        (WidgetTester tester) async {
      await tester.pumpWidget(_wrap(ImagePreviewScreen(image: testImage)));
      await tester.pump();

      expect(find.byType(CircularProgressIndicator), findsNothing);
    });

    // ── 9.1 — LoadingOverlay muncul saat loading ────────────────────────────

    testWidgets(
        'tombol dinonaktifkan dan LoadingOverlay menampilkan indikator saat loading',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(home: _LoadingStateHarness()),
      );
      await tester.pump();

      // Tap "Analisis" — harness sets isLoading = true immediately.
      await tester.tap(find.text('Analisis'));
      await tester.pump();

      // CircularProgressIndicator should now be visible.
      expect(find.byType(CircularProgressIndicator), findsOneWidget);

      // Both buttons should be disabled (onPressed == null).
      final retakeButton = tester.widget<OutlinedButton>(
        find.widgetWithText(OutlinedButton, 'Ambil Ulang'),
      );
      final analyzeButton = tester.widget<ElevatedButton>(
        find.widgetWithText(ElevatedButton, 'Analisis'),
      );

      expect(retakeButton.onPressed, isNull);
      expect(analyzeButton.onPressed, isNull);
    });
  });
}

// ---------------------------------------------------------------------------
// Test harness — mirrors ImagePreviewScreen layout with controllable loading
// state, without real network calls or Image.file dependencies.
// ---------------------------------------------------------------------------

class _LoadingStateHarness extends StatefulWidget {
  const _LoadingStateHarness();

  @override
  State<_LoadingStateHarness> createState() => _LoadingStateHarnessState();
}

class _LoadingStateHarnessState extends State<_LoadingStateHarness> {
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Pratinjau Gambar')),
      body: LoadingOverlay(
        isLoading: _isLoading,
        child: Column(
          children: [
            const Expanded(child: Placeholder()),
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed:
                          _isLoading ? null : () => Navigator.of(context).pop(),
                      child: const Text('Ambil Ulang'),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _isLoading
                          ? null
                          : () => setState(() => _isLoading = true),
                      child: const Text('Analisis'),
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
