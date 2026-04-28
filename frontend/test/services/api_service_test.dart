import 'dart:async';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

import 'package:foodcheck_ai/services/api_service.dart';

void main() {
  late Directory tempDir;
  late File tempImage;

  setUp(() async {
    tempDir = await Directory.systemTemp.createTemp('api_service_test_');
    tempImage = File('${tempDir.path}/test_image.jpg');
    await tempImage.writeAsBytes([0xFF, 0xD8, 0xFF, 0xE0]); // minimal JPEG header
  });

  tearDown(() async {
    await tempDir.delete(recursive: true);
  });

  // ─── Helper ────────────────────────────────────────────────────────────────

  ApiService _makeService(MockClient mockClient) {
    return ApiService(
      baseUrl: 'http://localhost:3000',
      httpClient: mockClient,
    );
  }

  http.Response _mockResponse(String body, {int statusCode = 200}) {
    return http.Response(body, statusCode);
  }

  // ─── Success case ──────────────────────────────────────────────────────────

  test('analyzeImage returns ApiResponse on success', () async {
    const responseBody = '''
{
  "status": "SUCCESS",
  "data": {
    "ingredients": ["gula", "natrium benzoat"],
    "risk_level": "HIGH",
    "flagged_items": ["gula", "natrium benzoat"],
    "explanation": "Mengandung gula tinggi dan pengawet berbahaya."
  }
}''';

    final client = MockClient((_) async => _mockResponse(responseBody));
    final service = _makeService(client);

    final response = await service.analyzeImage(tempImage);

    expect(response.isSuccess, isTrue);
    expect(response.data, isNotNull);
    expect(response.data!.ingredients, equals(['gula', 'natrium benzoat']));
    expect(response.data!.riskLevel, equals('HIGH'));
    expect(response.data!.flaggedItems, equals(['gula', 'natrium benzoat']));
    expect(response.data!.explanation, equals('Mengandung gula tinggi dan pengawet berbahaya.'));
  });

  // ─── Success with warning ──────────────────────────────────────────────────

  test('analyzeImage returns warning when translation unavailable', () async {
    const responseBody = '''
{
  "status": "SUCCESS",
  "warning": "Terjemahan tidak tersedia. Analisis dilakukan menggunakan teks asli.",
  "data": {
    "ingredients": ["sugar"],
    "risk_level": "MEDIUM",
    "flagged_items": ["sugar"],
    "explanation": "Contains sugar."
  }
}''';

    final client = MockClient((_) async => _mockResponse(responseBody));
    final service = _makeService(client);

    final response = await service.analyzeImage(tempImage);

    expect(response.isSuccess, isTrue);
    expect(response.warning, isNotNull);
    expect(response.warning, contains('Terjemahan tidak tersedia'));
  });

  // ─── API-level error ───────────────────────────────────────────────────────

  test('analyzeImage throws ApiException with server message on ERROR status', () async {
    const responseBody = '''
{
  "status": "ERROR",
  "message": "Gagal membaca teks dari gambar. Pastikan gambar cukup jelas dan coba lagi."
}''';

    final client = MockClient((_) async => _mockResponse(responseBody));
    final service = _makeService(client);

    expect(
      () => service.analyzeImage(tempImage),
      throwsA(
        isA<ApiException>().having(
          (e) => e.message,
          'message',
          'Gagal membaca teks dari gambar. Pastikan gambar cukup jelas dan coba lagi.',
        ),
      ),
    );
  });

  test('analyzeImage throws ApiException with fallback message when ERROR has no message', () async {
    const responseBody = '{"status": "ERROR"}';

    final client = MockClient((_) async => _mockResponse(responseBody));
    final service = _makeService(client);

    expect(
      () => service.analyzeImage(tempImage),
      throwsA(
        isA<ApiException>().having(
          (e) => e.message,
          'message',
          'Terjadi kesalahan. Silakan coba lagi.',
        ),
      ),
    );
  });

  // ─── Network error (SocketException) ──────────────────────────────────────

  test('analyzeImage throws ApiException on SocketException', () async {
    final client = MockClient((_) async => throw const SocketException('No route to host'));
    final service = _makeService(client);

    expect(
      () => service.analyzeImage(tempImage),
      throwsA(
        isA<ApiException>().having(
          (e) => e.message,
          'message',
          'Gagal terhubung ke server. Periksa koneksi internet Anda dan coba lagi.',
        ),
      ),
    );
  });

  // ─── Timeout ──────────────────────────────────────────────────────────────

  test('analyzeImage throws ApiException on TimeoutException', () async {
    final client = MockClient((_) async => throw TimeoutException('Request timed out'));
    final service = ApiService(
      baseUrl: 'http://localhost:3000',
      timeout: const Duration(milliseconds: 1),
      httpClient: client,
    );

    expect(
      () => service.analyzeImage(tempImage),
      throwsA(
        isA<ApiException>().having(
          (e) => e.message,
          'message',
          'Gagal terhubung ke server. Periksa koneksi internet Anda dan coba lagi.',
        ),
      ),
    );
  });

  // ─── Invalid JSON ──────────────────────────────────────────────────────────

  test('analyzeImage throws ApiException on invalid JSON response', () async {
    final client = MockClient((_) async => _mockResponse('not valid json'));
    final service = _makeService(client);

    expect(
      () => service.analyzeImage(tempImage),
      throwsA(
        isA<ApiException>().having(
          (e) => e.message,
          'message',
          'Respons dari server tidak valid. Silakan coba lagi.',
        ),
      ),
    );
  });

  // ─── Non-200 HTTP status ───────────────────────────────────────────────────

  test('analyzeImage throws ApiException on HTTP 500 with error JSON', () async {
    const responseBody = '''
{
  "status": "ERROR",
  "message": "Internal server error"
}''';

    final client = MockClient((_) async => _mockResponse(responseBody, statusCode: 500));
    final service = _makeService(client);

    expect(
      () => service.analyzeImage(tempImage),
      throwsA(isA<ApiException>()),
    );
  });

  test('analyzeImage throws ApiException on HTTP 400 with error JSON', () async {
    const responseBody = '''
{
  "status": "ERROR",
  "message": "Silakan pilih atau ambil gambar terlebih dahulu"
}''';

    final client = MockClient((_) async => _mockResponse(responseBody, statusCode: 400));
    final service = _makeService(client);

    expect(
      () => service.analyzeImage(tempImage),
      throwsA(
        isA<ApiException>().having(
          (e) => e.message,
          'message',
          'Silakan pilih atau ambil gambar terlebih dahulu',
        ),
      ),
    );
  });
}
