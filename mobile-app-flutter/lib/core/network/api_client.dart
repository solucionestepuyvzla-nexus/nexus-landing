import 'dart:io' show Platform;
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Cliente HTTP Centralizado para TEPUY CONDO NEXUS (App Móvil).
/// Inyecta automáticamente cabeceras de autorización JWT y contexto multi-tenant X-Tenant-ID.
class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;

  late final Dio dio;

  // Claves de SharedPreferences
  static const String keyAccessToken = 'tepuy_access_token';
  static const String keyTenantId = 'tepuy_tenant_id';
  static const String keyUserId = 'tepuy_user_id';
  static const String keyUserRole = 'tepuy_user_role';
  static const String keyUserEmail = 'tepuy_user_email';
  static const String keyUnitId = 'tepuy_unit_id';

  // Detección automática del Host:
  // - En emulador Android: 10.0.2.2 apunta al host de desarrollo.
  // - En iOS, Windows Desktop o Web: 127.0.0.1 apunta a localhost.
  static String get defaultBaseUrl {
    if (!kIsWeb && Platform.isAndroid) {
      return 'http://10.0.2.2:8000/api/v1';
    }
    return 'http://127.0.0.1:8000/api/v1';
  }

  ApiClient._internal() {
    dio = Dio(
      BaseOptions(
        baseUrl: defaultBaseUrl,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final prefs = await SharedPreferences.getInstance();
          final token = prefs.getString(keyAccessToken);
          final tenantId = prefs.getString(keyTenantId);

          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          if (tenantId != null && tenantId.isNotEmpty) {
            options.headers['X-Tenant-ID'] = tenantId;
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) {
          // Log fiduciario y manejo de errores
          if (error.response?.statusCode == 402) {
            debugPrint('[HTTP 402] Licencia de condominio vencida o suspendida.');
          }
          return handler.next(error);
        },
      ),
    );
  }
}

