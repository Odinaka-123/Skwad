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
      backgroundColor: const Color(0xFF0F1115),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: const Color(0xFF0F1115),
        title: const Text(
          'Skwad',
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
        centerTitle: true,
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // DEVICE CARD
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF171A21),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white.withOpacity(0.05)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    "DEVICE CODE",
                    style: TextStyle(
                      color: Colors.grey,
                      fontSize: 12,
                      letterSpacing: 1.2,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    deviceCode,
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.5,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // STATUS
            Row(
              children: [
                Container(
                  width: 10,
                  height: 10,
                  decoration: BoxDecoration(
                    color: status.contains("Connected")
                        ? Colors.greenAccent
                        : Colors.orangeAccent,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 10),
                Text(
                  status,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 28),

            const Text(
              "DISCOVERED PEERS",
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.5,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 12),

            // PEERS LIST
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

                        return Container(
                          margin: const EdgeInsets.symmetric(vertical: 6),
                          decoration: BoxDecoration(
                            color: const Color(0xFF1C1F28),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: Colors.white.withOpacity(0.05),
                            ),
                          ),
                          child: ListTile(
                            leading: const Icon(
                              Icons.wifi,
                              color: Colors.lightBlueAccent,
                            ),
                            title: Text(
                              peer['deviceCode'],
                              style: const TextStyle(
                                fontWeight: FontWeight.w600,
                                color: Colors.white,
                              ),
                            ),
                            subtitle: Text(
                              '${peer['ip']} : ${peer['tcpPort']}',
                              style: const TextStyle(color: Colors.grey),
                            ),
                            trailing: IconButton(
                              icon: const Icon(
                                Icons.handshake,
                                color: Colors.greenAccent,
                              ),
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
