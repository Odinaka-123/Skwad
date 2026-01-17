import 'package:flutter/material.dart';
import 'screens/dashboard_screen.dart';

class SkwadApp extends StatelessWidget {
  const SkwadApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Skwad',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark(useMaterial3: true),
      home: const DashboardScreen(),
    );
  }
}
