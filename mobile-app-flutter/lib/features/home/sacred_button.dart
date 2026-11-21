import 'package:flutter/material.dart';
import '../../core/accessibility/accessibility_scaler.dart';
import '../../core/theme/high_contrast_theme.dart';

/// Módulo de Acción Ejecutiva (WCAG AAA Accesible & Grado Corporativo)
/// Combina alta legibilidad y generosa área táctil (>= 80dp) con acabados de banca privada.
class SacredButton extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color accentColor;
  final VoidCallback onTap;
  final AccessibilityScaler scaler;
  final String? badgeText;

  const SacredButton({
    super.key,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.accentColor,
    required this.onTap,
    required this.scaler,
    this.badgeText,
  });

  @override
  Widget build(BuildContext context) {
    final double titleSize = scaler.scaleFontSize(19.0);
    final double subtitleSize = scaler.scaleFontSize(14.0);
    final double minHeight = scaler.effectiveTouchTargetHeight;

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8.0),
      decoration: BoxDecoration(
        color: HighContrastTheme.surfaceBackground,
        borderRadius: BorderRadius.circular(16.0),
        border: Border.all(
          color: HighContrastTheme.cardBorder,
          width: scaler.highContrastBorderWidth,
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x33000000),
            blurRadius: 10.0,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16.0),
          splashColor: accentColor.withValues(alpha: 0.12),
          highlightColor: accentColor.withValues(alpha: 0.06),
          child: ConstrainedBox(
            constraints: BoxConstraints(minHeight: minHeight),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 18.0, vertical: 16.0),
              child: Row(
                children: [
                  // Contenedor de Ícono Minimalista Ejecutivo
                  Container(
                    width: 52.0,
                    height: 52.0,
                    decoration: BoxDecoration(
                      color: HighContrastTheme.cardBackground,
                      borderRadius: BorderRadius.circular(14.0),
                      border: Border.all(
                        color: HighContrastTheme.cardBorder,
                        width: 1.0,
                      ),
                    ),
                    child: Icon(
                      icon,
                      size: 26.0,
                      color: accentColor,
                    ),
                  ),
                  const SizedBox(width: 16.0),

                  // Títulos y Subtítulos con Tipografía Ejecutiva
                  Expanded(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Flexible(
                              child: Text(
                                title,
                                style: TextStyle(
                                  fontSize: titleSize,
                                  fontWeight: FontWeight.w700,
                                  color: HighContrastTheme.textWhite,
                                  letterSpacing: 0.3,
                                  height: 1.2,
                                ),
                              ),
                            ),
                            if (badgeText != null) ...[
                              const SizedBox(width: 8.0),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6.0, vertical: 2.0),
                                decoration: BoxDecoration(
                                  color: accentColor.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(6.0),
                                ),
                                child: Text(
                                  badgeText!,
                                  style: TextStyle(
                                    fontSize: 10.0,
                                    fontWeight: FontWeight.bold,
                                    color: accentColor,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 4.0),
                        Text(
                          subtitle,
                          style: TextStyle(
                            fontSize: subtitleSize,
                            fontWeight: FontWeight.w400,
                            color: HighContrastTheme.textMuted,
                            height: 1.3,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Chevron de Navegación Discreto
                  const Icon(
                    Icons.chevron_right_rounded,
                    size: 24.0,
                    color: HighContrastTheme.textSubtle,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
