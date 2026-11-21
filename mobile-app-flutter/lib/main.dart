import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'core/services/auth_service.dart';
import 'core/theme/high_contrast_theme.dart';
import 'features/auth/login_screen.dart';
import 'features/home/resident_home_screen.dart';
import 'l10n/app_localizations.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const TepuyNexusResidentApp());
}

class TepuyNexusResidentApp extends StatefulWidget {
  const TepuyNexusResidentApp({super.key});

  @override
  State<TepuyNexusResidentApp> createState() => _TepuyNexusResidentAppState();
}

class _TepuyNexusResidentAppState extends State<TepuyNexusResidentApp> {
  Locale _locale = const Locale('es');
  bool _isCheckingAuth = true;
  bool _hasActiveSession = false;

  @override
  void initState() {
    super.initState();
    _checkInitialAuth();
  }

  Future<void> _checkInitialAuth() async {
    final hasSession = await AuthService().hasValidSession();
    if (mounted) {
      setState(() {
        _hasActiveSession = hasSession;
        _isCheckingAuth = false;
      });
    }
  }

  void _changeLanguage(Locale locale) {
    setState(() {
      _locale = locale;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Tepuy Condo Nexus - Residente',
      debugShowCheckedModeBanner: false,
      theme: HighContrastTheme.themeData,
      locale: _locale,
      supportedLocales: AppLocalizations.supportedLocales,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      home: _isCheckingAuth
          ? const Scaffold(
              backgroundColor: HighContrastTheme.darkBackground,
              body: Center(
                child: CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(HighContrastTheme.sapphireBanking),
                ),
              ),
            )
          : (_hasActiveSession
              ? ResidentHomeScreen(
                  onLanguageChanged: _changeLanguage,
                  currentLocale: _locale,
                )
              : LoginScreen(
                  onLanguageChanged: _changeLanguage,
                  currentLocale: _locale,
                )),
    );
  }
}
