// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Spanish Castilian (`es`).
class AppLocalizationsEs extends AppLocalizations {
  AppLocalizationsEs([String locale = 'es']) : super(locale);

  @override
  String get appTitle => 'Tepuy Nexus Residente';

  @override
  String get seniorModeLabel => 'Modo Senior (Letra Grande)';

  @override
  String get seniorModeSubtitle => 'Fuentes aumentadas y máximo contraste';

  @override
  String get welcomeGreeting => 'Bienvenido a su Hogar';

  @override
  String get buildingLabel => 'Condominio';

  @override
  String get unitLabel => 'Unidad';

  @override
  String get aliquotLabel => 'Alícuota';

  @override
  String get sacredButton1Title => 'ESTADO DE CUENTA';

  @override
  String get sacredButton1Subtitle => 'Ver balance fiduciario, recibos y pagos';

  @override
  String get sacredButton2Title => 'REPORTAR INCIDENCIA';

  @override
  String get sacredButton2Subtitle => 'Asistente de voz y registro de fallas';

  @override
  String get sacredButton3Title => 'CIRCULARES & AVISOS';

  @override
  String get sacredButton3Subtitle => 'Comunicados oficiales de la Junta';

  @override
  String get accountBalanceTitle => 'Estado de Cuenta';

  @override
  String get currentBalanceUsd => 'Saldo Actual en USD';

  @override
  String get currentBalanceLocal => 'Equivalente en Moneda Local';

  @override
  String get reportPaymentButton => 'Reportar Pago Realizado';

  @override
  String get paymentReference => 'Número de Referencia Bancaria';

  @override
  String get paymentAmount => 'Monto Pagado';

  @override
  String get confirmPayment => 'Enviar Comprobante';

  @override
  String get reportFailureTitle => 'Reportar Incidencia o Falla';

  @override
  String get failureTitle => 'Título de la Incidencia';

  @override
  String get failureDescription => 'Descripción Detallada';

  @override
  String get voiceRecordButton => 'Dictar Incidencia por Voz';

  @override
  String get voiceAssistantTitle => 'Asistente de Dictado por Voz';

  @override
  String get voiceAssistantDesc =>
      'Presione para dictar la avería con transcripción automática';

  @override
  String get voiceRecordingActive => 'Grabando su voz...';

  @override
  String get voiceRecordingCompleted => 'Audio grabado con éxito';

  @override
  String get severityLabel => 'Nivel de Urgencia';

  @override
  String get severityLow => 'Baja';

  @override
  String get severityMedium => 'Media';

  @override
  String get severityHigh => 'Alta';

  @override
  String get severityCritical => 'Crítica / Emergencia';

  @override
  String get submitFailureReport => 'Enviar Reporte de Incidencia';

  @override
  String get circularsTitle => 'Circulares y Comunicados';

  @override
  String get noCirculars => 'No hay circulares recientes';

  @override
  String get close => 'Cerrar';

  @override
  String get back => 'Volver';

  @override
  String get myProperty => 'MI INMUEBLE';

  @override
  String get statusSolvent => 'SOLVENTE';

  @override
  String get statusPending => 'PENDIENTE';

  @override
  String get noticeUrgent => 'PRIORITARIO';

  @override
  String get noticeGeneral => 'INFORMATIVO';

  @override
  String get publishedBy => 'Emitido por:';

  @override
  String get recentPaymentsTitle => 'PAGOS RECIENTES AUDITADOS';

  @override
  String get noRecentPayments => 'No hay pagos registrados recientemente';

  @override
  String get statusVerified => 'VERIFICADO';

  @override
  String get statusReview => 'EN REVISIÓN';

  @override
  String get paymentSuccessMessage =>
      'Comprobante fiduciario registrado exitosamente con sello HMAC.';

  @override
  String get failureSuccessMessage =>
      'Incidencia reportada exitosamente a la Junta de Condominio.';

  @override
  String get paymentMethodLabel => 'Método de Pago';

  @override
  String get bcvRateLabel => 'Tasa Oficial BCV:';

  @override
  String get retryLabel => 'Reintentar';

  @override
  String get failureTabNew => 'NUEVA INCIDENCIA';

  @override
  String get failureTabHistory => 'MIS REPORTES';

  @override
  String get statusOpen => 'EN ATENCIÓN';

  @override
  String get statusResolved => 'RESUELTA';

  @override
  String get noFailures => 'No hay incidencias registradas';

  @override
  String get loginTitle => 'Acceso Fiduciario';

  @override
  String get loginSubtitle =>
      'Ingrese con su correo registrado de copropietario';

  @override
  String get loginEmailLabel => 'Correo Electrónico';

  @override
  String get loginEmailHint => 'ejemplo@tepuynexus.com';

  @override
  String get loginPasswordLabel => 'Contraseña';

  @override
  String get loginPasswordHint => 'Ingrese su contraseña segura';

  @override
  String get loginButton => 'INICIAR SESIÓN';

  @override
  String get loginLoggingIn => 'Autenticando credenciales...';

  @override
  String get loginErrorInvalidCredentials =>
      'Credenciales inválidas. Verifique correo y contraseña.';

  @override
  String get loginErrorConnection =>
      'Error de conexión con el servidor. Intente nuevamente.';

  @override
  String get logoutButton => 'Cerrar Sesión';

  @override
  String get logoutConfirmTitle => '¿Cerrar Sesión?';

  @override
  String get logoutConfirmMessage =>
      '¿Desea cerrar la sesión activa de este dispositivo?';

  @override
  String get logoutConfirmCancel => 'Cancelar';

  @override
  String get logoutConfirmOk => 'Cerrar Sesión';

  @override
  String get demoCredentialsTitle => 'ACCESO RÁPIDO DE PRUEBA';

  @override
  String get demoBuilding1 => 'Carlos Mendoza (Tepuy Royal)';

  @override
  String get demoBuilding2 => 'Dra. Elena Rostova (Mirador del Bosque)';
}
