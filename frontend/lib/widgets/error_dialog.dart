import 'package:flutter/material.dart';

// TODO: Implementasi ErrorDialog
// - Tampilkan pesan error dan saran tindakan kepada pengguna
class ErrorDialog extends StatelessWidget {
  final String message;
  final VoidCallback? onRetry;

  const ErrorDialog({
    super.key,
    required this.message,
    this.onRetry,
  });

  static Future<void> show(BuildContext context, String message, {VoidCallback? onRetry}) {
    return showDialog(
      context: context,
      builder: (_) => ErrorDialog(message: message, onRetry: onRetry),
    );
  }

  @override
  Widget build(BuildContext context) {
    // TODO: Implementasi UI dialog error
    return AlertDialog(
      title: const Text('Terjadi Kesalahan'),
      content: Text(message),
      actions: [
        if (onRetry != null)
          TextButton(onPressed: onRetry, child: const Text('Coba Lagi')),
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Tutup'),
        ),
      ],
    );
  }
}
