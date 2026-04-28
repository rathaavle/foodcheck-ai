import 'dart:io';

// TODO: Implementasi ApiService
// - POST /analyze dengan multipart/form-data menggunakan http
// - Parse respons JSON menjadi model Dart (ApiResponse, AnalysisResult)
// - Tangani error jaringan dan timeout
class ApiService {
  final String baseUrl;

  ApiService({required this.baseUrl});

  // TODO: Implementasi metode analyze
  Future<Map<String, dynamic>> analyze(File image) async {
    throw UnimplementedError('analyze() belum diimplementasikan');
  }
}
