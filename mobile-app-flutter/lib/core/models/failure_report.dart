class FailureReportItem {
  final String id;
  final String title;
  final String description;
  final String severity; // LOW, MEDIUM, HIGH, CRITICAL
  final String status; // OPEN, IN_PROGRESS, RESOLVED
  final String? audioUrl;
  final String createdAt;

  const FailureReportItem({
    required this.id,
    required this.title,
    required this.description,
    required this.severity,
    required this.status,
    this.audioUrl,
    required this.createdAt,
  });

  factory FailureReportItem.fromJson(Map<String, dynamic> json) {
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

    final isResolved = json['is_resolved'] == true;

    return FailureReportItem(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      severity: json['severity']?.toString() ?? 'MEDIUM',
      status: isResolved ? 'RESOLVED' : 'OPEN',
      audioUrl: json['audio_dictation_url']?.toString(),
      createdAt: dateFormatted,
    );
  }
}
