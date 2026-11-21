import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:tepuy_condo_nexus_mobile/core/accessibility/accessibility_scaler.dart';
import 'package:tepuy_condo_nexus_mobile/core/models/resident_account.dart';
import 'package:tepuy_condo_nexus_mobile/core/models/circular.dart';
import 'package:tepuy_condo_nexus_mobile/features/home/resident_home_screen.dart';
import 'package:tepuy_condo_nexus_mobile/l10n/app_localizations.dart';

void main() {
  group('AccessibilityScaler & Senior Mode Tests', () {
    test('AccessibilityScaler en Senior Mode garantiza fontSizeBase >= 20.0px y altura >= 80dp', () {
      const scaler = AccessibilityScaler(isSeniorMode: true, userScaleFactor: 1.0);

      // Verificación de altura mínima del área táctil (Regla inviolable: >= 80dp)
      expect(scaler.effectiveTouchTargetHeight, greaterThanOrEqualTo(80.0));

      // Verificación de tamaño de fuente efectivo en Senior Mode
      final scaledFont = scaler.scaleFontSize(16.0);
      expect(scaledFont, greaterThanOrEqualTo(20.0));

      // Verificación de borde arquitectónico fiduciario limpio (1.2dp en Senior Mode)
      expect(scaler.highContrastBorderWidth, equals(1.2));
    });

    test('AccessibilityScaler escala dinámicamente con userScaleFactor', () {
      const scalerBase = AccessibilityScaler(isSeniorMode: true, userScaleFactor: 1.0);
      const scalerLarge = AccessibilityScaler(isSeniorMode: true, userScaleFactor: 1.5);

      final fontBase = scalerBase.scaleFontSize(20.0);
      final fontLarge = scalerLarge.scaleFontSize(20.0);

      expect(fontLarge, greaterThan(fontBase));
      expect(fontLarge, closeTo(fontBase * 1.5, 0.01));
    });
  });

  group('Domain Models Tests', () {
    test('ResidentAccount maneja correctamente datos multimoneda', () {
      final account = ResidentAccount.mock();

      expect(account.buildingName, isNotEmpty);
      expect(account.unitNumber, isNotEmpty);
      expect(account.balanceUsd, '45.20');
      expect(account.localCurrencyCode, 'VES');
      expect(account.exchangeRateApplied, '36.5000');
      expect(account.isSolvent, isFalse);
    });

    test('CircularNotice contiene datos válidos y banderas de urgencia', () {
      final mocks = CircularNotice.getMocks();

      expect(mocks, isNotEmpty);
      expect(mocks.any((c) => c.isUrgent), isTrue);
      expect(mocks.first.title, isNotEmpty);
    });
  });

  group('ResidentHomeScreen Widget & Sacred Buttons Tests', () {
    Widget createHomeScreen() {
      return MaterialApp(
        locale: const Locale('es'),
        localizationsDelegates: const [
          AppLocalizations.delegate,
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        supportedLocales: AppLocalizations.supportedLocales,
        home: ResidentHomeScreen(
          currentLocale: const Locale('es'),
          onLanguageChanged: (newLocale) {},
        ),
      );
    }

    testWidgets('Renderiza los 3 Botones Sagrados con textos legibles y accesibles', (tester) async {
      await tester.pumpWidget(createHomeScreen());
      await tester.pumpAndSettle();

      // Botón Sagrado 1: Estado de Cuenta
      expect(find.textContaining('ESTADO DE CUENTA'), findsOneWidget);

      // Botón Sagrado 2: Reportar Incidencia
      expect(find.textContaining('REPORTAR INCIDENCIA'), findsOneWidget);

      // Botón Sagrado 3: Circulares & Avisos
      expect(find.textContaining('CIRCULARES & AVISOS'), findsOneWidget);

      // Controles Senior de escalado visual (A- / A+)
      expect(find.text('A-'), findsOneWidget);
      expect(find.text('A+'), findsOneWidget);
    });
  });
}
