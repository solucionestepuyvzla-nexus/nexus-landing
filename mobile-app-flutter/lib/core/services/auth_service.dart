import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../network/api_client.dart';

class LoginResult {
  final bool success;
  final String? errorMessage;
  final String? tenantId;
  final String? userRole;

  const LoginResult({
    required this.success,
    this.errorMessage,
    this.tenantId,
    this.userRole,
  });
}

class AuthService {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;

  AuthService._internal();

  final Dio _dio = ApiClient().dio;

  /// Verifica si existe un token y un tenant_id activo y válido en almacenamiento local.
  Future<bool> hasValidSession() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(ApiClient.keyAccessToken);
    final tenantId = prefs.getString(ApiClient.keyTenantId);
    return token != null && token.isNotEmpty && tenantId != null && tenantId.isNotEmpty;
  }

  /// Inicia sesión unificado contra el backend FastAPI.
  Future<LoginResult> login({
    required String email,
    required String password,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      // Purgar credenciales anteriores antes de conectar para evitar mezcla de inquilinos
      await prefs.remove(ApiClient.keyAccessToken);
      await prefs.remove(ApiClient.keyTenantId);
      await prefs.remove(ApiClient.keyUnitId);

      final response = await _dio.post<Map<String, dynamic>>(
        '/auth/login',
        data: {
          'email': email.trim(),
          'password': password.trim(),
        },
      );

      if (response.statusCode == 200 && response.data != null) {
        final data = response.data!;
        final token = data['access_token'] as String;
        final tenantId = data['tenant_id'] as String?;
        final role = data['role'] as String?;
        final userId = data['user_id'] as String?;

        await prefs.setString(ApiClient.keyAccessToken, token);
        if (tenantId != null) {
          await prefs.setString(ApiClient.keyTenantId, tenantId);
        }
        if (role != null) {
          await prefs.setString(ApiClient.keyUserRole, role);
        }
        if (userId != null) {
          await prefs.setString(ApiClient.keyUserId, userId);
        }
        await prefs.setString(ApiClient.keyUserEmail, email.trim());

        debugPrint('[AUTH] Sesión iniciada exitosamente para: $email, Tenant: $tenantId');
        return LoginResult(
          success: true,
          tenantId: tenantId,
          userRole: role,
        );
      }
      return const LoginResult(
        success: false,
        errorMessage: 'Credenciales inválidas',
      );
    } on DioException catch (e) {
      debugPrint('[AUTH ERROR] Error en inicio de sesión: ${e.response?.data ?? e.message}');
      final msg = e.response?.data?['detail']?.toString() ?? e.message ?? 'Error de conexión';
      return LoginResult(
        success: false,
        errorMessage: msg,
      );
    } catch (e) {
      debugPrint('[AUTH ERROR] Error inesperado: $e');
      return LoginResult(
        success: false,
        errorMessage: e.toString(),
      );
    }
  }

  /// Garantiza que exista una sesión activa sin auto-logins silenciosos
  Future<bool> ensureActiveSession() async {
    return await hasValidSession();
  }

  /// Cierra la sesión activa borrando todos los tokens e identificadores almacenados.
  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(ApiClient.keyAccessToken);
    await prefs.remove(ApiClient.keyTenantId);
    await prefs.remove(ApiClient.keyUserId);
    await prefs.remove(ApiClient.keyUserRole);
    await prefs.remove(ApiClient.keyUserEmail);
    await prefs.remove(ApiClient.keyUnitId);
    debugPrint('[AUTH] Sesión cerrada y almacenamiento fiduciario purgado.');
  }

  /// Obtiene el correo del usuario en sesión activa.
  Future<String?> getCurrentUserEmail() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(ApiClient.keyUserEmail);
  }

  /// Obtiene el tenant_id en sesión activa.
  Future<String?> getCurrentTenantId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(ApiClient.keyTenantId);
  }
}
