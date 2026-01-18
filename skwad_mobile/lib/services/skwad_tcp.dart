import 'dart:convert';
import 'dart:io';

class SkwadTcpClient {
  Socket? _socket;
  final StringBuffer _buffer = StringBuffer();

  Future<void> connect({String host = '10.0.2.2', int port = 45454}) async {
    _socket = await Socket.connect(
      host,
      port,
      timeout: const Duration(seconds: 3),
    );
    print('✅ Connected to Skwad core');
  }

  void send(Map<String, dynamic> message) {
    _socket?.write(jsonEncode(message));
  }

  void listen(void Function(Map<String, dynamic>) onMessage) {
    _socket?.listen((data) {
      _buffer.write(utf8.decode(data));

      try {
        final decoded = jsonDecode(_buffer.toString());
        _buffer.clear();
        onMessage(decoded);
      } catch (_) {
        // wait for full JSON
      }
    });
  }

  void close() {
    _socket?.close();
    _socket = null;
  }
}
