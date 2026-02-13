import 'package:flutter/material.dart';
import 'screens/dashboard_screen.dart';

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
      home: const DashboardScreen(),
    );
  }
}
