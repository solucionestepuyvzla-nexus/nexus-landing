import 'package:flutter/material.dart';
import '../../core/accessibility/accessibility_scaler.dart';
import '../../core/models/circular.dart';
import '../../core/models/resident_account.dart';
import '../../core/services/auth_service.dart';
import '../../core/services/resident_api_service.dart';
import '../../core/theme/high_contrast_theme.dart';
import '../../l10n/app_localizations.dart';
import '../auth/login_screen.dart';
import 'sacred_button.dart';
import '../account/account_balance_screen.dart';
import '../failure/report_failure_screen.dart';
import '../circulars/circulars_list_screen.dart';

class ResidentHomeScreen extends StatefulWidget {
  final void Function(Locale) onLanguageChanged;
  final Locale currentLocale;

  const ResidentHomeScreen({
    super.key,
    required this.onLanguageChanged,
    required this.currentLocale,
  });

  @override
  State<ResidentHomeScreen> createState() => _ResidentHomeScreenState();
}

class _ResidentHomeScreenState extends State<ResidentHomeScreen> {
  final bool _isSeniorMode = true;
  double _fontScaleMultiplier = 1.0; // De 1.0x (100%) a 1.6x (160%)
  final ResidentApiService _apiService = ResidentApiService();

  ResidentAccount? _account;
  List<CircularNotice> _circulars = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final account = await _apiService.getAccountStatus();
      final circulars = await _apiService.getCirculars();
      if (mounted) {
        setState(() {
          _account = account;
          _circulars = circulars;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('[HOME] Error loading live data: $e');
      if (mounted) {
        setState(() {
          _account ??= ResidentAccount.mock();
          _isLoading = false;
        });
      }
    }
  }

  AccessibilityScaler get _scaler => AccessibilityScaler(
        isSeniorMode: _isSeniorMode,
        userScaleFactor: _fontScaleMultiplier,
      );

  void _increaseFontSize() {
    setState(() {
      if (_fontScaleMultiplier < 1.6) {
        _fontScaleMultiplier = (_fontScaleMultiplier + 0.15).clamp(1.0, 1.6);
      }
    });
  }

  void _decreaseFontSize() {
    setState(() {
      if (_fontScaleMultiplier > 1.0) {
        _fontScaleMultiplier = (_fontScaleMultiplier - 0.15).clamp(1.0, 1.6);
      }
    });
  }

  Future<void> _confirmLogout() async {
    final l10n = AppLocalizations.of(context);
    final shouldLogout = await showDialog<bool>(
      context: context,
      builder: (dialogCtx) {
        return AlertDialog(
          backgroundColor: HighContrastTheme.surfaceBackground,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16.0),
            side: const BorderSide(color: HighContrastTheme.cardBorder, width: 1.0),
          ),
          title: Row(
            children: [
              const Icon(Icons.logout_rounded, color: HighContrastTheme.roseAlert, size: 24.0),
              const SizedBox(width: 10.0),
              Expanded(
                child: Text(
                  l10n.logoutConfirmTitle,
                  style: const TextStyle(
                    color: HighContrastTheme.textWhite,
                    fontSize: 18.0,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          content: Text(
            l10n.logoutConfirmMessage,
            style: const TextStyle(
              color: HighContrastTheme.textMuted,
              fontSize: 14.0,
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogCtx).pop(false),
              child: Text(
                l10n.logoutConfirmCancel,
                style: const TextStyle(color: HighContrastTheme.textMuted),
              ),
            ),
            ElevatedButton(
              onPressed: () => Navigator.of(dialogCtx).pop(true),
              style: ElevatedButton.styleFrom(
                backgroundColor: HighContrastTheme.roseAlert,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8.0),
                ),
              ),
              child: Text(
                l10n.logoutConfirmOk,
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ],
        );
      },
    );

    if (shouldLogout == true && mounted) {
      final authService = AuthService();
      await authService.logout();
      if (!mounted) return;
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute<void>(
          builder: (context) => LoginScreen(
            onLanguageChanged: widget.onLanguageChanged,
            currentLocale: widget.currentLocale,
          ),
        ),
        (route) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final scaler = _scaler;

    return Scaffold(
      backgroundColor: HighContrastTheme.darkBackground,
      body: SafeArea(
        child: Column(
          children: [
            // ==========================================
            // HEADER EJECUTIVO & CONTROLES DISCRETOS
            // ==========================================
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14.0, vertical: 10.0),
              decoration: const BoxDecoration(
                color: HighContrastTheme.surfaceBackground,
                border: Border(
                  bottom: BorderSide(color: HighContrastTheme.cardBorder, width: 1.0),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Identificador de Marca Ejecutivo
                  Row(
                    children: [
                      Container(
                        width: 32.0,
                        height: 32.0,
                        decoration: BoxDecoration(
                          color: HighContrastTheme.cardBackground,
                          borderRadius: BorderRadius.circular(8.0),
                          border: Border.all(color: HighContrastTheme.cardBorder),
                        ),
                        child: const Icon(
                          Icons.apartment_rounded,
                          size: 18.0,
                          color: HighContrastTheme.textWhite,
                        ),
                      ),
                      const SizedBox(width: 8.0),
                      const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'TEPUY NEXUS',
                            style: TextStyle(
                              fontSize: 13.0,
                              fontWeight: FontWeight.w800,
                              color: HighContrastTheme.textWhite,
                              letterSpacing: 0.8,
                            ),
                          ),
                          Text(
                            'Portal Residente',
                            style: TextStyle(
                              fontSize: 10.0,
                              fontWeight: FontWeight.w400,
                              color: HighContrastTheme.textMuted,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),

                  // Controles de Accesibilidad & Lenguaje Integrados (Anti-Overflow)
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Cápsula de Escalado Tipográfico
                      Container(
                        decoration: BoxDecoration(
                          color: HighContrastTheme.cardBackground,
                          borderRadius: BorderRadius.circular(8.0),
                          border: Border.all(color: HighContrastTheme.cardBorder),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            InkWell(
                              onTap: _fontScaleMultiplier > 1.0 ? _decreaseFontSize : null,
                              borderRadius: const BorderRadius.horizontal(left: Radius.circular(7.0)),
                              child: Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 6.0, vertical: 5.0),
                                child: Text(
                                  'A-',
                                  style: TextStyle(
                                    fontSize: 12.0,
                                    fontWeight: FontWeight.bold,
                                    color: _fontScaleMultiplier > 1.0
                                        ? HighContrastTheme.textWhite
                                        : HighContrastTheme.textSubtle,
                                  ),
                                ),
                              ),
                            ),
                            Container(
                              height: 14.0,
                              width: 1.0,
                              color: HighContrastTheme.cardBorder,
                            ),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 4.0),
                              child: Text(
                                '${(_fontScaleMultiplier * 100).toInt()}%',
                                style: const TextStyle(
                                  fontSize: 10.0,
                                  fontWeight: FontWeight.w600,
                                  color: HighContrastTheme.textMuted,
                                ),
                              ),
                            ),
                            Container(
                              height: 14.0,
                              width: 1.0,
                              color: HighContrastTheme.cardBorder,
                            ),
                            InkWell(
                              onTap: _fontScaleMultiplier < 1.6 ? _increaseFontSize : null,
                              borderRadius: const BorderRadius.horizontal(right: Radius.circular(7.0)),
                              child: Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 6.0, vertical: 5.0),
                                child: Text(
                                  'A+',
                                  style: TextStyle(
                                    fontSize: 12.0,
                                    fontWeight: FontWeight.bold,
                                    color: _fontScaleMultiplier < 1.6
                                        ? HighContrastTheme.textWhite
                                        : HighContrastTheme.textSubtle,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 6.0),

                      // Segmentador de Idioma
                      Container(
                        decoration: BoxDecoration(
                          color: HighContrastTheme.cardBackground,
                          borderRadius: BorderRadius.circular(8.0),
                          border: Border.all(color: HighContrastTheme.cardBorder),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            _buildLanguagePill('ES', widget.currentLocale.languageCode == 'es'),
                            _buildLanguagePill('EN', widget.currentLocale.languageCode == 'en'),
                          ],
                        ),
                      ),
                      const SizedBox(width: 6.0),

                      // Botón Salir Ejecutivo
                      Container(
                        decoration: BoxDecoration(
                          color: HighContrastTheme.cardBackground,
                          borderRadius: BorderRadius.circular(8.0),
                          border: Border.all(color: HighContrastTheme.cardBorder),
                        ),
                        child: InkWell(
                          onTap: _confirmLogout,
                          borderRadius: BorderRadius.circular(7.0),
                          child: const Padding(
                            padding: EdgeInsets.symmetric(horizontal: 7.0, vertical: 5.0),
                            child: Icon(
                              Icons.logout_rounded,
                              size: 15.0,
                              color: HighContrastTheme.roseAlert,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            if (_isLoading)
              const LinearProgressIndicator(
                minHeight: 2.0,
                backgroundColor: HighContrastTheme.darkBackground,
                valueColor: AlwaysStoppedAnimation<Color>(HighContrastTheme.sapphireBanking),
              ),

            // ==========================================
            // CONTENIDO PRINCIPAL EJECUTIVO
            // ==========================================
            Expanded(
              child: RefreshIndicator(
                onRefresh: _loadData,
                color: HighContrastTheme.sapphireLight,
                backgroundColor: HighContrastTheme.surfaceBackground,
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 20.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Tarjeta Credencial de Propiedad (Estilo Membresía Fiduciaria)
                      Container(
                        padding: const EdgeInsets.all(22.0),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF141C2B), Color(0xFF182337)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(20.0),
                          border: Border.all(color: HighContrastTheme.cardBorder, width: 1.0),
                          boxShadow: const [
                            BoxShadow(
                              color: Color(0x33000000),
                              blurRadius: 14.0,
                              offset: Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Text(
                                    l10n.myProperty,
                                    style: TextStyle(
                                      fontSize: scaler.scaleFontSize(11.0),
                                      fontWeight: FontWeight.w700,
                                      color: HighContrastTheme.textMuted,
                                      letterSpacing: 1.2,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                const SizedBox(width: 8.0),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 3.0),
                                  decoration: BoxDecoration(
                                    color: ((_account?.isSolvent ?? false)
                                            ? HighContrastTheme.emeraldBanking
                                            : HighContrastTheme.amberNotice)
                                        .withValues(alpha: 0.15),
                                    borderRadius: BorderRadius.circular(8.0),
                                    border: Border.all(
                                      color: ((_account?.isSolvent ?? false)
                                              ? HighContrastTheme.emeraldBanking
                                              : HighContrastTheme.amberNotice)
                                          .withValues(alpha: 0.4),
                                      width: 1.0,
                                    ),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(
                                        (_account?.isSolvent ?? false)
                                            ? Icons.shield_outlined
                                            : Icons.schedule_rounded,
                                        size: 12.0,
                                        color: (_account?.isSolvent ?? false)
                                            ? HighContrastTheme.emeraldBanking
                                            : HighContrastTheme.amberNotice,
                                      ),
                                      const SizedBox(width: 4.0),
                                      Text(
                                        (_account?.isSolvent ?? false)
                                            ? l10n.statusSolvent
                                            : l10n.statusPending,
                                        style: TextStyle(
                                          fontSize: scaler.scaleMicroFontSize(10.0),
                                          fontWeight: FontWeight.w700,
                                          color: (_account?.isSolvent ?? false)
                                              ? HighContrastTheme.emeraldBanking
                                              : HighContrastTheme.amberNotice,
                                          letterSpacing: 0.5,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12.0),
                            Text(
                              _account?.buildingName ?? 'Residencias Tepuy Royal',
                              style: TextStyle(
                                fontSize: scaler.scaleFontSize(20.0),
                                color: HighContrastTheme.textWhite,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 0.2,
                              ),
                            ),
                            const SizedBox(height: 4.0),
                            Text(
                              '${l10n.unitLabel}: ${_account?.unitNumber ?? '1-A'} • ${l10n.aliquotLabel}: ${_account?.aliquotPercentage ?? '5.2500'}%',
                              style: TextStyle(
                                fontSize: scaler.scaleFontSize(14.0),
                                color: HighContrastTheme.textMuted,
                                fontWeight: FontWeight.w400,
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 24.0),

                      // Título de Sección Sobrio
                      Text(
                        'ACCIONES PRINCIPALES',
                        style: TextStyle(
                          fontSize: scaler.scaleFontSize(12.0),
                          fontWeight: FontWeight.w700,
                          color: HighContrastTheme.textMuted,
                          letterSpacing: 1.2,
                        ),
                      ),
                      const SizedBox(height: 12.0),

                      // ==========================================
                      // LOS 3 MÓDULOS DE ACCIÓN EJECUTIVA
                      // ==========================================

                      // 1. CONSULTAR CUENTA (Sapphire Blue)
                      SacredButton(
                        title: l10n.sacredButton1Title,
                        subtitle: _account != null
                            ? '\$${_account!.balanceUsd} USD • Bs. ${_account!.balanceLocalCurrency}'
                            : l10n.sacredButton1Subtitle,
                        icon: Icons.account_balance_wallet_outlined,
                        accentColor: HighContrastTheme.sapphireLight,
                        scaler: scaler,
                        onTap: () async {
                          await Navigator.push(
                            context,
                            MaterialPageRoute<void>(
                              builder: (context) => AccountBalanceScreen(
                                scaler: scaler,
                                initialAccount: _account,
                              ),
                            ),
                          );
                          await _loadData();
                        },
                      ),

                      // 2. REPORTAR FALLA (Banking Emerald)
                      SacredButton(
                        title: l10n.sacredButton2Title,
                        subtitle: l10n.sacredButton2Subtitle,
                        icon: Icons.record_voice_over_outlined,
                        accentColor: HighContrastTheme.emeraldBanking,
                        scaler: scaler,
                        onTap: () async {
                          await Navigator.push(
                            context,
                            MaterialPageRoute<void>(
                              builder: (context) => ReportFailureScreen(scaler: scaler),
                            ),
                          );
                          await _loadData();
                        },
                      ),

                      // 3. VER CIRCULARES (Corporate Amber)
                      Builder(
                        builder: (context) {
                          final urgentCount = _circulars.where((c) => c.isUrgent).length;
                          final badgeText = urgentCount > 0
                              ? '! PRIORITARIO'
                              : (_circulars.isNotEmpty ? '${_circulars.length} NUEVOS' : null);

                          return SacredButton(
                            title: l10n.sacredButton3Title,
                            subtitle: l10n.sacredButton3Subtitle,
                            icon: Icons.article_outlined,
                            accentColor: HighContrastTheme.amberNotice,
                            badgeText: badgeText,
                            scaler: scaler,
                            onTap: () async {
                              await Navigator.push(
                                context,
                                MaterialPageRoute<void>(
                                  builder: (context) => CircularsListScreen(scaler: scaler),
                                ),
                              );
                              await _loadData();
                            },
                          );
                        },
                      ),

                      const SizedBox(height: 24.0),

                      // Pie de Página Técnico Fiduciario
                      Center(
                        child: Text(
                          'Tasa Oficial BCV sincronizada • Sistema Blindado Multi-Tenant',
                          style: TextStyle(
                            fontSize: scaler.scaleFontSize(11.0),
                            color: HighContrastTheme.textSubtle,
                            fontWeight: FontWeight.w400,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLanguagePill(String code, bool isSelected) {
    return InkWell(
      onTap: () => widget.onLanguageChanged(Locale(code.toLowerCase())),
      borderRadius: BorderRadius.circular(9.0),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10.0, vertical: 6.0),
        decoration: BoxDecoration(
          color: isSelected ? HighContrastTheme.surfaceBackground : Colors.transparent,
          borderRadius: BorderRadius.circular(9.0),
        ),
        child: Text(
          code,
          style: TextStyle(
            fontSize: 12.0,
            fontWeight: isSelected ? FontWeight.w800 : FontWeight.w500,
            color: isSelected ? HighContrastTheme.textWhite : HighContrastTheme.textSubtle,
          ),
        ),
      ),
    );
  }
}
