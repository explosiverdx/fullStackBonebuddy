import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:bone_buddy_app/providers/app_provider.dart';

void main() {
  group('AppProvider', () {
    late AppProvider appProvider;

    setUp(() {
      appProvider = AppProvider();
    });

    test('should initialize with light theme', () {
      expect(appProvider.themeMode, ThemeMode.light);
    });

    test('setThemeMode should update theme mode', () {
      appProvider.setThemeMode(ThemeMode.dark);
      expect(appProvider.themeMode, ThemeMode.dark);

      appProvider.setThemeMode(ThemeMode.light);
      expect(appProvider.themeMode, ThemeMode.light);

      appProvider.setThemeMode(ThemeMode.system);
      expect(appProvider.themeMode, ThemeMode.system);
    });

    test('toggleTheme should switch between light and dark', () {
      // Start with light
      expect(appProvider.themeMode, ThemeMode.light);

      // Toggle to dark
      appProvider.toggleTheme();
      expect(appProvider.themeMode, ThemeMode.dark);

      // Toggle back to light
      appProvider.toggleTheme();
      expect(appProvider.themeMode, ThemeMode.light);
    });

    test('should notify listeners when theme changes', () {
      bool listenerCalled = false;

      appProvider.addListener(() {
        listenerCalled = true;
      });

      appProvider.setThemeMode(ThemeMode.dark);
      expect(listenerCalled, true);
    });

    test('should notify listeners when theme is toggled', () {
      int listenerCallCount = 0;

      appProvider.addListener(() {
        listenerCallCount++;
      });

      appProvider.toggleTheme();
      expect(listenerCallCount, 1);

      appProvider.toggleTheme();
      expect(listenerCallCount, 2);
    });

    test('should handle multiple listeners', () {
      int listenerCallCount = 0;

      appProvider.addListener(() {
        listenerCallCount++;
      });

      appProvider.addListener(() {
        listenerCallCount++;
      });

      appProvider.setThemeMode(ThemeMode.dark);
      expect(listenerCallCount, 2);
    });
  });
}
