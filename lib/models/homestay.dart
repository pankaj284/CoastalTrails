enum BeachLocation {
  kudle('Kudle Beach'),
  om('Om Beach'),
  mainBeach('Main Beach'),
  halfMoon('Half Moon Beach'),
  paradise('Paradise Beach'),
  town('Gokarna Town');

  final String displayName;
  const BeachLocation(this.displayName);
}

class Homestay {
  final String id;
  final String title;
  final String subtitle;
  final BeachLocation location;
  final double pricePerNight;
  final double rating;
  final int reviewsCount;
  final String hostName;
  final String hostWhatsApp;
  final bool isHostVerified;
  final List<String> imageUrls;
  final List<String> verifiedBadges;
  final List<String> amenities;
  final String description;
  final int walkingMinutesToBeach;
  final int totalRooms;
  final List<DateTime> fullyBookedDates;

  const Homestay({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.location,
    required this.pricePerNight,
    required this.rating,
    required this.reviewsCount,
    required this.hostName,
    required this.hostWhatsApp,
    required this.isHostVerified,
    required this.imageUrls,
    required this.verifiedBadges,
    required this.amenities,
    required this.description,
    required this.walkingMinutesToBeach,
    this.totalRooms = 3,
    this.fullyBookedDates = const [],
  });

  double get advanceDeposit => pricePerNight * 0.20; // 20% online advance
  double get balanceAtCheckIn => pricePerNight * 0.80; // 80% at property

  bool isAvailableForRange(DateTime checkIn, DateTime checkOut) {
    for (DateTime date = checkIn;
        date.isBefore(checkOut);
        date = date.add(const Duration(days: 1))) {
      final isBooked = fullyBookedDates.any((d) =>
          d.year == date.year && d.month == date.month && d.day == date.day);
      if (isBooked) return false;
    }
    return true;
  }

  int availableRoomsOn(DateTime checkIn, DateTime checkOut) {
    if (!isAvailableForRange(checkIn, checkOut)) return 0;
    // Return remaining rooms (between 1 and totalRooms)
    return totalRooms > 1 ? (totalRooms - 1) : 1;
  }

  factory Homestay.fromJson(Map<String, dynamic> json) {
    BeachLocation loc = BeachLocation.kudle;
    final locStr = json['location'] as String? ?? 'kudle';
    for (final l in BeachLocation.values) {
      if (l.name == locStr || l.displayName.toLowerCase().contains(locStr.toLowerCase())) {
        loc = l;
        break;
      }
    }

    final blocked = (json['blockedDates'] as List<dynamic>?)
            ?.map((d) => DateTime.tryParse(d.toString()))
            .whereType<DateTime>()
            .toList() ??
        [];

    return Homestay(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      subtitle: json['subtitle'] as String? ?? '',
      location: loc,
      pricePerNight: (json['price_per_night'] as num?)?.toDouble() ?? 1500.0,
      rating: (json['rating'] as num?)?.toDouble() ?? 5.0,
      reviewsCount: (json['reviews_count'] as num?)?.toInt() ?? 0,
      hostName: json['host_name'] as String? ?? '',
      hostWhatsApp: json['host_whatsapp'] as String? ?? '',
      isHostVerified: json['is_host_verified'] == 1 || json['is_host_verified'] == true,
      imageUrls: (json['imageUrls'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      verifiedBadges: (json['verifiedBadges'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      amenities: (json['amenities'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      description: json['description'] as String? ?? '',
      walkingMinutesToBeach: (json['walking_minutes_to_beach'] as num?)?.toInt() ?? 3,
      totalRooms: (json['total_rooms'] as num?)?.toInt() ?? 3,
      fullyBookedDates: blocked,
    );
  }
}

