import 'dart:convert';
import 'dart:io';

class SkwadTcpClient {
  Socket? _socket;
  final StringBuffer _buffer = StringBuffer();

  /// ===== CONNECT =====
  Future<void> connect({
    String host = "10.0.2.2",
    int port = 45454,
    required String deviceCode,
    required void Function(Map<String, dynamic>) onMessage,
  }) async {
    _socket = await Socket.connect(
      host,
      port,
      timeout: const Duration(seconds: 3),
    );

    print("✅ Connected to Skwad core");

    _listen(onMessage);
    _sendHello(deviceCode);
  }

  /// ===== INTERNAL LISTENER =====
  void _listen(void Function(Map<String, dynamic>) onMessage) {
    _socket!.listen((data) {
      _buffer.write(utf8.decode(data));

      try {
        final decoded = jsonDecode(_buffer.toString());
        _buffer.clear();
        onMessage(decoded);
      } catch (_) {
        // Wait for full JSON frame
      }
    });
  }

  /// ===== SEND RAW =====
  void _send(Map<String, dynamic> message) {
    _socket?.write(jsonEncode(message));
  }

  /// ===== HANDSHAKE =====
  void _sendHello(String deviceCode) {
    _send({
      "type": "HELLO",
      "deviceCode": deviceCode,
      // TEMP — crypto comes later
      "publicKeyHex": "TEMP_PUBLIC_KEY",
    });
  }

  /// ===== TRUST REQUEST =====
  void sendTrustRequest({required String from, required String to}) {
    _send({"type": "TRUST_REQUEST", "from": from, "to": to});
  }

  /// ===== CLEANUP =====
  void close() {
    _socket?.close();
    _socket = null;
  }
}
