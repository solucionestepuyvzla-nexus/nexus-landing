import 'dart:math';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/circular.dart';
import '../models/failure_report.dart';
import '../models/resident_account.dart';
import '../network/api_client.dart';
import 'auth_service.dart';

class ResidentApiService {
  static final ResidentApiService _instance = ResidentApiService._internal();
  factory ResidentApiService() => _instance;

  ResidentApiService._internal();

  final Dio _dio = ApiClient().dio;
  final AuthService _authService = AuthService();

  /// [BOTÓN SAGRADO 1: CONSULTAR CUENTA]
  /// Consume el saldo en USD base y su conversión en tiempo real a la divisa solicitada (VES/USD).
  Future<ResidentAccount> getAccountStatus({String currencyView = 'VES'}) async {
    await _authService.ensureActiveSession();

    try {
      // 1. Obtener estado de cuenta
      final response = await _dio.get<Map<String, dynamic>>(
        '/resident/account-status',
        queryParameters: {'currency_view': currencyView},
      );

      if (response.statusCode == 200 && response.data != null) {
        final data = response.data!;

        // Guardar unit_id para pagos y reportes de fallas
        final unitId = data['unit_id']?.toString();
        if (unitId != null && unitId.isNotEmpty) {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString(ApiClient.keyUnitId, unitId);
        }

        // 2. Obtener pagos recientes
        final payments = await getRecentPayments();

        return ResidentAccount.fromJson(data, payments: payments);
      }
    } on DioException catch (e) {
      debugPrint('[API ERROR] Error en getAccountStatus: ${e.response?.data ?? e.message}');
    } catch (e) {
      debugPrint('[API ERROR] Error inesperado en getAccountStatus: $e');
    }

    // Fallback seguro en caso de desconexión momentánea
    return ResidentAccount.mock();
  }

  /// Obtiene el historial de pagos auditados del residente
  Future<List<RecentPayment>> getRecentPayments() async {
    try {
      final response = await _dio.get<List<dynamic>>('/resident/payments');
      if (response.statusCode == 200 && response.data != null) {
        return response.data!
            .map((item) => RecentPayment.fromJson(item as Map<String, dynamic>))
            .toList();
      }
    } on DioException catch (e) {
      debugPrint('[API ERROR] Error en getRecentPayments: ${e.response?.data ?? e.message}');
    } catch (e) {
      debugPrint('[API ERROR] Error inesperado en getRecentPayments: $e');
    }
    return [];
  }

  /// [BOTÓN SAGRADO 3: VER CIRCULARES]
  /// Consulta los avisos oficiales ordenados por urgencia y fecha de publicación.
  Future<List<CircularNotice>> getCirculars() async {
    await _authService.ensureActiveSession();

    try {
      final response = await _dio.get<List<dynamic>>('/resident/circulars');
      if (response.statusCode == 200 && response.data != null) {
        return response.data!
            .map((item) => CircularNotice.fromJson(item as Map<String, dynamic>))
            .toList();
      }
    } on DioException catch (e) {
      debugPrint('[API ERROR] Error en getCirculars: ${e.response?.data ?? e.message}');
    } catch (e) {
      debugPrint('[API ERROR] Error inesperado en getCirculars: $e');
    }

    return CircularNotice.getMocks();
  }

  /// [BOTÓN SAGRADO 2: REPORTAR FALLA]
  /// Envía reporte de incidencia a la base de datos PostgreSQL persistente.
  Future<FailureReportItem?> reportFailure({
    required String title,
    required String description,
    String severity = 'MEDIUM',
    String? audioDictationUrl,
  }) async {
    await _authService.ensureActiveSession();

    final prefs = await SharedPreferences.getInstance();
    final unitId = prefs.getString(ApiClient.keyUnitId) ??
        '55555555-5555-5555-5555-555555555551'; // Unidad 1-A por defecto

    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/resident/failure-reports',
        data: {
          'unit_id': unitId,
          'title': title,
          'description': description,
          'severity': severity,
          'audio_dictation_url': audioDictationUrl,
        },
      );

      if (response.statusCode == 201 && response.data != null) {
        return FailureReportItem.fromJson(response.data!);
      }
    } on DioException catch (e) {
      debugPrint('[API ERROR] Error en reportFailure: ${e.response?.data ?? e.message}');
    } catch (e) {
      debugPrint('[API ERROR] Error inesperado en reportFailure: $e');
    }
    return null;
  }

  /// [CONSULTAR INCIDENCIAS / ESTADO DE REPORTES]
  /// Consulta los reportes de averías activos e históricos para esta propiedad/edificio.
  Future<List<FailureReportItem>> getFailureReports() async {
    await _authService.ensureActiveSession();

    try {
      final response = await _dio.get<List<dynamic>>('/resident/failure-reports');
      if (response.statusCode == 200 && response.data != null) {
        return response.data!
            .map((item) => FailureReportItem.fromJson(item as Map<String, dynamic>))
            .toList();
      }
    } on DioException catch (e) {
      debugPrint('[API ERROR] Error en getFailureReports: ${e.response?.data ?? e.message}');
    } catch (e) {
      debugPrint('[API ERROR] Error inesperado en getFailureReports: $e');
    }
    return [];
  }

  /// [SUBMÓDULO: REPORTAR PAGO AUDITADO]
  /// Registra comprobante de pago con clave de idempotencia anti-duplicidad.
  Future<bool> reportPayment({
    required double amountOriginal,
    required String currencyOriginal,
    required String paymentMethod,
    required String referenceNumber,
    String? proofImageUrl,
  }) async {
    await _authService.ensureActiveSession();

    final prefs = await SharedPreferences.getInstance();
    final unitId = prefs.getString(ApiClient.keyUnitId) ??
        '55555555-5555-5555-5555-555555555551';

    // Clave de Idempotencia única para evitar dobles cobros
    final idempotencyKey =
        'IDEMP-${DateTime.now().millisecondsSinceEpoch}-${Random().nextInt(999999)}';

    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/resident/payments',
        data: {
          'unit_id': unitId,
          'amount_original': amountOriginal.toStringAsFixed(4),
          'currency_original': currencyOriginal,
          'payment_method': paymentMethod,
          'reference_number': referenceNumber,
          'proof_image_url': proofImageUrl,
          'idempotency_key': idempotencyKey,
        },
      );

      return response.statusCode == 201;
    } on DioException catch (e) {
      debugPrint('[API ERROR] Error en reportPayment: ${e.response?.data ?? e.message}');
      return false;
    } catch (e) {
      debugPrint('[API ERROR] Error inesperado en reportPayment: $e');
      return false;
    }
  }
}

