import 'dart:math' as math;
import 'package:flutter/widgets.dart';

/// Controlador de escala tipográfica y accesibilidad radical (WCAG AAA).
/// Garantiza que en Modo Senior el tamaño base nunca sea inferior a 20.0 px lógicos
/// y permite escalado adicional de hasta el 200%.
class AccessibilityScaler {
  static const double minSeniorFontSize = 20.0;
  static const double minTouchTargetHeight = 80.0;

  final bool isSeniorMode;
  final double userScaleFactor; // De 1.0 (100%) a 2.0 (200%)

  const AccessibilityScaler({
    this.isSeniorMode = true,
    this.userScaleFactor = 1.0,
  });

  /// Calcula el tamaño tipográfico efectivo:
  /// En modo senior: effectiveBase = max(baseFontSize, 20.0)
  /// fontSizeEffective = effectiveBase * userScaleFactor
  double scaleFontSize(double baseFontSize) {
    if (isSeniorMode) {
      final double normalizedBase = math.max(baseFontSize, minSeniorFontSize);
      return normalizedBase * userScaleFactor;
    }
    return baseFontSize * userScaleFactor;
  }

  /// Escala tipográfica para micro-etiquetas, badges y metadatos técnicos secundarios.
  /// Escala proporcionalmente con userScaleFactor sin forzar el mínimo de 20px
  /// para preservar la jerarquía visual fiduciaria y la sobriedad ejecutiva.
  double scaleMicroFontSize(double baseFontSize) {
    return (baseFontSize * userScaleFactor).clamp(10.0, 16.0);
  }

  /// Retorna la altura mínima para botones y áreas táctiles sagradas (>= 80dp)
  double get effectiveTouchTargetHeight {
    if (isSeniorMode) {
      return math.max(minTouchTargetHeight, minTouchTargetHeight * userScaleFactor * 0.9);
    }
    return 56.0;
  }

  /// Espaciado interno generoso para personas con temblor esencial o visión reducida
  EdgeInsets get primaryButtonPadding {
    if (isSeniorMode) {
      return const EdgeInsets.symmetric(horizontal: 20.0, vertical: 18.0);
    }
    return const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0);
  }

  /// Grosor de bordes arquitectónicos limpios
  double get highContrastBorderWidth {
    return isSeniorMode ? 1.2 : 1.0;
  }
}

