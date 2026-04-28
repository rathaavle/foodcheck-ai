import 'dart:io';
import 'package:flutter/material.dart';

// TODO: Implementasi ImagePreviewScreen
// - Tampilkan pratinjau gambar yang dipilih
// - Tombol "Ambil Ulang" (kembali ke CameraScreen) dan "Analisis" (panggil ApiService)
// - Tampilkan LoadingOverlay saat analisis berlangsung
class ImagePreviewScreen extends StatefulWidget {
  final File image;

  const ImagePreviewScreen({super.key, required this.image});

  @override
  State<ImagePreviewScreen> createState() => _ImagePreviewScreenState();
}

class _ImagePreviewScreenState extends State<ImagePreviewScreen> {
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    // TODO: Implementasi UI pratinjau gambar
    return const Scaffold(
      body: Center(child: Text('Image Preview Screen — TODO')),
    );
  }
}
