import 'homestay.dart';

enum BookingStatus {
  awaitingHost('Pinging Host on WhatsApp'),
  confirmed('Confirmed & Locked'),
  declined('Declined by Host'),
  timedOut('Expired (Funds Unfrozen)');

  final String label;
  const BookingStatus(this.label);
}

class Booking {
  final String id;
  final String referenceCode;
  final Homestay homestay;
  final DateTime checkIn;
  final DateTime checkOut;
  final int guestsCount;
  final double totalAmount;
  final double advancePaid;
  final double balancePayableAtProperty;
  BookingStatus status;
  final DateTime createdAt;
  final DateTime holdExpiresAt;

  Booking({
    required this.id,
    required this.referenceCode,
    required this.homestay,
    required this.checkIn,
    required this.checkOut,
    required this.guestsCount,
    required this.totalAmount,
    required this.advancePaid,
    required this.balancePayableAtProperty,
    this.status = BookingStatus.awaitingHost,
    required this.createdAt,
    required this.holdExpiresAt,
  });

  int get nights => checkOut.difference(checkIn).inDays > 0
      ? checkOut.difference(checkIn).inDays
      : 1;
}
