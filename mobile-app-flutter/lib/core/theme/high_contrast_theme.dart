import 'package:flutter/material.dart';

/// Paleta Ejecutiva Ultra-Sobria (FinTech & Luxury Real Estate)
/// Diseñada para proyectar máxima seriedad, solvencia y legibilidad ejecutiva.
class HighContrastTheme {
  // Fondos y Superficies
  static const Color darkBackground = Color(0xFF0B0F17); // Obsidian Slate Profundo
  static const Color surfaceBackground = Color(0xFF131B2A); // Pizarra Ejecutiva
  static const Color cardBackground = Color(0xFF182234); // Titanio Oscuro
  static const Color cardBorder = Color(0xFF26334D); // Borde arquitectónico sutil

  // Tipografía de Alto Contraste y Descanso Visual
  static const Color textWhite = Color(0xFFF8FAFC); // Blanco Marfil
  static const Color textHighContrast = Color(0xFFE2E8F0);
  static const Color textMuted = Color(0xFF94A3B8); // Platino Neutro
  static const Color textSubtle = Color(0xFF64748B); // Slate Técnico

  // Acentos Fiduciarios & Corporativos (Cero Neones Estridentes)
  static const Color sapphirePrimary = Color(0xFF2563EB); // Azul Zafiro Bancario
  static const Color sapphireBanking = sapphirePrimary; // Alias Fiduciario
  static const Color sapphireLight = Color(0xFF3B82F6);
  static const Color emeraldBanking = Color(0xFF10B981); // Esmeralda Fiduciario Mate
  static const Color amberNotice = Color(0xFFF59E0B); // Ámbar Corporativo Mate
  static const Color roseAlert = Color(0xFFEF4444); // Rojo Alerta Sutil
  static const Color champagneGold = Color(0xFFD4AF37); // Oro Champán para Membresía

  // Compatibilidad con referencias de tokens previas
  static const Color cyanVibrant = sapphirePrimary;
  static const Color greenVibrant = emeraldBanking;
  static const Color amberVibrant = amberNotice;
  static const Color redVibrant = roseAlert;

  static ThemeData get themeData {
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: darkBackground,
      colorScheme: const ColorScheme.dark(
        primary: sapphirePrimary,
        secondary: emeraldBanking,
        tertiary: amberNotice,
        error: roseAlert,
        surface: surfaceBackground,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: textWhite,
      ),
      cardTheme: CardThemeData(
        color: surfaceBackground,
        elevation: 0.0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16.0),
          side: const BorderSide(color: cardBorder, width: 1.0),
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: darkBackground,
        foregroundColor: textWhite,
        elevation: 0,
        centerTitle: false,
      ),
      useMaterial3: true,
    );
  }
}
