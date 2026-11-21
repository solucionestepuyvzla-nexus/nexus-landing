import 'package:flutter/material.dart';
import '../../core/accessibility/accessibility_scaler.dart';
import '../../core/models/circular.dart';
import '../../core/services/resident_api_service.dart';
import '../../core/theme/high_contrast_theme.dart';
import '../../l10n/app_localizations.dart';

class CircularsListScreen extends StatefulWidget {
  final AccessibilityScaler scaler;

  const CircularsListScreen({super.key, required this.scaler});

  @override
  State<CircularsListScreen> createState() => _CircularsListScreenState();
}

class _CircularsListScreenState extends State<CircularsListScreen> {
  final ResidentApiService _apiService = ResidentApiService();
  List<CircularNotice> _circulars = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchCirculars();
  }

  Future<void> _fetchCirculars() async {
    setState(() => _isLoading = true);
    try {
      final list = await _apiService.getCirculars();
      if (mounted) {
        setState(() {
          _circulars = list;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('[CIRCULARS API ERROR] $e');
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final scaler = widget.scaler;

    return Scaffold(
      backgroundColor: HighContrastTheme.darkBackground,
      appBar: AppBar(
        backgroundColor: HighContrastTheme.darkBackground,
        elevation: 0,
        title: Text(
          l10n.circularsTitle,
          style: TextStyle(
            fontSize: scaler.scaleFontSize(20.0),
            fontWeight: FontWeight.w700,
            color: HighContrastTheme.textWhite,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 22.0, color: HighContrastTheme.textWhite),
          onPressed: () => Navigator.pop(context),
        ),
        bottom: _isLoading
            ? const PreferredSize(
                preferredSize: Size.fromHeight(2.0),
                child: LinearProgressIndicator(
                  minHeight: 2.0,
                  backgroundColor: HighContrastTheme.darkBackground,
                  valueColor: AlwaysStoppedAnimation<Color>(HighContrastTheme.sapphireBanking),
                ),
              )
            : null,
      ),
      body: RefreshIndicator(
        onRefresh: _fetchCirculars,
        color: HighContrastTheme.sapphireLight,
        backgroundColor: HighContrastTheme.surfaceBackground,
        child: _circulars.isEmpty && !_isLoading
            ? ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: [
                  SizedBox(height: MediaQuery.of(context).size.height * 0.3),
                  Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.mark_email_read_outlined,
                          size: 48.0,
                          color: HighContrastTheme.textSubtle,
                        ),
                        const SizedBox(height: 12.0),
                        Text(
                          l10n.noCirculars,
                          style: TextStyle(
                            fontSize: scaler.scaleFontSize(16.0),
                            color: HighContrastTheme.textMuted,
                          ),
                        ),
                        const SizedBox(height: 16.0),
                        OutlinedButton.icon(
                          onPressed: _fetchCirculars,
                          icon: const Icon(Icons.refresh_rounded, size: 16.0, color: HighContrastTheme.sapphireLight),
                          label: Text(
                            l10n.retryLabel,
                            style: TextStyle(
                              fontSize: scaler.scaleFontSize(14.0),
                              color: HighContrastTheme.sapphireLight,
                            ),
                          ),
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: HighContrastTheme.cardBorder),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10.0)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              )
            : ListView.builder(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
                itemCount: _circulars.length,
                itemBuilder: (context, index) {
                  final item = _circulars[index];
                  return Container(
                    margin: const EdgeInsets.only(bottom: 16.0),
                    padding: const EdgeInsets.all(20.0),
                    decoration: BoxDecoration(
                      color: HighContrastTheme.surfaceBackground,
                      borderRadius: BorderRadius.circular(18.0),
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
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Encabezado del Comunicado: Micro-Badge Sobrio + Fecha
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            if (item.isUrgent)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 3.0),
                                decoration: BoxDecoration(
                                  color: HighContrastTheme.amberNotice.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(6.0),
                                  border: Border.all(
                                    color: HighContrastTheme.amberNotice.withValues(alpha: 0.35),
                                    width: 1.0,
                                  ),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(
                                      Icons.priority_high_rounded,
                                      size: 11.0,
                                      color: HighContrastTheme.amberNotice,
                                    ),
                                    const SizedBox(width: 4.0),
                                    Text(
                                      l10n.noticeUrgent,
                                      style: TextStyle(
                                        fontSize: scaler.scaleMicroFontSize(10.0),
                                        fontWeight: FontWeight.w700,
                                        color: HighContrastTheme.amberNotice,
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                                  ],
                                ),
                              )
                            else
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 3.0),
                                decoration: BoxDecoration(
                                  color: HighContrastTheme.cardBackground,
                                  borderRadius: BorderRadius.circular(6.0),
                                  border: Border.all(
                                    color: HighContrastTheme.cardBorder,
                                    width: 1.0,
                                  ),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(
                                      Icons.article_outlined,
                                      size: 11.0,
                                      color: HighContrastTheme.textMuted,
                                    ),
                                    const SizedBox(width: 4.0),
                                    Text(
                                      l10n.noticeGeneral,
                                      style: TextStyle(
                                        fontSize: scaler.scaleMicroFontSize(10.0),
                                        fontWeight: FontWeight.w600,
                                        color: HighContrastTheme.textMuted,
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(
                                  Icons.calendar_today_outlined,
                                  size: 11.0,
                                  color: HighContrastTheme.textSubtle,
                                ),
                                const SizedBox(width: 4.0),
                                Text(
                                  item.publishedAt,
                                  style: TextStyle(
                                    fontSize: scaler.scaleMicroFontSize(11.0),
                                    color: HighContrastTheme.textSubtle,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 12.0),
                        // Título del Comunicado
                        Text(
                          item.title,
                          style: TextStyle(
                            fontSize: scaler.scaleFontSize(18.0),
                            fontWeight: FontWeight.w700,
                            color: HighContrastTheme.textWhite,
                            height: 1.25,
                          ),
                        ),
                        const SizedBox(height: 6.0),
                        // Emisor Institucional
                        Row(
                          children: [
                            const Icon(
                              Icons.verified_outlined,
                              size: 12.0,
                              color: HighContrastTheme.textSubtle,
                            ),
                            const SizedBox(width: 5.0),
                            Text(
                              '${l10n.publishedBy} ${item.authorName}',
                              style: TextStyle(
                                fontSize: scaler.scaleMicroFontSize(12.0),
                                color: HighContrastTheme.textMuted,
                                fontWeight: FontWeight.w400,
                              ),
                            ),
                          ],
                        ),
                        const Divider(color: HighContrastTheme.cardBorder, height: 24.0, thickness: 1.0),
                        // Contenido del Comunicado
                        Text(
                          item.content,
                          style: TextStyle(
                            fontSize: scaler.scaleFontSize(15.0),
                            color: HighContrastTheme.textHighContrast,
                            height: 1.45,
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
      ),
    );
  }
}
