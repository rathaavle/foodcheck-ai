import 'package:flutter/material.dart';

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
    return AlertDialog(
      title: const Row(
        children: [
          Icon(Icons.error_outline, color: Colors.red),
          SizedBox(width: 8),
          Text('Terjadi Kesalahan'),
        ],
      ),
      content: Text(message),
      actions: [
        if (onRetry != null)
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              onRetry!();
            },
            child: const Text('Coba Lagi'),
          ),
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Tutup'),
        ),
      ],
    );
  }
}
