import 'dart:io';
import 'package:flutter/material.dart';

import '../services/api_service.dart';
import '../widgets/error_dialog.dart';
import '../widgets/loading_overlay.dart';
import 'analysis_result_screen.dart';

class ImagePreviewScreen extends StatefulWidget {
  final File image;

  const ImagePreviewScreen({super.key, required this.image});

  @override
  State<ImagePreviewScreen> createState() => _ImagePreviewScreenState();
}

class _ImagePreviewScreenState extends State<ImagePreviewScreen> {
  bool _isLoading = false;

  Future<void> _analyzeImage() async {
    setState(() => _isLoading = true);

    try {
      final apiService = ApiService(baseUrl: 'http://10.0.2.2:3000');
      final response = await apiService.analyzeImage(widget.image);

      if (!mounted) return;

      final data = response.data!;
      await Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => AnalysisResultScreen(
            ingredients: data.ingredients,
            flaggedItems: data.flaggedItems,
            riskLevel: data.riskLevel,
            explanation: data.explanation,
          ),
        ),
      );
    } on ApiException catch (e) {
      if (!mounted) return;
      await ErrorDialog.show(context, e.message);
    } catch (e) {
      if (!mounted) return;
      await ErrorDialog.show(context, 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Pratinjau Gambar'),
        automaticallyImplyLeading: false,
      ),
      body: LoadingOverlay(
        isLoading: _isLoading,
        child: Column(
          children: [
            Expanded(
              child: Image.file(
                widget.image,
                fit: BoxFit.contain,
                width: double.infinity,
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _isLoading
                          ? null
                          : () => Navigator.of(context).pop(),
                      child: const Text('Ambil Ulang'),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _analyzeImage,
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
