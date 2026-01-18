import 'package:flutter/material.dart';
import 'services/skwad_tcp.dart';

void main() {
  runApp(const SkwadApp());
}

class SkwadApp extends StatelessWidget {
  const SkwadApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Skwad',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark(),
      home: const HomeScreen(),
    );
  }
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final SkwadTcpClient tcp = SkwadTcpClient();

  String status = 'Disconnected';
  final List<String> peers = [];

  Future<void> startDiscovery() async {
    setState(() => status = 'Connecting...');

    try {
      await tcp.connect();

      tcp.listen((msg) {
        if (msg['type'] == 'PEER_CONNECTED') {
          setState(() {
            peers.add('${msg['id']} @ ${msg['ip']}');
          });
        }
      });

      setState(() => status = 'Connected to Skwad Core');
    } catch (e) {
      setState(() => status = 'Connection failed');
    }
  }

  @override
  void dispose() {
    tcp.close();
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
              'SK-XXXX-XXXX',
              style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold),
            ),

            const SizedBox(height: 24),

            ElevatedButton(
              onPressed: startDiscovery,
              child: const Text('Start LAN Discovery'),
            ),

            const SizedBox(height: 16),
            Text('Status: $status'),

            const SizedBox(height: 24),
            const Text(
              'Discovered Peers',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),

            ...peers.map((p) => Text('• $p')),
          ],
        ),
      ),
    );
  }
}
