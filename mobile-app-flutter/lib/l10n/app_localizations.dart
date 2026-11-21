import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_es.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
      : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
    delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
  ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('es')
  ];

  /// No description provided for @appTitle.
  ///
  /// In es, this message translates to:
  /// **'Tepuy Nexus Residente'**
  String get appTitle;

  /// No description provided for @seniorModeLabel.
  ///
  /// In es, this message translates to:
  /// **'Modo Senior (Letra Grande)'**
  String get seniorModeLabel;

  /// No description provided for @seniorModeSubtitle.
  ///
  /// In es, this message translates to:
  /// **'Fuentes aumentadas y máximo contraste'**
  String get seniorModeSubtitle;

  /// No description provided for @welcomeGreeting.
  ///
  /// In es, this message translates to:
  /// **'Bienvenido a su Hogar'**
  String get welcomeGreeting;

  /// No description provided for @buildingLabel.
  ///
  /// In es, this message translates to:
  /// **'Condominio'**
  String get buildingLabel;

  /// No description provided for @unitLabel.
  ///
  /// In es, this message translates to:
  /// **'Unidad'**
  String get unitLabel;

  /// No description provided for @aliquotLabel.
  ///
  /// In es, this message translates to:
  /// **'Alícuota'**
  String get aliquotLabel;

  /// No description provided for @sacredButton1Title.
  ///
  /// In es, this message translates to:
  /// **'ESTADO DE CUENTA'**
  String get sacredButton1Title;

  /// No description provided for @sacredButton1Subtitle.
  ///
  /// In es, this message translates to:
  /// **'Ver balance fiduciario, recibos y pagos'**
  String get sacredButton1Subtitle;

  /// No description provided for @sacredButton2Title.
  ///
  /// In es, this message translates to:
  /// **'REPORTAR INCIDENCIA'**
  String get sacredButton2Title;

  /// No description provided for @sacredButton2Subtitle.
  ///
  /// In es, this message translates to:
  /// **'Asistente de voz y registro de fallas'**
  String get sacredButton2Subtitle;

  /// No description provided for @sacredButton3Title.
  ///
  /// In es, this message translates to:
  /// **'CIRCULARES & AVISOS'**
  String get sacredButton3Title;

  /// No description provided for @sacredButton3Subtitle.
  ///
  /// In es, this message translates to:
  /// **'Comunicados oficiales de la Junta'**
  String get sacredButton3Subtitle;

  /// No description provided for @accountBalanceTitle.
  ///
  /// In es, this message translates to:
  /// **'Estado de Cuenta'**
  String get accountBalanceTitle;

  /// No description provided for @currentBalanceUsd.
  ///
  /// In es, this message translates to:
  /// **'Saldo Actual en USD'**
  String get currentBalanceUsd;

  /// No description provided for @currentBalanceLocal.
  ///
  /// In es, this message translates to:
  /// **'Equivalente en Moneda Local'**
  String get currentBalanceLocal;

  /// No description provided for @reportPaymentButton.
  ///
  /// In es, this message translates to:
  /// **'Reportar Pago Realizado'**
  String get reportPaymentButton;

  /// No description provided for @paymentReference.
  ///
  /// In es, this message translates to:
  /// **'Número de Referencia Bancaria'**
  String get paymentReference;

  /// No description provided for @paymentAmount.
  ///
  /// In es, this message translates to:
  /// **'Monto Pagado'**
  String get paymentAmount;

  /// No description provided for @confirmPayment.
  ///
  /// In es, this message translates to:
  /// **'Enviar Comprobante'**
  String get confirmPayment;

  /// No description provided for @reportFailureTitle.
  ///
  /// In es, this message translates to:
  /// **'Reportar Incidencia o Falla'**
  String get reportFailureTitle;

  /// No description provided for @failureTitle.
  ///
  /// In es, this message translates to:
  /// **'Título de la Incidencia'**
  String get failureTitle;

  /// No description provided for @failureDescription.
  ///
  /// In es, this message translates to:
  /// **'Descripción Detallada'**
  String get failureDescription;

  /// No description provided for @voiceRecordButton.
  ///
  /// In es, this message translates to:
  /// **'Dictar Incidencia por Voz'**
  String get voiceRecordButton;

  /// No description provided for @voiceAssistantTitle.
  ///
  /// In es, this message translates to:
  /// **'Asistente de Dictado por Voz'**
  String get voiceAssistantTitle;

  /// No description provided for @voiceAssistantDesc.
  ///
  /// In es, this message translates to:
  /// **'Presione para dictar la avería con transcripción automática'**
  String get voiceAssistantDesc;

  /// No description provided for @voiceRecordingActive.
  ///
  /// In es, this message translates to:
  /// **'Grabando su voz...'**
  String get voiceRecordingActive;

  /// No description provided for @voiceRecordingCompleted.
  ///
  /// In es, this message translates to:
  /// **'Audio grabado con éxito'**
  String get voiceRecordingCompleted;

  /// No description provided for @severityLabel.
  ///
  /// In es, this message translates to:
  /// **'Nivel de Urgencia'**
  String get severityLabel;

  /// No description provided for @severityLow.
  ///
  /// In es, this message translates to:
  /// **'Baja'**
  String get severityLow;

  /// No description provided for @severityMedium.
  ///
  /// In es, this message translates to:
  /// **'Media'**
  String get severityMedium;

  /// No description provided for @severityHigh.
  ///
  /// In es, this message translates to:
  /// **'Alta'**
  String get severityHigh;

  /// No description provided for @severityCritical.
  ///
  /// In es, this message translates to:
  /// **'Crítica / Emergencia'**
  String get severityCritical;

  /// No description provided for @submitFailureReport.
  ///
  /// In es, this message translates to:
  /// **'Enviar Reporte de Incidencia'**
  String get submitFailureReport;

  /// No description provided for @circularsTitle.
  ///
  /// In es, this message translates to:
  /// **'Circulares y Comunicados'**
  String get circularsTitle;

  /// No description provided for @noCirculars.
  ///
  /// In es, this message translates to:
  /// **'No hay circulares recientes'**
  String get noCirculars;

  /// No description provided for @close.
  ///
  /// In es, this message translates to:
  /// **'Cerrar'**
  String get close;

  /// No description provided for @back.
  ///
  /// In es, this message translates to:
  /// **'Volver'**
  String get back;

  /// No description provided for @myProperty.
  ///
  /// In es, this message translates to:
  /// **'MI INMUEBLE'**
  String get myProperty;

  /// No description provided for @statusSolvent.
  ///
  /// In es, this message translates to:
  /// **'SOLVENTE'**
  String get statusSolvent;

  /// No description provided for @statusPending.
  ///
  /// In es, this message translates to:
  /// **'PENDIENTE'**
  String get statusPending;

  /// No description provided for @noticeUrgent.
  ///
  /// In es, this message translates to:
  /// **'PRIORITARIO'**
  String get noticeUrgent;

  /// No description provided for @noticeGeneral.
  ///
  /// In es, this message translates to:
  /// **'INFORMATIVO'**
  String get noticeGeneral;

  /// No description provided for @publishedBy.
  ///
  /// In es, this message translates to:
  /// **'Emitido por:'**
  String get publishedBy;

  /// No description provided for @recentPaymentsTitle.
  ///
  /// In es, this message translates to:
  /// **'PAGOS RECIENTES AUDITADOS'**
  String get recentPaymentsTitle;

  /// No description provided for @noRecentPayments.
  ///
  /// In es, this message translates to:
  /// **'No hay pagos registrados recientemente'**
  String get noRecentPayments;

  /// No description provided for @statusVerified.
  ///
  /// In es, this message translates to:
  /// **'VERIFICADO'**
  String get statusVerified;

  /// No description provided for @statusReview.
  ///
  /// In es, this message translates to:
  /// **'EN REVISIÓN'**
  String get statusReview;

  /// No description provided for @paymentSuccessMessage.
  ///
  /// In es, this message translates to:
  /// **'Comprobante fiduciario registrado exitosamente con sello HMAC.'**
  String get paymentSuccessMessage;

  /// No description provided for @failureSuccessMessage.
  ///
  /// In es, this message translates to:
  /// **'Incidencia reportada exitosamente a la Junta de Condominio.'**
  String get failureSuccessMessage;

  /// No description provided for @paymentMethodLabel.
  ///
  /// In es, this message translates to:
  /// **'Método de Pago'**
  String get paymentMethodLabel;

  /// No description provided for @bcvRateLabel.
  ///
  /// In es, this message translates to:
  /// **'Tasa Oficial BCV:'**
  String get bcvRateLabel;

  /// No description provided for @retryLabel.
  ///
  /// In es, this message translates to:
  /// **'Reintentar'**
  String get retryLabel;

  /// No description provided for @failureTabNew.
  ///
  /// In es, this message translates to:
  /// **'NUEVA INCIDENCIA'**
  String get failureTabNew;

  /// No description provided for @failureTabHistory.
  ///
  /// In es, this message translates to:
  /// **'MIS REPORTES'**
  String get failureTabHistory;

  /// No description provided for @statusOpen.
  ///
  /// In es, this message translates to:
  /// **'EN ATENCIÓN'**
  String get statusOpen;

  /// No description provided for @statusResolved.
  ///
  /// In es, this message translates to:
  /// **'RESUELTA'**
  String get statusResolved;

  /// No description provided for @noFailures.
  ///
  /// In es, this message translates to:
  /// **'No hay incidencias registradas'**
  String get noFailures;

  /// No description provided for @loginTitle.
  ///
  /// In es, this message translates to:
  /// **'Acceso Fiduciario'**
  String get loginTitle;

  /// No description provided for @loginSubtitle.
  ///
  /// In es, this message translates to:
  /// **'Ingrese con su correo registrado de copropietario'**
  String get loginSubtitle;

  /// No description provided for @loginEmailLabel.
  ///
  /// In es, this message translates to:
  /// **'Correo Electrónico'**
  String get loginEmailLabel;

  /// No description provided for @loginEmailHint.
  ///
  /// In es, this message translates to:
  /// **'ejemplo@tepuynexus.com'**
  String get loginEmailHint;

  /// No description provided for @loginPasswordLabel.
  ///
  /// In es, this message translates to:
  /// **'Contraseña'**
  String get loginPasswordLabel;

  /// No description provided for @loginPasswordHint.
  ///
  /// In es, this message translates to:
  /// **'Ingrese su contraseña segura'**
  String get loginPasswordHint;

  /// No description provided for @loginButton.
  ///
  /// In es, this message translates to:
  /// **'INICIAR SESIÓN'**
  String get loginButton;

  /// No description provided for @loginLoggingIn.
  ///
  /// In es, this message translates to:
  /// **'Autenticando credenciales...'**
  String get loginLoggingIn;

  /// No description provided for @loginErrorInvalidCredentials.
  ///
  /// In es, this message translates to:
  /// **'Credenciales inválidas. Verifique correo y contraseña.'**
  String get loginErrorInvalidCredentials;

  /// No description provided for @loginErrorConnection.
  ///
  /// In es, this message translates to:
  /// **'Error de conexión con el servidor. Intente nuevamente.'**
  String get loginErrorConnection;

  /// No description provided for @logoutButton.
  ///
  /// In es, this message translates to:
  /// **'Cerrar Sesión'**
  String get logoutButton;

  /// No description provided for @logoutConfirmTitle.
  ///
  /// In es, this message translates to:
  /// **'¿Cerrar Sesión?'**
  String get logoutConfirmTitle;

  /// No description provided for @logoutConfirmMessage.
  ///
  /// In es, this message translates to:
  /// **'¿Desea cerrar la sesión activa de este dispositivo?'**
  String get logoutConfirmMessage;

  /// No description provided for @logoutConfirmCancel.
  ///
  /// In es, this message translates to:
  /// **'Cancelar'**
  String get logoutConfirmCancel;

  /// No description provided for @logoutConfirmOk.
  ///
  /// In es, this message translates to:
  /// **'Cerrar Sesión'**
  String get logoutConfirmOk;

  /// No description provided for @demoCredentialsTitle.
  ///
  /// In es, this message translates to:
  /// **'ACCESO RÁPIDO DE PRUEBA'**
  String get demoCredentialsTitle;

  /// No description provided for @demoBuilding1.
  ///
  /// In es, this message translates to:
  /// **'Carlos Mendoza (Tepuy Royal)'**
  String get demoBuilding1;

  /// No description provided for @demoBuilding2.
  ///
  /// In es, this message translates to:
  /// **'Dra. Elena Rostova (Mirador del Bosque)'**
  String get demoBuilding2;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'es'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'es':
      return AppLocalizationsEs();
  }

  throw FlutterError(
      'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
      'an issue with the localizations generation tool. Please file an issue '
      'on GitHub with a reproducible sample app and the gen-l10n configuration '
      'that was used.');
}
