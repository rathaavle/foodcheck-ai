import 'package:flutter/material.dart';

// TODO: Implementasi CameraScreen
// - Tampilkan live preview kamera menggunakan plugin camera
// - Tombol ambil foto dan pilih dari galeri (image_picker)
// - Navigasi ke ImagePreviewScreen setelah gambar dipilih
class CameraScreen extends StatefulWidget {
  const CameraScreen({super.key});

  @override
  State<CameraScreen> createState() => _CameraScreenState();
}

class _CameraScreenState extends State<CameraScreen> {
  @override
  Widget build(BuildContext context) {
    // TODO: Implementasi UI kamera
    return const Scaffold(
      body: Center(child: Text('Camera Screen — TODO')),
    );
  }
}
