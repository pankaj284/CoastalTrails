import '../models/homestay.dart';

class MockData {
  static final DateTime now = DateTime.now();

  static final List<Homestay> homestays = [
    Homestay(
      id: 'gokarna-1',
      title: 'Kudle Clifftop Wooden Cottage',
      subtitle: 'Panoramic Arabian sea view with direct path to Kudle sand',
      location: BeachLocation.kudle,
      pricePerNight: 2200,
      rating: 4.9,
      reviewsCount: 142,
      hostName: 'Manjunath Hegde',
      hostWhatsApp: '+91 98451 23091',
      isHostVerified: true,
      walkingMinutesToBeach: 3,
      totalRooms: 4,
      // Fully booked 3 days from now
      fullyBookedDates: [
        now.add(const Duration(days: 3)),
        now.add(const Duration(days: 4)),
      ],
      imageUrls: const [
        'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
      ],
      verifiedBadges: const ['Beachfront', 'Sunset View', 'Fiber WiFi', 'Hot Water'],
      amenities: const [
        'High-Speed WiFi (60 Mbps)',
        'Attached Private Bathroom',
        'Sunset Balcony & Hammock',
        'Mosquito Netting',
        'Home-cooked South Indian Breakfast',
        'Scooter Parking Available',
      ],
      description:
          'Perched on the northern ridge of Kudle Beach, this rustic teak-wood cottage offers unobstructed sunsets over the Arabian Sea. Run by a local family with 15 years of coastal hospitality. Fresh seafood and local vegetarian thalis available on request.',
    ),
    Homestay(
      id: 'gokarna-2',
      title: 'Om Beach Nirvana Palm Shack',
      subtitle: 'Steps away from the iconic Om rock formations & surf',
      location: BeachLocation.om,
      pricePerNight: 1600,
      rating: 4.8,
      reviewsCount: 98,
      hostName: 'Ganesh Naik',
      hostWhatsApp: '+91 94482 11982',
      isHostVerified: true,
      walkingMinutesToBeach: 1,
      totalRooms: 3,
      fullyBookedDates: const [], // Always available
      imageUrls: const [
        'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      ],
      verifiedBadges: const ['Beachfront', 'Cafe Attached', 'Surfboard Rental'],
      amenities: const [
        'Direct Beach Access (30 seconds)',
        'Attached Open-Sky Bathroom',
        'Ceiling Fan & Power Backup',
        'Cafe Serving Nutella Pancakes & Chai',
        'Yoga Mats Available',
      ],
      description:
          'Step directly out of your room into the golden sands of Om Beach. Surrounded by swaying coconut palms, this eco-shack offers the authentic Bohemian Gokarna vibe. Fall asleep to the crashing waves.',
    ),
    Homestay(
      id: 'gokarna-3',
      title: 'Half Moon Secluded Rock Cottage',
      subtitle: 'Trek-in ocean retreat away from all crowds and roads',
      location: BeachLocation.halfMoon,
      pricePerNight: 1900,
      rating: 4.95,
      reviewsCount: 64,
      hostName: 'Devdas Gowda',
      hostWhatsApp: '+91 97410 88219',
      isHostVerified: true,
      walkingMinutesToBeach: 2,
      totalRooms: 2,
      // Booked tomorrow & day after
      fullyBookedDates: [
        now.add(const Duration(days: 1)),
        now.add(const Duration(days: 2)),
      ],
      imageUrls: const [
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1200&q=80',
      ],
      verifiedBadges: const ['Off-Grid Eco', 'Starlit Sky', 'Boat Drop Included'],
      amenities: const [
        'Solar Powered Lighting',
        'Fresh Spring Well Water',
        'Organic Coconut Grove Garden',
        'Trek Guide & Boat Pickup',
        'Complimentary Beach Bonfire',
      ],
      description:
          'Accessible only via a 20-minute scenic cliff trek from Om Beach or a 5-minute fishing boat ride. Half Moon is Gokarna’s best-kept secret with zero car noise, pristine waters, and bioluminescent night waves during high tide.',
    ),
    Homestay(
      id: 'gokarna-4',
      title: 'Main Beach Coconut Garden Heritage',
      subtitle: 'Old-style Karavali tiled home near temple and town market',
      location: BeachLocation.mainBeach,
      pricePerNight: 1400,
      rating: 4.7,
      reviewsCount: 112,
      hostName: 'Subramanya Bhat',
      hostWhatsApp: '+91 99805 77123',
      isHostVerified: true,
      walkingMinutesToBeach: 5,
      totalRooms: 3,
      fullyBookedDates: const [],
      imageUrls: const [
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      ],
      verifiedBadges: const ['Family Friendly', 'Fiber WiFi', 'Kitchen Access'],
      amenities: const [
        'High-Speed Fiber Internet (100 Mbps)',
        'Traditional Red Oxide Flooring',
        'Equipped Kitchenette',
        'Air Conditioning in Master Room',
        'Free Parking on Premises',
      ],
      description:
          'A quiet 80-year-old coastal estate tucked in a coconut orchard between Gokarna Main Beach and the ancient Mahabaleshwar Temple. Ideal for remote workers and cultural travelers seeking calm spaces with modern connectivity.',
    ),
    Homestay(
      id: 'gokarna-5',
      title: 'Paradise Beach Eco Cliff Pod',
      subtitle: 'Camp under the stars on the edge of the Arabian sea',
      location: BeachLocation.paradise,
      pricePerNight: 1200,
      rating: 4.85,
      reviewsCount: 88,
      hostName: 'Venkatesh Patgar',
      hostWhatsApp: '+91 91480 34567',
      isHostVerified: true,
      walkingMinutesToBeach: 1,
      totalRooms: 5,
      fullyBookedDates: const [],
      imageUrls: const [
        'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80',
      ],
      verifiedBadges: const ['Boutique Camp', 'Ocean View', 'Hammock Zone'],
      amenities: const [
        'Elevated Weatherproof Pod Bedding',
        'Communal Beach Cafe & Chill Lounge',
        'Shared Clean Washrooms',
        'Charging Lockers Available',
        'Daily Sunset Acoustic Jam',
      ],
      description:
          'Situated on the pristine sands of Paradise Beach (Full Moon Beach), this eco pod provides a true back-to-nature Gokarna experience with warm campfires, acoustic evenings, and crystal clear sea breezes.',
    ),
  ];
}
