import 'package:flutter/material.dart';
import '../services/skwad_tcp.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final SkwadTcpClient _client = SkwadTcpClient();

  String status = 'Disconnected';
  final List<Map<String, dynamic>> peers = [];

  static const String deviceCode = "SK-5E22-1DB0";

  @override
  void initState() {
    super.initState();
    _connectToCore();
  }

  Future<void> _connectToCore() async {
    setState(() => status = 'Connecting to core...');

    try {
      await _client.connect(deviceCode: deviceCode, onMessage: _handleMessage);

      setState(() => status = 'Connected to Skwad Core');
    } catch (e) {
      setState(() => status = 'Connection failed');
    }
  }

  void _handleMessage(Map<String, dynamic> message) {
    if (message['type'] == 'LAN_PEER_FOUND') {
      final peer = message['peer'];

      final exists = peers.any((p) => p['deviceCode'] == peer['deviceCode']);

      if (!exists) {
        setState(() => peers.add(peer));
      }
    }

    if (message['type'] == 'TRUST_REQUEST_IN') {
      debugPrint("🤝 Trust request from ${message['from']}");
    }
  }

  @override
  void dispose() {
    _client.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('🛰 Skwad')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Device Code', style: TextStyle(color: Colors.grey)),
            const SizedBox(height: 6),
            const Text(
              deviceCode,
              style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 24),
            Text(
              'Status: $status',
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 24),
            const Text(
              'Discovered Peers',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: peers.isEmpty
                  ? const Center(
                      child: Text(
                        'No peers found yet',
                        style: TextStyle(color: Colors.grey),
                      ),
                    )
                  : ListView.builder(
                      itemCount: peers.length,
                      itemBuilder: (context, index) {
                        final peer = peers[index];

                        return Card(
                          child: ListTile(
                            leading: const Icon(Icons.wifi),
                            title: Text(peer['deviceCode']),
                            subtitle: Text(
                              '${peer['ip']} : ${peer['tcpPort']}',
                            ),
                            trailing: IconButton(
                              icon: const Icon(Icons.handshake),
                              onPressed: () {
                                _client.sendTrustRequest(
                                  from: deviceCode,
                                  to: peer['deviceCode'],
                                );
                              },
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
