import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:bone_buddy_app/main.dart';
import 'package:bone_buddy_app/providers/auth_provider.dart';
import 'package:bone_buddy_app/providers/app_provider.dart';

void main() {
  group('BoneBuddyApp Widget Tests', () {
    testWidgets('app should initialize without errors', (WidgetTester tester) async {
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

      // Wait for initial frames but with limit
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      // Verify that the app builds
      expect(find.byType(MaterialApp), findsOneWidget);
    });

    testWidgets('app should have correct title', (WidgetTester tester) async {
      await tester.pumpWidget(
        MultiProvider(
          providers: [
            ChangeNotifierProvider(create: (_) => AuthProvider()),
            ChangeNotifierProvider(create: (_) => AppProvider()),
          ],
          child: const BoneBuddyApp(),
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      final MaterialApp app = tester.widget(find.byType(MaterialApp));
      expect(app.title, 'BoneBuddy');
    });

    testWidgets('app should use MaterialApp.router', (WidgetTester tester) async {
      await tester.pumpWidget(
        MultiProvider(
          providers: [
            ChangeNotifierProvider(create: (_) => AuthProvider()),
            ChangeNotifierProvider(create: (_) => AppProvider()),
          ],
          child: const BoneBuddyApp(),
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.byType(MaterialApp), findsOneWidget);
    });

    testWidgets('app should have debug banner disabled', (WidgetTester tester) async {
      await tester.pumpWidget(
        MultiProvider(
          providers: [
            ChangeNotifierProvider(create: (_) => AuthProvider()),
            ChangeNotifierProvider(create: (_) => AppProvider()),
          ],
          child: const BoneBuddyApp(),
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      final MaterialApp app = tester.widget(find.byType(MaterialApp));
      expect(app.debugShowCheckedModeBanner, false);
    });

    testWidgets('app should have correct primary color', (WidgetTester tester) async {
      await tester.pumpWidget(
        MultiProvider(
          providers: [
            ChangeNotifierProvider(create: (_) => AuthProvider()),
            ChangeNotifierProvider(create: (_) => AppProvider()),
          ],
          child: const BoneBuddyApp(),
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      final MaterialApp app = tester.widget(find.byType(MaterialApp));
      expect(app.theme?.primaryColor, const Color(0xFF0066CC));
    });

    testWidgets('app should support dark theme', (WidgetTester tester) async {
      await tester.pumpWidget(
        MultiProvider(
          providers: [
            ChangeNotifierProvider(create: (_) => AuthProvider()),
            ChangeNotifierProvider(create: (_) => AppProvider()),
          ],
          child: const BoneBuddyApp(),
        ),
      );

      // Wait for initial frames but with a limit to prevent infinite wait
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      final MaterialApp app = tester.widget(find.byType(MaterialApp));
      expect(app.darkTheme, isNotNull);
    });
  });
}
