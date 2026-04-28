import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

// ─── Model: AnalysisResult ────────────────────────────────────────────────────

class AnalysisResult {
  final List<String> ingredients;
  final String riskLevel; // "HIGH" | "MEDIUM" | "LOW"
  final List<String> flaggedItems;
  final String explanation;

  const AnalysisResult({
    required this.ingredients,
    required this.riskLevel,
    required this.flaggedItems,
    required this.explanation,
  });

  factory AnalysisResult.fromJson(Map<String, dynamic> json) {
    return AnalysisResult(
      ingredients: List<String>.from(json['ingredients'] as List),
      riskLevel: json['risk_level'] as String,
      flaggedItems: List<String>.from(json['flagged_items'] as List),
      explanation: json['explanation'] as String,
    );
  }
}

// ─── Model: ApiResponse ───────────────────────────────────────────────────────

class ApiResponse {
  final String status; // "SUCCESS" | "ERROR"
  final String? warning;
  final AnalysisResult? data;
  final String? message;

  const ApiResponse({
    required this.status,
    this.warning,
    this.data,
    this.message,
  });

  bool get isSuccess => status == 'SUCCESS';

  factory ApiResponse.fromJson(Map<String, dynamic> json) {
    return ApiResponse(
      status: json['status'] as String,
      warning: json['warning'] as String?,
      data: json['data'] != null
          ? AnalysisResult.fromJson(json['data'] as Map<String, dynamic>)
          : null,
      message: json['message'] as String?,
    );
  }
}

// ─── Exception ────────────────────────────────────────────────────────────────

class ApiException implements Exception {
  final String message;
  const ApiException(this.message);

  @override
  String toString() => message;
}

// ─── ApiService ───────────────────────────────────────────────────────────────

class ApiService {
  final String baseUrl;
  final Duration timeout;
  final http.Client _client;

  ApiService({
    required this.baseUrl,
    this.timeout = const Duration(seconds: 30),
    http.Client? httpClient,
  }) : _client = httpClient ?? http.Client();

  /// Sends [imageFile] to POST /analyze and returns a parsed [ApiResponse].
  ///
  /// Throws [ApiException] on network errors, timeouts, or API-level errors.
  Future<ApiResponse> analyzeImage(File imageFile) async {
    final uri = Uri.parse('$baseUrl/analyze');

    final request = http.MultipartRequest('POST', uri);
    request.files.add(
      await http.MultipartFile.fromPath('image', imageFile.path),
    );

    http.StreamedResponse streamed;
    try {
      streamed = await _client.send(request).timeout(timeout);
    } on SocketException {
      throw const ApiException(
        'Gagal terhubung ke server. Periksa koneksi internet Anda dan coba lagi.',
      );
    } on TimeoutException {
      throw const ApiException(
        'Gagal terhubung ke server. Periksa koneksi internet Anda dan coba lagi.',
      );
    } catch (_) {
      throw const ApiException(
        'Gagal terhubung ke server. Periksa koneksi internet Anda dan coba lagi.',
      );
    }

    final body = await streamed.stream.bytesToString();

    Map<String, dynamic> json;
    try {
      json = jsonDecode(body) as Map<String, dynamic>;
    } catch (_) {
      throw const ApiException(
        'Respons dari server tidak valid. Silakan coba lagi.',
      );
    }

    final response = ApiResponse.fromJson(json);

    if (!response.isSuccess) {
      throw ApiException(
        response.message ??
            'Terjadi kesalahan. Silakan coba lagi.',
      );
    }

    return response;
  }

  // Legacy method kept for backward compatibility — delegates to analyzeImage.
  Future<Map<String, dynamic>> analyze(File image) async {
    final response = await analyzeImage(image);
    return {
      'status': response.status,
      if (response.warning != null) 'warning': response.warning,
      if (response.message != null) 'message': response.message,
      if (response.data != null)
        'data': {
          'ingredients': response.data!.ingredients,
          'risk_level': response.data!.riskLevel,
          'flagged_items': response.data!.flaggedItems,
          'explanation': response.data!.explanation,
        },
    };
  }
}
