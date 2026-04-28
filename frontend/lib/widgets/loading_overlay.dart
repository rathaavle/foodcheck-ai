import 'package:flutter/material.dart';

// TODO: Implementasi LoadingOverlay
// - Widget overlay dengan indikator loading yang terlihat jelas
// - Tampil saat pemrosesan berlangsung, hilang setelah selesai
class LoadingOverlay extends StatelessWidget {
  final bool isLoading;
  final Widget child;

  const LoadingOverlay({
    super.key,
    required this.isLoading,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    // TODO: Implementasi overlay loading
    return Stack(
      children: [
        child,
        if (isLoading)
          const Center(child: CircularProgressIndicator()),
      ],
    );
  }
}
