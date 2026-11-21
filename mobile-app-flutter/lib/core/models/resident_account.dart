class ResidentAccount {
  final String? unitId;
  final String unitNumber;
  final String buildingName;
  final String aliquotPercentage;
  final String balanceUsd;
  final String balanceLocalCurrency;
  final String localCurrencyCode;
  final String exchangeRateApplied;
  final String billingMonth;
  final bool isSolventCustom;
  final int pendingReceiptsCount;
  final String? lastPaymentDate;
  final List<RecentPayment> recentPayments;

  const ResidentAccount({
    this.unitId,
    required this.unitNumber,
    required this.buildingName,
    this.aliquotPercentage = '5.2500',
    required this.balanceUsd,
    required this.balanceLocalCurrency,
    required this.localCurrencyCode,
    required this.exchangeRateApplied,
    required this.billingMonth,
    this.isSolventCustom = false,
    this.pendingReceiptsCount = 0,
    this.lastPaymentDate,
    required this.recentPayments,
  });

  bool get isSolvent => isSolventCustom || balanceUsd == '0.00' || balanceUsd == '0' || balanceUsd.startsWith('-');

  ResidentAccount copyWith({
    String? unitId,
    String? unitNumber,
    String? buildingName,
    String? aliquotPercentage,
    String? balanceUsd,
    String? balanceLocalCurrency,
    String? localCurrencyCode,
    String? exchangeRateApplied,
    String? billingMonth,
    bool? isSolventCustom,
    int? pendingReceiptsCount,
    String? lastPaymentDate,
    List<RecentPayment>? recentPayments,
  }) {
    return ResidentAccount(
      unitId: unitId ?? this.unitId,
      unitNumber: unitNumber ?? this.unitNumber,
      buildingName: buildingName ?? this.buildingName,
      aliquotPercentage: aliquotPercentage ?? this.aliquotPercentage,
      balanceUsd: balanceUsd ?? this.balanceUsd,
      balanceLocalCurrency: balanceLocalCurrency ?? this.balanceLocalCurrency,
      localCurrencyCode: localCurrencyCode ?? this.localCurrencyCode,
      exchangeRateApplied: exchangeRateApplied ?? this.exchangeRateApplied,
      billingMonth: billingMonth ?? this.billingMonth,
      isSolventCustom: isSolventCustom ?? this.isSolventCustom,
      pendingReceiptsCount: pendingReceiptsCount ?? this.pendingReceiptsCount,
      lastPaymentDate: lastPaymentDate ?? this.lastPaymentDate,
      recentPayments: recentPayments ?? this.recentPayments,
    );
  }

  factory ResidentAccount.fromJson(
    Map<String, dynamic> json, {
    List<RecentPayment> payments = const [],
  }) {
    final debtUsdRaw = json['total_debt_base_usd']?.toString() ?? '0.00';
    final localRaw = json['equivalent_local_currency']?.toString() ?? '0.00';
    final rateRaw = json['exchange_rate_applied']?.toString() ?? '1.0000';
    final isSolventRaw = json['is_solvent'] == true;
    final unitId = json['unit_id']?.toString();
    final unitNumber = json['unit_number']?.toString() ?? '1-A';
    final buildingName = json['building_name']?.toString() ?? 'Condominio';
    final localCurrencyCode = json['local_currency_code']?.toString() ?? 'VES';
    final pendingCount = (json['pending_receipts_count'] as num?)?.toInt() ?? 0;
    final lastPay = json['last_payment_date']?.toString();

    final rateNum = double.tryParse(rateRaw) ?? 1.0;
    final displayRate = (rateNum > 0 && rateNum < 1.0)
        ? (1.0 / rateNum).toStringAsFixed(2)
        : rateNum.toStringAsFixed(2);

    final debtUsdFormatted = double.tryParse(debtUsdRaw)?.toStringAsFixed(2) ?? debtUsdRaw;
    final localFormatted = double.tryParse(localRaw)?.toStringAsFixed(2) ?? localRaw;
    final aliquotRaw = json['aliquot_percentage']?.toString() ?? '0.0525';
    final aliquotNum = double.tryParse(aliquotRaw) ?? 0.0525;
    final aliquotFormatted = (aliquotNum > 0 && aliquotNum < 1.0)
        ? (aliquotNum * 100).toStringAsFixed(2)
        : aliquotNum.toStringAsFixed(2);

    final now = DateTime.now();
    final monthStr = '${now.year}-${now.month.toString().padLeft(2, '0')}';

    return ResidentAccount(
      unitId: unitId,
      unitNumber: unitNumber,
      buildingName: buildingName,
      aliquotPercentage: aliquotFormatted,
      balanceUsd: debtUsdFormatted,
      balanceLocalCurrency: localFormatted,
      localCurrencyCode: localCurrencyCode,
      exchangeRateApplied: displayRate,
      billingMonth: monthStr,
      isSolventCustom: isSolventRaw,
      pendingReceiptsCount: pendingCount,
      lastPaymentDate: lastPay,
      recentPayments: payments,
    );
  }

  factory ResidentAccount.mock() {
    return const ResidentAccount(
      unitNumber: '1-A',
      buildingName: 'Residencias Tepuy Royal',
      aliquotPercentage: '5.2500',
      balanceUsd: '44.70',
      balanceLocalCurrency: '1,824.49',
      localCurrencyCode: 'VES',
      exchangeRateApplied: '40.82',
      billingMonth: '2026-10',
      isSolventCustom: false,
      pendingReceiptsCount: 1,
      recentPayments: [
        RecentPayment(
          referenceNumber: 'REF-749201',
          paymentMethod: 'Pago Móvil Interbancario',
          amountUsd: '42.50',
          amountOriginal: '1,700.00',
          currencyOriginal: 'VES',
          status: 'VERIFIED',
          date: '23/09/2026',
        ),
      ],
    );
  }
}

class RecentPayment {
  final String id;
  final String referenceNumber;
  final String paymentMethod;
  final String amountUsd;
  final String amountOriginal;
  final String currencyOriginal;
  final String status;
  final String date;
  final String? proofHash;

  const RecentPayment({
    this.id = '',
    required this.referenceNumber,
    this.paymentMethod = 'Pago Móvil Interbancario',
    required this.amountUsd,
    required this.amountOriginal,
    required this.currencyOriginal,
    required this.status,
    required this.date,
    this.proofHash,
  });

  factory RecentPayment.fromJson(Map<String, dynamic> json) {
    String dateFormatted = '';
    if (json['created_at'] != null) {
      try {
        final dt = DateTime.parse(json['created_at'].toString()).toLocal();
        dateFormatted =
            '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year}';
      } catch (_) {
        dateFormatted = json['created_at'].toString();
      }
    }

    final amountUsdRaw = json['amount_base_usd']?.toString() ?? '0.00';
    final amountOrigRaw = json['amount_original']?.toString() ?? '0.00';

    return RecentPayment(
      id: json['id']?.toString() ?? '',
      referenceNumber: json['reference_number']?.toString() ?? '',
      paymentMethod: json['payment_method']?.toString() ?? 'Transferencia',
      amountUsd: double.tryParse(amountUsdRaw)?.toStringAsFixed(2) ?? amountUsdRaw,
      amountOriginal: double.tryParse(amountOrigRaw)?.toStringAsFixed(2) ?? amountOrigRaw,
      currencyOriginal: json['currency_original']?.toString() ?? 'VES',
      status: json['status']?.toString() ?? 'PENDING_REVIEW',
      date: dateFormatted,
      proofHash: json['proof_hash']?.toString(),
    );
  }
}
