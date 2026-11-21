import 'package:flutter/material.dart';
import '../../core/accessibility/accessibility_scaler.dart';
import '../../core/models/resident_account.dart';
import '../../core/services/resident_api_service.dart';
import '../../core/theme/high_contrast_theme.dart';
import '../../l10n/app_localizations.dart';

class AccountBalanceScreen extends StatefulWidget {
  final AccessibilityScaler scaler;
  final ResidentAccount? initialAccount;

  const AccountBalanceScreen({
    super.key,
    required this.scaler,
    this.initialAccount,
  });

  @override
  State<AccountBalanceScreen> createState() => _AccountBalanceScreenState();
}

class _AccountBalanceScreenState extends State<AccountBalanceScreen> {
  late ResidentAccount account;
  final ResidentApiService _apiService = ResidentApiService();
  final TextEditingController _refController = TextEditingController();
  final TextEditingController _amountController = TextEditingController();
  String _selectedPaymentMethod = 'Pago Móvil Interbancario';
  bool _isLoading = false;
  bool _isSubmittingPayment = false;

  @override
  void initState() {
    super.initState();
    account = widget.initialAccount ?? ResidentAccount.mock();
    _fetchAccountData();
  }

  @override
  void dispose() {
    _refController.dispose();
    _amountController.dispose();
    super.dispose();
  }

  Future<void> _fetchAccountData() async {
    setState(() => _isLoading = true);
    try {
      final updated = await _apiService.getAccountStatus();
      if (mounted) {
        setState(() {
          account = updated;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('[ACCOUNT ERROR] $e');
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _showReportPaymentDialog() {
    final l10n = AppLocalizations.of(context);
    final scaler = widget.scaler;

    if (_amountController.text.isEmpty && account.balanceLocalCurrency != '0.00' && account.balanceLocalCurrency != '0') {
      _amountController.text = account.balanceLocalCurrency.replaceAll(',', '');
    }

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: HighContrastTheme.surfaceBackground,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24.0)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (modalContext, setModalState) => Padding(
          padding: EdgeInsets.only(
            left: 20.0,
            right: 20.0,
            top: 24.0,
            bottom: MediaQuery.of(modalContext).viewInsets.bottom + 24.0,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    l10n.reportPaymentButton,
                    style: TextStyle(
                      fontSize: scaler.scaleFontSize(20.0),
                      fontWeight: FontWeight.w700,
                      color: HighContrastTheme.textWhite,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, color: HighContrastTheme.textMuted),
                    onPressed: () => Navigator.pop(modalContext),
                  ),
                ],
              ),
              const SizedBox(height: 18.0),
              // Selector de Método de Pago
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14.0, vertical: 4.0),
                decoration: BoxDecoration(
                  color: HighContrastTheme.cardBackground,
                  borderRadius: BorderRadius.circular(12.0),
                  border: Border.all(color: HighContrastTheme.cardBorder),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _selectedPaymentMethod,
                    dropdownColor: HighContrastTheme.surfaceBackground,
                    style: TextStyle(
                      fontSize: scaler.scaleFontSize(15.0),
                      color: HighContrastTheme.textWhite,
                    ),
                    icon: const Icon(Icons.arrow_drop_down_rounded, color: HighContrastTheme.textWhite),
                    items: const [
                      DropdownMenuItem(
                        value: 'Pago Móvil Interbancario',
                        child: Text('Pago Móvil Interbancario'),
                      ),
                      DropdownMenuItem(
                        value: 'Transferencia Bancaria',
                        child: Text('Transferencia Bancaria'),
                      ),
                      DropdownMenuItem(
                        value: 'Zelle / USD',
                        child: Text('Zelle / Transferencia USD'),
                      ),
                    ],
                    onChanged: (val) {
                      if (val != null) {
                        setModalState(() => _selectedPaymentMethod = val);
                      }
                    },
                  ),
                ),
              ),
              const SizedBox(height: 14.0),
              TextField(
                controller: _refController,
                style: TextStyle(
                  fontSize: scaler.scaleFontSize(17.0),
                  color: HighContrastTheme.textWhite,
                ),
                decoration: InputDecoration(
                  labelText: l10n.paymentReference,
                  hintText: 'Ej. REF-839201',
                  hintStyle: const TextStyle(color: HighContrastTheme.textSubtle),
                  labelStyle: const TextStyle(color: HighContrastTheme.textMuted),
                  filled: true,
                  fillColor: HighContrastTheme.cardBackground,
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12.0),
                    borderSide: const BorderSide(color: HighContrastTheme.cardBorder),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12.0),
                    borderSide: const BorderSide(color: HighContrastTheme.sapphireLight, width: 1.5),
                  ),
                ),
              ),
              const SizedBox(height: 14.0),
              TextField(
                controller: _amountController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                style: TextStyle(
                  fontSize: scaler.scaleFontSize(17.0),
                  color: HighContrastTheme.textWhite,
                ),
                decoration: InputDecoration(
                  labelText: '${l10n.paymentAmount} (${_selectedPaymentMethod.contains("USD") ? "USD" : account.localCurrencyCode})',
                  hintText: '0.00',
                  hintStyle: const TextStyle(color: HighContrastTheme.textSubtle),
                  labelStyle: const TextStyle(color: HighContrastTheme.textMuted),
                  filled: true,
                  fillColor: HighContrastTheme.cardBackground,
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12.0),
                    borderSide: const BorderSide(color: HighContrastTheme.cardBorder),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12.0),
                    borderSide: const BorderSide(color: HighContrastTheme.sapphireLight, width: 1.5),
                  ),
                ),
              ),
              const SizedBox(height: 24.0),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: HighContrastTheme.sapphirePrimary,
                  foregroundColor: Colors.white,
                  minimumSize: const Size.fromHeight(56.0),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14.0),
                  ),
                  elevation: 0,
                ),
                onPressed: _isSubmittingPayment
                    ? null
                    : () async {
                        final ref = _refController.text.trim();
                        final amountText = _amountController.text.trim().replaceAll(',', '.');
                        final parsedAmount = double.tryParse(amountText);

                        if (ref.length < 4) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Por favor ingrese un número de referencia bancario válido.'),
                            ),
                          );
                          return;
                        }

                        if (parsedAmount == null || parsedAmount <= 0) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Por favor ingrese un monto mayor a 0.'),
                            ),
                          );
                          return;
                        }

                        setModalState(() => _isSubmittingPayment = true);

                        final currency = _selectedPaymentMethod.contains('USD') ? 'USD' : account.localCurrencyCode;
                        final navigator = Navigator.of(context);
                        final messenger = ScaffoldMessenger.of(context);

                        final ok = await _apiService.reportPayment(
                          amountOriginal: parsedAmount,
                          currencyOriginal: currency,
                          paymentMethod: _selectedPaymentMethod,
                          referenceNumber: ref,
                        );

                        if (!mounted) return;
                        setModalState(() => _isSubmittingPayment = false);

                        if (ok) {
                          navigator.pop();
                          _refController.clear();
                          _amountController.clear();
                          await _fetchAccountData();
                          messenger.showSnackBar(
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
                                      l10n.paymentSuccessMessage,
                                      style: TextStyle(
                                        fontSize: scaler.scaleFontSize(14.0),
                                        color: HighContrastTheme.textWhite,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        } else {
                          messenger.showSnackBar(
                            const SnackBar(
                              backgroundColor: HighContrastTheme.roseAlert,
                              content: Text('Error al registrar pago. Verifique su conexión o referencia duplicada.'),
                            ),
                          );
                        }
                      },
                child: _isSubmittingPayment
                    ? const SizedBox(
                        width: 22.0,
                        height: 22.0,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.0),
                      )
                    : Text(
                        l10n.confirmPayment,
                        style: TextStyle(
                          fontSize: scaler.scaleFontSize(17.0),
                          fontWeight: FontWeight.w700,
                        ),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
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
          l10n.accountBalanceTitle,
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
        onRefresh: _fetchAccountData,
        color: HighContrastTheme.sapphireLight,
        backgroundColor: HighContrastTheme.surfaceBackground,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Tarjeta Principal FinTech (Balance Fiduciario)
              Container(
                padding: const EdgeInsets.all(24.0),
                decoration: BoxDecoration(
                  color: HighContrastTheme.surfaceBackground,
                  borderRadius: BorderRadius.circular(20.0),
                  border: Border.all(color: HighContrastTheme.cardBorder, width: scaler.highContrastBorderWidth),
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
                            '${account.buildingName} • Apto ${account.unitNumber}',
                            style: TextStyle(
                              fontSize: scaler.scaleFontSize(14.0),
                              color: HighContrastTheme.textMuted,
                              fontWeight: FontWeight.w600,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 8.0),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 3.0),
                          decoration: BoxDecoration(
                            color: (account.isSolvent ? HighContrastTheme.emeraldBanking : HighContrastTheme.amberNotice)
                                .withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(6.0),
                            border: Border.all(
                              color: (account.isSolvent ? HighContrastTheme.emeraldBanking : HighContrastTheme.amberNotice)
                                  .withValues(alpha: 0.35),
                              width: 1.0,
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                account.isSolvent ? Icons.shield_outlined : Icons.schedule_rounded,
                                size: 11.0,
                                color: account.isSolvent ? HighContrastTheme.emeraldBanking : HighContrastTheme.amberNotice,
                              ),
                              const SizedBox(width: 4.0),
                              Text(
                                account.isSolvent ? l10n.statusSolvent : l10n.statusPending,
                                style: TextStyle(
                                  fontSize: scaler.scaleMicroFontSize(10.0),
                                  fontWeight: FontWeight.w700,
                                  color: account.isSolvent ? HighContrastTheme.emeraldBanking : HighContrastTheme.amberNotice,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 18.0),
                    Text(
                      l10n.currentBalanceUsd,
                      style: TextStyle(
                        fontSize: scaler.scaleFontSize(14.0),
                        color: HighContrastTheme.textMuted,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 6.0),
                    Text(
                      '\$${account.balanceUsd} USD',
                      style: TextStyle(
                        fontSize: scaler.scaleFontSize(36.0),
                        color: HighContrastTheme.textWhite,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const Divider(color: HighContrastTheme.cardBorder, height: 32.0, thickness: 1.0),
                    Text(
                      l10n.currentBalanceLocal,
                      style: TextStyle(
                        fontSize: scaler.scaleFontSize(13.0),
                        color: HighContrastTheme.textMuted,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 4.0),
                    Text(
                      'Bs. ${account.balanceLocalCurrency} ${account.localCurrencyCode}',
                      style: TextStyle(
                        fontSize: scaler.scaleFontSize(24.0),
                        color: HighContrastTheme.emeraldBanking,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 10.0),
                    Row(
                      children: [
                        const Icon(Icons.sync_rounded, size: 13.0, color: HighContrastTheme.textSubtle),
                        const SizedBox(width: 5.0),
                        Expanded(
                          child: Text(
                            '${l10n.bcvRateLabel} 1 USD = ${account.exchangeRateApplied} ${account.localCurrencyCode}',
                            style: TextStyle(
                              fontSize: scaler.scaleMicroFontSize(12.0),
                              color: HighContrastTheme.textSubtle,
                              fontFamily: 'monospace',
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20.0),

              // Botón Ejecutivo para Reportar Pago (Área Táctil >= 80dp)
              SizedBox(
                height: scaler.effectiveTouchTargetHeight,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: HighContrastTheme.sapphirePrimary,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16.0),
                    ),
                  ),
                  onPressed: _showReportPaymentDialog,
                  icon: const Icon(Icons.receipt_long_rounded, size: 28.0),
                  label: Text(
                    l10n.reportPaymentButton,
                    style: TextStyle(
                      fontSize: scaler.scaleFontSize(18.0),
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.3,
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 28.0),

              // Sección: Historial de Pagos Auditados
              Text(
                l10n.recentPaymentsTitle,
                style: TextStyle(
                  fontSize: scaler.scaleFontSize(12.0),
                  fontWeight: FontWeight.w700,
                  color: HighContrastTheme.textMuted,
                  letterSpacing: 1.2,
                ),
              ),
              const SizedBox(height: 12.0),

              if (account.recentPayments.isEmpty)
                Container(
                  padding: const EdgeInsets.all(20.0),
                  decoration: BoxDecoration(
                    color: HighContrastTheme.surfaceBackground,
                    borderRadius: BorderRadius.circular(14.0),
                    border: Border.all(color: HighContrastTheme.cardBorder),
                  ),
                  child: Center(
                    child: Text(
                      l10n.noRecentPayments,
                      style: TextStyle(
                        fontSize: scaler.scaleFontSize(14.0),
                        color: HighContrastTheme.textMuted,
                      ),
                    ),
                  ),
                )
              else
                ...account.recentPayments.map(
                  (payment) => Container(
                    margin: const EdgeInsets.only(bottom: 12.0),
                    padding: const EdgeInsets.all(18.0),
                    decoration: BoxDecoration(
                      color: HighContrastTheme.surfaceBackground,
                      borderRadius: BorderRadius.circular(16.0),
                      border: Border.all(color: HighContrastTheme.cardBorder, width: scaler.highContrastBorderWidth),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Ref: ${payment.referenceNumber}',
                              style: TextStyle(
                                fontSize: scaler.scaleFontSize(14.0),
                                fontWeight: FontWeight.w700,
                                color: HighContrastTheme.textWhite,
                                fontFamily: 'monospace',
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 3.0),
                              decoration: BoxDecoration(
                                color: (payment.status == 'VERIFIED'
                                        ? HighContrastTheme.emeraldBanking
                                        : HighContrastTheme.amberNotice)
                                    .withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(6.0),
                                border: Border.all(
                                  color: (payment.status == 'VERIFIED'
                                          ? HighContrastTheme.emeraldBanking
                                          : HighContrastTheme.amberNotice)
                                      .withValues(alpha: 0.35),
                                  width: 1.0,
                                ),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    payment.status == 'VERIFIED'
                                        ? Icons.verified_rounded
                                        : Icons.hourglass_empty_rounded,
                                    size: 11.0,
                                    color: payment.status == 'VERIFIED'
                                        ? HighContrastTheme.emeraldBanking
                                        : HighContrastTheme.amberNotice,
                                  ),
                                  const SizedBox(width: 4.0),
                                  Text(
                                    payment.status == 'VERIFIED' ? l10n.statusVerified : l10n.statusReview,
                                    style: TextStyle(
                                      fontSize: scaler.scaleMicroFontSize(10.0),
                                      fontWeight: FontWeight.w700,
                                      color: payment.status == 'VERIFIED'
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
                        const SizedBox(height: 8.0),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              payment.paymentMethod,
                              style: TextStyle(
                                fontSize: scaler.scaleFontSize(13.0),
                                color: HighContrastTheme.textMuted,
                              ),
                            ),
                            Text(
                              payment.date,
                              style: TextStyle(
                                fontSize: scaler.scaleMicroFontSize(12.0),
                                color: HighContrastTheme.textSubtle,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8.0),
                        Text(
                          'Bs. ${payment.amountOriginal} ${payment.currencyOriginal} (\$${payment.amountUsd} USD)',
                          style: TextStyle(
                            fontSize: scaler.scaleFontSize(16.0),
                            fontWeight: FontWeight.w700,
                            color: HighContrastTheme.emeraldBanking,
                          ),
                        ),
                        if (payment.proofHash != null && payment.proofHash!.isNotEmpty) ...[
                          const SizedBox(height: 8.0),
                          Row(
                            children: [
                              const Icon(Icons.fingerprint_rounded, size: 13.0, color: HighContrastTheme.textSubtle),
                              const SizedBox(width: 4.0),
                              Expanded(
                                child: Text(
                                  'Sello HMAC: ${payment.proofHash!.length > 20 ? "${payment.proofHash!.substring(0, 20)}..." : payment.proofHash}',
                                  style: TextStyle(
                                    fontSize: scaler.scaleMicroFontSize(10.0),
                                    color: HighContrastTheme.textSubtle,
                                    fontFamily: 'monospace',
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
