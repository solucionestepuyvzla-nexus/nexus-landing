class CircularNotice {
  final String id;
  final String title;
  final String content;
  final String publishedAt;
  final String authorName;
  final bool isUrgent;

  const CircularNotice({
    required this.id,
    required this.title,
    required this.content,
    required this.publishedAt,
    required this.authorName,
    required this.isUrgent,
  });

  factory CircularNotice.fromJson(Map<String, dynamic> json) {
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

    return CircularNotice(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      content: json['content']?.toString() ?? '',
      publishedAt: dateFormatted,
      authorName: 'Junta de Condominio',
      isUrgent: json['is_urgent'] == true,
    );
  }

  static List<CircularNotice> getMocks() {
    return const [
      CircularNotice(
        id: 'c-1',
        title: 'Mantenimiento Preventivo Sistema Hidroneumático y Bomba #2',
        content:
            'Estimados copropietarios: Se informa que el día jueves de 8:00 AM a 1:00 PM se realizará mantenimiento integral al banco de bombas. El servicio de agua operará con presión reducida durante las maniobras técnicas de reemplazo de sellos.',
        publishedAt: '12/10/2026',
        authorName: 'Junta de Condominio',
        isUrgent: true,
      ),
      CircularNotice(
        id: 'c-2',
        title: 'Asamblea General Ordinaria - Presentación Presupuesto 2026-2027',
        content:
            'Se convoca formalmente a todos los copropietarios a la Asamblea General el próximo sábado a las 10:00 AM en el salón de fiestas. Se presentará el balance auditado del ejercicio anterior.',
        publishedAt: '10/10/2026',
        authorName: 'Administración Nexus',
        isUrgent: false,
      ),
    ];
  }
}
