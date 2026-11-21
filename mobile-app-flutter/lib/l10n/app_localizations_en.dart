// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'Tepuy Nexus Resident';

  @override
  String get seniorModeLabel => 'Senior Mode (Large Text)';

  @override
  String get seniorModeSubtitle => 'Enlarged fonts and extreme contrast';

  @override
  String get welcomeGreeting => 'Welcome Home';

  @override
  String get buildingLabel => 'Condominium';

  @override
  String get unitLabel => 'Unit';

  @override
  String get aliquotLabel => 'Aliquot';

  @override
  String get sacredButton1Title => 'ACCOUNT STATEMENT';

  @override
  String get sacredButton1Subtitle =>
      'View fiduciary balance, receipts and payments';

  @override
  String get sacredButton2Title => 'REPORT INCIDENT';

  @override
  String get sacredButton2Subtitle => 'Voice assistant and failure reporting';

  @override
  String get sacredButton3Title => 'NOTICES & CIRCULARS';

  @override
  String get sacredButton3Subtitle => 'Official Board circulars and notices';

  @override
  String get accountBalanceTitle => 'Account Statement';

  @override
  String get currentBalanceUsd => 'Current Balance in USD';

  @override
  String get currentBalanceLocal => 'Local Currency Equivalent';

  @override
  String get reportPaymentButton => 'Report a Payment';

  @override
  String get paymentReference => 'Bank Reference Number';

  @override
  String get paymentAmount => 'Amount Paid';

  @override
  String get confirmPayment => 'Submit Receipt';

  @override
  String get reportFailureTitle => 'Report Incident or Outage';

  @override
  String get failureTitle => 'Incident Title';

  @override
  String get failureDescription => 'Detailed Description';

  @override
  String get voiceRecordButton => 'Dictate Incident with Voice';

  @override
  String get voiceAssistantTitle => 'Voice Dictation Assistant';

  @override
  String get voiceAssistantDesc =>
      'Press to dictate the issue with automatic speech transcription';

  @override
  String get voiceRecordingActive => 'Recording your voice...';

  @override
  String get voiceRecordingCompleted => 'Audio recorded successfully';

  @override
  String get severityLabel => 'Urgency Level';

  @override
  String get severityLow => 'Low';

  @override
  String get severityMedium => 'Medium';

  @override
  String get severityHigh => 'High';

  @override
  String get severityCritical => 'Critical / Emergency';

  @override
  String get submitFailureReport => 'Submit Incident Report';

  @override
  String get circularsTitle => 'Notices & Announcements';

  @override
  String get noCirculars => 'No recent notices';

  @override
  String get close => 'Close';

  @override
  String get back => 'Back';

  @override
  String get myProperty => 'MY PROPERTY';

  @override
  String get statusSolvent => 'SOLVENT';

  @override
  String get statusPending => 'PENDING';

  @override
  String get noticeUrgent => 'PRIORITY';

  @override
  String get noticeGeneral => 'INFORMATIONAL';

  @override
  String get publishedBy => 'Issued by:';

  @override
  String get recentPaymentsTitle => 'AUDITED RECENT PAYMENTS';

  @override
  String get noRecentPayments => 'No recent payments recorded';

  @override
  String get statusVerified => 'VERIFIED';

  @override
  String get statusReview => 'PENDING REVIEW';

  @override
  String get paymentSuccessMessage =>
      'Fiduciary receipt successfully registered with HMAC seal.';

  @override
  String get failureSuccessMessage =>
      'Incident successfully reported to the Condominium Board.';

  @override
  String get paymentMethodLabel => 'Payment Method';

  @override
  String get bcvRateLabel => 'Official BCV Rate:';

  @override
  String get retryLabel => 'Retry';

  @override
  String get failureTabNew => 'NEW INCIDENT';

  @override
  String get failureTabHistory => 'MY REPORTS';

  @override
  String get statusOpen => 'IN PROGRESS';

  @override
  String get statusResolved => 'RESOLVED';

  @override
  String get noFailures => 'No reported incidents';

  @override
  String get loginTitle => 'Fiduciary Access';

  @override
  String get loginSubtitle => 'Sign in with your registered resident email';

  @override
  String get loginEmailLabel => 'Email Address';

  @override
  String get loginEmailHint => 'example@tepuynexus.com';

  @override
  String get loginPasswordLabel => 'Password';

  @override
  String get loginPasswordHint => 'Enter your secure password';

  @override
  String get loginButton => 'SIGN IN';

  @override
  String get loginLoggingIn => 'Authenticating credentials...';

  @override
  String get loginErrorInvalidCredentials =>
      'Invalid credentials. Please verify email and password.';

  @override
  String get loginErrorConnection =>
      'Connection error with server. Please try again.';

  @override
  String get logoutButton => 'Sign Out';

  @override
  String get logoutConfirmTitle => 'Sign Out?';

  @override
  String get logoutConfirmMessage => 'Do you want to log out from this device?';

  @override
  String get logoutConfirmCancel => 'Cancel';

  @override
  String get logoutConfirmOk => 'Sign Out';

  @override
  String get demoCredentialsTitle => 'QUICK PILOT ACCESS';

  @override
  String get demoBuilding1 => 'Carlos Mendoza (Tepuy Royal)';

  @override
  String get demoBuilding2 => 'Dr. Elena Rostova (Mirador del Bosque)';
}
