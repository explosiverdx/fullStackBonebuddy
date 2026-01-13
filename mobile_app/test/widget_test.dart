import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:bone_buddy_app/main.dart';
import 'package:bone_buddy_app/providers/auth_provider.dart';
import 'package:bone_buddy_app/providers/app_provider.dart';

void main() {
  testWidgets('BoneBuddy app smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => AuthProvider()),
          ChangeNotifierProvider(create: (_) => AppProvider()),
        ],
        child: const BoneBuddyApp(),
      ),
    );

    // Wait for initial frames but with limit to prevent infinite wait
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));

    // Verify that the app builds without errors
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
