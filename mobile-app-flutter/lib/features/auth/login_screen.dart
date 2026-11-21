import 'package:flutter/material.dart';
import '../../core/accessibility/accessibility_scaler.dart';
import '../../core/services/auth_service.dart';
import '../../core/theme/high_contrast_theme.dart';
import '../../l10n/app_localizations.dart';
import '../home/resident_home_screen.dart';

class LoginScreen extends StatefulWidget {
  final void Function(Locale) onLanguageChanged;
  final Locale currentLocale;

  const LoginScreen({
    super.key,
    required this.onLanguageChanged,
    required this.currentLocale,
  });

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final AuthService _authService = AuthService();

  bool _obscurePassword = true;
  bool _isLoading = false;
  String? _errorMessage;
  double _fontScaleMultiplier = 1.0;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  AccessibilityScaler get _scaler => AccessibilityScaler(
        isSeniorMode: true,
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

  void _setDemoCredentials(String email, String password) {
    setState(() {
      _emailController.text = email;
      _passwordController.text = password;
      _errorMessage = null;
    });
  }

  Future<void> _handleLogin() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();
    final l10n = AppLocalizations.of(context);

    if (email.isEmpty || password.isEmpty) {
      setState(() {
        _errorMessage = l10n.loginErrorInvalidCredentials;
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final result = await _authService.login(email: email, password: password);

    if (!mounted) return;

    if (result.success) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute<void>(
          builder: (context) => ResidentHomeScreen(
            onLanguageChanged: widget.onLanguageChanged,
            currentLocale: widget.currentLocale,
          ),
        ),
      );
    } else {
      setState(() {
        _isLoading = false;
        _errorMessage = result.errorMessage ?? l10n.loginErrorInvalidCredentials;
      });
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
            // HEADER SUPERIOR EJECUTIVO (A+/A- & ES/EN)
            // ==========================================
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0),
              decoration: const BoxDecoration(
                color: HighContrastTheme.surfaceBackground,
                border: Border(
                  bottom: BorderSide(color: HighContrastTheme.cardBorder, width: 1.0),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 34.0,
                        height: 34.0,
                        decoration: BoxDecoration(
                          color: HighContrastTheme.cardBackground,
                          borderRadius: BorderRadius.circular(8.0),
                          border: Border.all(color: HighContrastTheme.cardBorder),
                        ),
                        child: const Icon(
                          Icons.apartment_rounded,
                          size: 20.0,
                          color: HighContrastTheme.textWhite,
                        ),
                      ),
                      const SizedBox(width: 10.0),
                      const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'TEPUY NEXUS',
                            style: TextStyle(
                              fontSize: 14.0,
                              fontWeight: FontWeight.w800,
                              color: HighContrastTheme.textWhite,
                              letterSpacing: 1.0,
                            ),
                          ),
                          Text(
                            'Portal de Acceso',
                            style: TextStyle(
                              fontSize: 11.0,
                              fontWeight: FontWeight.w400,
                              color: HighContrastTheme.textMuted,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      // Escalado Tipográfico
                      Container(
                        decoration: BoxDecoration(
                          color: HighContrastTheme.cardBackground,
                          borderRadius: BorderRadius.circular(10.0),
                          border: Border.all(color: HighContrastTheme.cardBorder),
                        ),
                        child: Row(
                          children: [
                            InkWell(
                              onTap: _fontScaleMultiplier > 1.0 ? _decreaseFontSize : null,
                              borderRadius: const BorderRadius.horizontal(left: Radius.circular(9.0)),
                              child: Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 6.0),
                                child: Text(
                                  'A-',
                                  style: TextStyle(
                                    fontSize: 13.0,
                                    fontWeight: FontWeight.bold,
                                    color: _fontScaleMultiplier > 1.0
                                        ? HighContrastTheme.textWhite
                                        : HighContrastTheme.textSubtle,
                                  ),
                                ),
                              ),
                            ),
                            Container(height: 16.0, width: 1.0, color: HighContrastTheme.cardBorder),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 6.0),
                              child: Text(
                                '${(_fontScaleMultiplier * 100).toInt()}%',
                                style: const TextStyle(
                                  fontSize: 11.0,
                                  fontWeight: FontWeight.w600,
                                  color: HighContrastTheme.textMuted,
                                ),
                              ),
                            ),
                            Container(height: 16.0, width: 1.0, color: HighContrastTheme.cardBorder),
                            InkWell(
                              onTap: _fontScaleMultiplier < 1.6 ? _increaseFontSize : null,
                              borderRadius: const BorderRadius.horizontal(right: Radius.circular(9.0)),
                              child: Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 6.0),
                                child: Text(
                                  'A+',
                                  style: TextStyle(
                                    fontSize: 13.0,
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
                      const SizedBox(width: 8.0),
                      // Selector de Idioma
                      Container(
                        decoration: BoxDecoration(
                          color: HighContrastTheme.cardBackground,
                          borderRadius: BorderRadius.circular(10.0),
                          border: Border.all(color: HighContrastTheme.cardBorder),
                        ),
                        child: Row(
                          children: [
                            _buildLanguagePill('ES', widget.currentLocale.languageCode == 'es'),
                            _buildLanguagePill('EN', widget.currentLocale.languageCode == 'en'),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // ==========================================
            // FORMULARIO DE ACCESO MULTI-INQUILINO
            // ==========================================
            Expanded(
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Título y Subtítulo Fiduciario
                    Center(
                      child: Container(
                        padding: const EdgeInsets.all(14.0),
                        decoration: BoxDecoration(
                          color: HighContrastTheme.surfaceBackground,
                          shape: BoxShape.circle,
                          border: Border.all(color: HighContrastTheme.cardBorder, width: 1.2),
                        ),
                        child: const Icon(
                          Icons.shield_outlined,
                          size: 36.0,
                          color: HighContrastTheme.sapphireLight,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16.0),
                    Text(
                      l10n.loginTitle,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: scaler.scaleFontSize(22.0),
                        fontWeight: FontWeight.bold,
                        color: HighContrastTheme.textWhite,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 6.0),
                    Text(
                      l10n.loginSubtitle,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: scaler.scaleMicroFontSize(13.0),
                        color: HighContrastTheme.textMuted,
                      ),
                    ),
                    const SizedBox(height: 24.0),

                    // Mensaje de Error si ocurre
                    if (_errorMessage != null) ...[
                      Container(
                        padding: const EdgeInsets.all(14.0),
                        decoration: BoxDecoration(
                          color: HighContrastTheme.surfaceBackground,
                          borderRadius: BorderRadius.circular(12.0),
                          border: Border.all(color: HighContrastTheme.roseAlert, width: 1.2),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.error_outline_rounded, color: HighContrastTheme.roseAlert, size: 22.0),
                            const SizedBox(width: 12.0),
                            Expanded(
                              child: Text(
                                _errorMessage!,
                                style: TextStyle(
                                  color: HighContrastTheme.textWhite,
                                  fontSize: scaler.scaleMicroFontSize(13.0),
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20.0),
                    ],

                    // Contenedor del Formulario
                    Container(
                      padding: const EdgeInsets.all(20.0),
                      decoration: BoxDecoration(
                        color: HighContrastTheme.surfaceBackground,
                        borderRadius: BorderRadius.circular(16.0),
                        border: Border.all(color: HighContrastTheme.cardBorder, width: 1.0),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Campo: Correo Electrónico
                          Text(
                            l10n.loginEmailLabel,
                            style: TextStyle(
                              fontSize: scaler.scaleMicroFontSize(13.0),
                              fontWeight: FontWeight.w600,
                              color: HighContrastTheme.textWhite,
                            ),
                          ),
                          const SizedBox(height: 8.0),
                          TextField(
                            controller: _emailController,
                            keyboardType: TextInputType.emailAddress,
                            autocorrect: false,
                            style: TextStyle(
                              color: HighContrastTheme.textWhite,
                              fontSize: scaler.scaleFontSize(16.0),
                            ),
                            decoration: InputDecoration(
                              hintText: l10n.loginEmailHint,
                              hintStyle: const TextStyle(color: HighContrastTheme.textSubtle),
                              prefixIcon: const Icon(Icons.email_outlined, color: HighContrastTheme.textMuted),
                              filled: true,
                              fillColor: HighContrastTheme.cardBackground,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 16.0),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10.0),
                                borderSide: const BorderSide(color: HighContrastTheme.cardBorder),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10.0),
                                borderSide: const BorderSide(color: HighContrastTheme.sapphireBanking, width: 1.5),
                              ),
                            ),
                          ),
                          const SizedBox(height: 18.0),

                          // Campo: Contraseña
                          Text(
                            l10n.loginPasswordLabel,
                            style: TextStyle(
                              fontSize: scaler.scaleMicroFontSize(13.0),
                              fontWeight: FontWeight.w600,
                              color: HighContrastTheme.textWhite,
                            ),
                          ),
                          const SizedBox(height: 8.0),
                          TextField(
                            controller: _passwordController,
                            obscureText: _obscurePassword,
                            autocorrect: false,
                            style: TextStyle(
                              color: HighContrastTheme.textWhite,
                              fontSize: scaler.scaleFontSize(16.0),
                            ),
                            decoration: InputDecoration(
                              hintText: l10n.loginPasswordHint,
                              hintStyle: const TextStyle(color: HighContrastTheme.textSubtle),
                              prefixIcon: const Icon(Icons.lock_outline_rounded, color: HighContrastTheme.textMuted),
                              suffixIcon: IconButton(
                                icon: Icon(
                                  _obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                                  color: HighContrastTheme.textMuted,
                                ),
                                onPressed: () {
                                  setState(() {
                                    _obscurePassword = !_obscurePassword;
                                  });
                                },
                              ),
                              filled: true,
                              fillColor: HighContrastTheme.cardBackground,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 16.0),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10.0),
                                borderSide: const BorderSide(color: HighContrastTheme.cardBorder),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10.0),
                                borderSide: const BorderSide(color: HighContrastTheme.sapphireBanking, width: 1.5),
                              ),
                            ),
                          ),
                          const SizedBox(height: 24.0),

                          // Botón Sagrado de Inicio de Sesión
                          SizedBox(
                            width: double.infinity,
                            height: 60.0,
                            child: ElevatedButton(
                              onPressed: _isLoading ? null : _handleLogin,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: HighContrastTheme.sapphireBanking,
                                foregroundColor: Colors.white,
                                disabledBackgroundColor: HighContrastTheme.cardBorder,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12.0),
                                ),
                                elevation: 0,
                              ),
                              child: _isLoading
                                  ? const SizedBox(
                                      width: 24.0,
                                      height: 24.0,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2.5,
                                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                      ),
                                    )
                                  : Text(
                                      l10n.loginButton,
                                      style: TextStyle(
                                        fontSize: scaler.scaleFontSize(16.0),
                                        fontWeight: FontWeight.w800,
                                        letterSpacing: 1.0,
                                      ),
                                    ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 28.0),

                    // ==========================================
                    // SELECTOR RÁPIDO PILOTO (MULTI-TENANT TEST)
                    // ==========================================
                    Container(
                      padding: const EdgeInsets.all(16.0),
                      decoration: BoxDecoration(
                        color: HighContrastTheme.cardBackground,
                        borderRadius: BorderRadius.circular(14.0),
                        border: Border.all(color: HighContrastTheme.cardBorder),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.touch_app_outlined, size: 16.0, color: HighContrastTheme.amberNotice),
                              const SizedBox(width: 8.0),
                              Text(
                                l10n.demoCredentialsTitle,
                                style: TextStyle(
                                  fontSize: scaler.scaleMicroFontSize(11.0),
                                  fontWeight: FontWeight.w800,
                                  color: HighContrastTheme.amberNotice,
                                  letterSpacing: 0.8,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12.0),

                          // Inquilino 1: Residencias Tepuy Royal
                          _buildDemoUserButton(
                            title: l10n.demoBuilding1,
                            subtitle: 'Unidad 1-A | Alícuota 5.25%',
                            icon: Icons.location_city_rounded,
                            onTap: () => _setDemoCredentials('residente@tepuynexus.com', 'Residente123!'),
                            scaler: scaler,
                          ),
                          const SizedBox(height: 10.0),

                          // Inquilino 2: Condominio Mirador del Bosque
                          _buildDemoUserButton(
                            title: l10n.demoBuilding2,
                            subtitle: 'Unidad 4-B | Alícuota 6.50%',
                            icon: Icons.park_rounded,
                            onTap: () => _setDemoCredentials('elena@tepuynexus.com', 'Elena123!'),
                            scaler: scaler,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDemoUserButton({
    required String title,
    required String subtitle,
    required IconData icon,
    required VoidCallback onTap,
    required AccessibilityScaler scaler,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10.0),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14.0, vertical: 12.0),
        decoration: BoxDecoration(
          color: HighContrastTheme.surfaceBackground,
          borderRadius: BorderRadius.circular(10.0),
          border: Border.all(color: HighContrastTheme.cardBorder, width: 1.0),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8.0),
              decoration: BoxDecoration(
                color: HighContrastTheme.cardBackground,
                borderRadius: BorderRadius.circular(8.0),
              ),
              child: Icon(icon, size: 18.0, color: HighContrastTheme.sapphireLight),
            ),
            const SizedBox(width: 12.0),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: scaler.scaleMicroFontSize(13.0),
                      fontWeight: FontWeight.bold,
                      color: HighContrastTheme.textWhite,
                    ),
                  ),
                  const SizedBox(height: 2.0),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: scaler.scaleMicroFontSize(11.0),
                      color: HighContrastTheme.textMuted,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios_rounded, size: 14.0, color: HighContrastTheme.textSubtle),
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
          color: isSelected ? HighContrastTheme.sapphireBanking : Colors.transparent,
          borderRadius: BorderRadius.circular(9.0),
        ),
        child: Text(
          code,
          style: TextStyle(
            fontSize: 11.0,
            fontWeight: FontWeight.w700,
            color: isSelected ? Colors.white : HighContrastTheme.textSubtle,
          ),
        ),
      ),
    );
  }
}

