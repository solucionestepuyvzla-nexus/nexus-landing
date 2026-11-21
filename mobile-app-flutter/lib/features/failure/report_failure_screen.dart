import 'package:flutter/material.dart';
import '../../core/accessibility/accessibility_scaler.dart';
import '../../core/models/failure_report.dart';
import '../../core/services/resident_api_service.dart';
import '../../core/theme/high_contrast_theme.dart';
import '../../l10n/app_localizations.dart';

class ReportFailureScreen extends StatefulWidget {
  final AccessibilityScaler scaler;

  const ReportFailureScreen({super.key, required this.scaler});

  @override
  State<ReportFailureScreen> createState() => _ReportFailureScreenState();
}

class _ReportFailureScreenState extends State<ReportFailureScreen> {
  final ResidentApiService _apiService = ResidentApiService();
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _descController = TextEditingController();

  int _selectedTab = 0; // 0: NUEVA INCIDENCIA, 1: MIS REPORTES
  String _severity = 'MEDIUM';
  bool _isRecordingVoice = false;
  bool _hasVoiceAudio = false;
  bool _isSubmitting = false;

  List<FailureReportItem> _reports = [];
  bool _isLoadingReports = false;

  @override
  void initState() {
    super.initState();
    _loadReports();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    super.dispose();
  }

  Future<void> _loadReports() async {
    setState(() => _isLoadingReports = true);
    final reports = await _apiService.getFailureReports();
    if (!mounted) return;
    setState(() {
      _reports = reports;
      _isLoadingReports = false;
    });
  }

  void _simulateVoiceRecording() async {
    setState(() {
      _isRecordingVoice = true;
    });

    await Future<void>.delayed(const Duration(milliseconds: 2500));

    if (!mounted) return;

    setState(() {
      _isRecordingVoice = false;
      _hasVoiceAudio = true;
      if (_titleController.text.isEmpty) {
        _titleController.text = 'Filtración de agua en pasillo piso 4';
      }
      _descController.text =
          'Dictado por voz: Hay un bote de agua saliendo de la junta de la tubería central cerca de los ascensores. El piso está muy resbaloso y puede provocar una caída.';
    });
  }

  Future<void> _submitReport() async {
    final title = _titleController.text.trim();
    final desc = _descController.text.trim();
    final scaler = widget.scaler;
    final l10n = AppLocalizations.of(context);

    if (title.length < 3) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: HighContrastTheme.roseAlert,
          content: Text('Por favor indique el título de la incidencia (mínimo 3 caracteres).'),
        ),
      );
      return;
    }

    if (desc.length < 5) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: HighContrastTheme.roseAlert,
          content: Text('Por favor detalle la descripción de la falla (mínimo 5 caracteres).'),
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    final audioUrl = _hasVoiceAudio
        ? 'https://tepuynexus.blob.storage/audio/dictation_${DateTime.now().millisecondsSinceEpoch}.m4a'
        : null;

    final result = await _apiService.reportFailure(
      title: title,
      description: desc,
      severity: _severity,
      audioDictationUrl: audioUrl,
    );

    if (!mounted) return;
    setState(() => _isSubmitting = false);

    if (result != null) {
      // Limpiar formulario y cambiar de pestaña hacia el historial
      _titleController.clear();
      _descController.clear();
      setState(() {
        _hasVoiceAudio = false;
        _selectedTab = 1; // Cambiar a pestaña de reportes
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: HighContrastTheme.surfaceBackground,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12.0),
            side: const BorderSide(color: HighContrastTheme.cardBorder),
          ),
          content: Row(
            children: [
              const Icon(Icons.check_circle_rounded, color: HighContrastTheme.emeraldBanking, size: 22.0),
              const SizedBox(width: 10.0),
              Expanded(
                child: Text(
                  l10n.failureSuccessMessage,
                  style: TextStyle(
                    fontSize: scaler.scaleFontSize(15.0),
                    color: HighContrastTheme.textWhite,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      );

      await _loadReports();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: HighContrastTheme.roseAlert,
          content: Text('Error al registrar incidencia. Verifique su conexión.'),
        ),
      );
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
          l10n.reportFailureTitle,
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
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(56.0),
          child: Column(
            children: [
              if (_isSubmitting || _isLoadingReports)
                const LinearProgressIndicator(
                  minHeight: 2.0,
                  backgroundColor: HighContrastTheme.darkBackground,
                  valueColor: AlwaysStoppedAnimation<Color>(HighContrastTheme.sapphireBanking),
                )
              else
                const SizedBox(height: 2.0),
              // Segmentador Fiduciario de Pestañas
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 8.0),
                child: Container(
                  height: 44.0,
                  padding: const EdgeInsets.all(3.0),
                  decoration: BoxDecoration(
                    color: HighContrastTheme.surfaceBackground,
                    borderRadius: BorderRadius.circular(12.0),
                    border: Border.all(color: HighContrastTheme.cardBorder),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: InkWell(
                          onTap: () => setState(() => _selectedTab = 0),
                          borderRadius: BorderRadius.circular(9.0),
                          child: Container(
                            decoration: BoxDecoration(
                              color: _selectedTab == 0
                                  ? HighContrastTheme.sapphireBanking
                                  : Colors.transparent,
                              borderRadius: BorderRadius.circular(9.0),
                            ),
                            child: Center(
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    Icons.add_circle_outline_rounded,
                                    size: 16.0,
                                    color: _selectedTab == 0
                                        ? HighContrastTheme.textWhite
                                        : HighContrastTheme.textMuted,
                                  ),
                                  const SizedBox(width: 6.0),
                                  Text(
                                    l10n.failureTabNew,
                                    style: TextStyle(
                                      fontSize: scaler.scaleMicroFontSize(13.0),
                                      fontWeight: _selectedTab == 0 ? FontWeight.w700 : FontWeight.w500,
                                      color: _selectedTab == 0
                                          ? HighContrastTheme.textWhite
                                          : HighContrastTheme.textMuted,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 4.0),
                      Expanded(
                        child: InkWell(
                          onTap: () {
                            setState(() => _selectedTab = 1);
                            _loadReports();
                          },
                          borderRadius: BorderRadius.circular(9.0),
                          child: Container(
                            decoration: BoxDecoration(
                              color: _selectedTab == 1
                                  ? HighContrastTheme.sapphireBanking
                                  : Colors.transparent,
                              borderRadius: BorderRadius.circular(9.0),
                            ),
                            child: Center(
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    Icons.format_list_bulleted_rounded,
                                    size: 16.0,
                                    color: _selectedTab == 1
                                        ? HighContrastTheme.textWhite
                                        : HighContrastTheme.textMuted,
                                  ),
                                  const SizedBox(width: 6.0),
                                  Text(
                                    '${l10n.failureTabHistory} (${_reports.length})',
                                    style: TextStyle(
                                      fontSize: scaler.scaleMicroFontSize(13.0),
                                      fontWeight: _selectedTab == 1 ? FontWeight.w700 : FontWeight.w500,
                                      color: _selectedTab == 1
                                          ? HighContrastTheme.textWhite
                                          : HighContrastTheme.textMuted,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
      body: _selectedTab == 0
          ? _buildNewReportForm(context, l10n, scaler)
          : _buildReportsHistory(context, l10n, scaler),
    );
  }

  Widget _buildNewReportForm(BuildContext context, AppLocalizations l10n, AccessibilityScaler scaler) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Asistente de Voz / Dictado Ejecutivo
          Container(
            padding: const EdgeInsets.all(20.0),
            decoration: BoxDecoration(
              color: HighContrastTheme.surfaceBackground,
              borderRadius: BorderRadius.circular(20.0),
              border: Border.all(color: HighContrastTheme.cardBorder, width: scaler.highContrastBorderWidth),
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
                Row(
                  children: [
                    Container(
                      width: 44.0,
                      height: 44.0,
                      decoration: BoxDecoration(
                        color: HighContrastTheme.cardBackground,
                        borderRadius: BorderRadius.circular(12.0),
                        border: Border.all(color: HighContrastTheme.cardBorder),
                      ),
                      child: const Icon(
                        Icons.mic_none_rounded,
                        size: 24.0,
                        color: HighContrastTheme.sapphireLight,
                      ),
                    ),
                    const SizedBox(width: 14.0),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            l10n.voiceAssistantTitle,
                            style: TextStyle(
                              fontSize: scaler.scaleFontSize(17.0),
                              fontWeight: FontWeight.w700,
                              color: HighContrastTheme.textWhite,
                            ),
                          ),
                          Text(
                            l10n.voiceAssistantDesc,
                            style: TextStyle(
                              fontSize: scaler.scaleFontSize(13.0),
                              color: HighContrastTheme.textMuted,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16.0),
                SizedBox(
                  width: double.infinity,
                  height: 54.0,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _isRecordingVoice
                          ? HighContrastTheme.roseAlert.withValues(alpha: 0.2)
                          : HighContrastTheme.cardBackground,
                      foregroundColor: HighContrastTheme.textWhite,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12.0),
                        side: BorderSide(
                          color: _isRecordingVoice ? HighContrastTheme.roseAlert : HighContrastTheme.cardBorder,
                        ),
                      ),
                    ),
                    onPressed: _isRecordingVoice ? null : _simulateVoiceRecording,
                    icon: Icon(
                      _isRecordingVoice ? Icons.graphic_eq_rounded : Icons.mic_rounded,
                      color: _isRecordingVoice ? HighContrastTheme.roseAlert : HighContrastTheme.sapphireLight,
                    ),
                    label: Text(
                      _isRecordingVoice ? l10n.voiceRecordingActive : l10n.voiceRecordButton,
                      style: TextStyle(
                        fontSize: scaler.scaleFontSize(15.0),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
                if (_hasVoiceAudio) ...[
                  const SizedBox(height: 12.0),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 8.0),
                    decoration: BoxDecoration(
                      color: HighContrastTheme.cardBackground,
                      borderRadius: BorderRadius.circular(10.0),
                      border: Border.all(color: HighContrastTheme.cardBorder),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.check_circle_rounded, color: HighContrastTheme.emeraldBanking, size: 18.0),
                        const SizedBox(width: 8.0),
                        Expanded(
                          child: Text(
                            'Audio procesado con transcripción automática.',
                            style: TextStyle(
                              fontSize: scaler.scaleMicroFontSize(12.0),
                              color: HighContrastTheme.textMuted,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),

          const SizedBox(height: 20.0),

          // Campos de Texto Limpios y Sobrios
          TextField(
            controller: _titleController,
            style: TextStyle(
              fontSize: scaler.scaleFontSize(16.0),
              color: HighContrastTheme.textWhite,
            ),
            decoration: InputDecoration(
              labelText: l10n.failureTitle,
              labelStyle: const TextStyle(color: HighContrastTheme.textMuted),
              filled: true,
              fillColor: HighContrastTheme.surfaceBackground,
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14.0),
                borderSide: const BorderSide(color: HighContrastTheme.cardBorder),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14.0),
                borderSide: const BorderSide(color: HighContrastTheme.sapphireLight, width: 1.5),
              ),
            ),
          ),

          const SizedBox(height: 14.0),

          TextField(
            controller: _descController,
            maxLines: 4,
            style: TextStyle(
              fontSize: scaler.scaleFontSize(16.0),
              color: HighContrastTheme.textWhite,
            ),
            decoration: InputDecoration(
              labelText: l10n.failureDescription,
              labelStyle: const TextStyle(color: HighContrastTheme.textMuted),
              filled: true,
              fillColor: HighContrastTheme.surfaceBackground,
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14.0),
                borderSide: const BorderSide(color: HighContrastTheme.cardBorder),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14.0),
                borderSide: const BorderSide(color: HighContrastTheme.sapphireLight, width: 1.5),
              ),
            ),
          ),

          const SizedBox(height: 20.0),

          // Selector de Urgencia
          Container(
            padding: const EdgeInsets.all(16.0),
            decoration: BoxDecoration(
              color: HighContrastTheme.surfaceBackground,
              borderRadius: BorderRadius.circular(16.0),
              border: Border.all(color: HighContrastTheme.cardBorder, width: scaler.highContrastBorderWidth),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'NIVEL DE URGENCIA',
                  style: TextStyle(
                    fontSize: scaler.scaleMicroFontSize(11.0),
                    fontWeight: FontWeight.w700,
                    color: HighContrastTheme.textMuted,
                    letterSpacing: 1.0,
                  ),
                ),
                const SizedBox(height: 12.0),
                Row(
                  children: [
                    _buildUrgencyChip('LOW', 'Baja', HighContrastTheme.textMuted),
                    const SizedBox(width: 8.0),
                    _buildUrgencyChip('MEDIUM', 'Media', HighContrastTheme.amberNotice),
                    const SizedBox(width: 8.0),
                    _buildUrgencyChip('HIGH', 'Alta', HighContrastTheme.roseAlert),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 24.0),

          // Botón Principal de Envío (Área Táctil >= 80dp)
          SizedBox(
            height: scaler.effectiveTouchTargetHeight,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: HighContrastTheme.sapphirePrimary,
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16.0),
                ),
              ),
              onPressed: _isSubmitting ? null : _submitReport,
              child: _isSubmitting
                  ? const SizedBox(
                      width: 24.0,
                      height: 24.0,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                    )
                  : Text(
                      l10n.submitFailureReport,
                      style: TextStyle(
                        fontSize: scaler.scaleFontSize(18.0),
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.3,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReportsHistory(BuildContext context, AppLocalizations l10n, AccessibilityScaler scaler) {
    if (_isLoadingReports && _reports.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(color: HighContrastTheme.sapphireBanking),
      );
    }

    if (_reports.isEmpty) {
      return RefreshIndicator(
        onRefresh: _loadReports,
        color: HighContrastTheme.sapphireBanking,
        backgroundColor: HighContrastTheme.surfaceBackground,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 40.0),
          children: [
            Center(
              child: Container(
                padding: const EdgeInsets.all(28.0),
                decoration: BoxDecoration(
                  color: HighContrastTheme.surfaceBackground,
                  borderRadius: BorderRadius.circular(20.0),
                  border: Border.all(color: HighContrastTheme.cardBorder),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.build_circle_outlined,
                      size: 48.0,
                      color: HighContrastTheme.textSubtle,
                    ),
                    const SizedBox(height: 16.0),
                    Text(
                      l10n.noFailures,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: scaler.scaleFontSize(16.0),
                        fontWeight: FontWeight.w600,
                        color: HighContrastTheme.textMuted,
                      ),
                    ),
                    const SizedBox(height: 12.0),
                    Text(
                      'Cualquier incidencia reportada aparecerá aquí con su estado de atención en tiempo real.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: scaler.scaleFontSize(13.0),
                        color: HighContrastTheme.textSubtle,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadReports,
      color: HighContrastTheme.sapphireBanking,
      backgroundColor: HighContrastTheme.surfaceBackground,
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
        itemCount: _reports.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12.0),
        itemBuilder: (context, index) {
          final item = _reports[index];
          final isResolved = item.status == 'RESOLVED';

          final Color statusColor = isResolved
              ? HighContrastTheme.emeraldBanking
              : HighContrastTheme.amberNotice;

          Color severityColor;
          String severityLabel;
          switch (item.severity.toUpperCase()) {
            case 'CRITICAL':
            case 'HIGH':
              severityColor = HighContrastTheme.roseAlert;
              severityLabel = l10n.severityHigh;
              break;
            case 'MEDIUM':
              severityColor = HighContrastTheme.amberNotice;
              severityLabel = l10n.severityMedium;
              break;
            case 'LOW':
            default:
              severityColor = HighContrastTheme.textMuted;
              severityLabel = l10n.severityLow;
              break;
          }

          return Container(
            padding: const EdgeInsets.all(18.0),
            decoration: BoxDecoration(
              color: HighContrastTheme.surfaceBackground,
              borderRadius: BorderRadius.circular(16.0),
              border: Border.all(color: HighContrastTheme.cardBorder, width: 1.0),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x22000000),
                  blurRadius: 6.0,
                  offset: Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Fila Superior: Badges de Urgencia y Estado
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Badge de Urgencia
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 3.0),
                      decoration: BoxDecoration(
                        color: severityColor.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(6.0),
                        border: Border.all(color: severityColor.withValues(alpha: 0.4), width: 1.0),
                      ),
                      child: Text(
                        'URGENCIA: $severityLabel',
                        style: TextStyle(
                          fontSize: scaler.scaleMicroFontSize(10.0),
                          fontWeight: FontWeight.w700,
                          color: severityColor,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),

                    // Badge de Estatus (EN ATENCIÓN vs RESUELTA)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10.0, vertical: 4.0),
                      decoration: BoxDecoration(
                        color: statusColor.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(8.0),
                        border: Border.all(color: statusColor.withValues(alpha: 0.4), width: 1.0),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            isResolved ? Icons.check_circle_rounded : Icons.schedule_rounded,
                            size: 13.0,
                            color: statusColor,
                          ),
                          const SizedBox(width: 5.0),
                          Text(
                            isResolved ? l10n.statusResolved : l10n.statusOpen,
                            style: TextStyle(
                              fontSize: scaler.scaleMicroFontSize(11.0),
                              fontWeight: FontWeight.w700,
                              color: statusColor,
                              letterSpacing: 0.4,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 12.0),

                // Título del Reporte
                Text(
                  item.title,
                  style: TextStyle(
                    fontSize: scaler.scaleFontSize(16.0),
                    fontWeight: FontWeight.w700,
                    color: HighContrastTheme.textWhite,
                    letterSpacing: 0.2,
                  ),
                ),

                const SizedBox(height: 6.0),

                // Descripción
                Text(
                  item.description,
                  style: TextStyle(
                    fontSize: scaler.scaleFontSize(13.0),
                    color: HighContrastTheme.textMuted,
                    height: 1.4,
                  ),
                ),

                const SizedBox(height: 14.0),

                // Metadatos inferiores
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    if (item.audioUrl != null)
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.mic_rounded, size: 14.0, color: HighContrastTheme.sapphireLight),
                          const SizedBox(width: 4.0),
                          Text(
                            'Dictado por voz adjunto',
                            style: TextStyle(
                              fontSize: scaler.scaleMicroFontSize(11.0),
                              color: HighContrastTheme.sapphireLight,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      )
                    else
                      const SizedBox.shrink(),

                    Text(
                      item.createdAt,
                      style: TextStyle(
                        fontSize: scaler.scaleMicroFontSize(11.0),
                        color: HighContrastTheme.textSubtle,
                        fontFamily: 'monospace',
                      ),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildUrgencyChip(String code, String label, Color chipColor) {
    final bool isSelected = _severity == code;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _severity = code),
        borderRadius: BorderRadius.circular(10.0),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10.0),
          decoration: BoxDecoration(
            color: isSelected ? chipColor.withValues(alpha: 0.2) : HighContrastTheme.cardBackground,
            borderRadius: BorderRadius.circular(10.0),
            border: Border.all(
              color: isSelected ? chipColor : HighContrastTheme.cardBorder,
              width: 1.2,
            ),
          ),
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                fontSize: widget.scaler.scaleMicroFontSize(13.0),
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                color: isSelected ? HighContrastTheme.textWhite : HighContrastTheme.textMuted,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
