import 'package:flutter/foundation.dart';
import '../models/booking.dart';

class AuthState extends ChangeNotifier {
  static final AuthState _instance = AuthState._internal();
  factory AuthState() => _instance;
  AuthState._internal();

  bool _isLoggedIn = false;
  String? _userName;
  String? _phoneNumber;
  String? _email;
  bool _whatsappAlertsEnabled = true;

  // Pre-seeded registered users for prototype verification
  final Map<String, String> _registeredUsers = {
    '9876543210': 'Punit Verma',
    '9448100012': 'Ananya Rao',
    '9845123091': 'Manjunath Hegde',
  };

  final List<Booking> _bookings = [];

  bool get isLoggedIn => _isLoggedIn;
  String? get userName => _userName;
  String? get phoneNumber => _phoneNumber;
  String? get email => _email;
  bool get whatsappAlertsEnabled => _whatsappAlertsEnabled;
  List<Booking> get bookings => List.unmodifiable(_bookings);

  String _cleanPhone(String raw) {
    return raw.replaceAll(RegExp(r'\D'), '');
  }

  bool isExistingUser(String phone) {
    final clean = _cleanPhone(phone);
    final key = clean.length >= 10 ? clean.substring(clean.length - 10) : clean;
    return _registeredUsers.containsKey(key);
  }

  String? getUserNameByPhone(String phone) {
    final clean = _cleanPhone(phone);
    final key = clean.length >= 10 ? clean.substring(clean.length - 10) : clean;
    return _registeredUsers[key];
  }

  /// Unified Login / Auto-Registration:
  /// If phone exists -> signs in existing user.
  /// If phone is new -> registers new user automatically and signs them in!
  void login({
    required String phone,
    String? name,
    String? email,
  }) {
    final clean = _cleanPhone(phone);
    final key = clean.length >= 10 ? clean.substring(clean.length - 10) : clean;

    if (_registeredUsers.containsKey(key)) {
      // Existing user
      _userName = (name != null && name.trim().isNotEmpty)
          ? name.trim()
          : _registeredUsers[key]!;
    } else {
      // Brand-new user: auto-register!
      final assignedName = (name != null && name.trim().isNotEmpty)
          ? name.trim()
          : 'Gokarna Traveler';
      _registeredUsers[key] = assignedName;
      _userName = assignedName;
    }

    _isLoggedIn = true;
    _phoneNumber = '+91 $key';
    _email = email ?? '$key@coastaltrails.in';
    notifyListeners();
  }

  void updateProfile({String? name, String? email, bool? whatsappAlerts}) {
    if (name != null && name.trim().isNotEmpty) {
      _userName = name.trim();
      if (_phoneNumber != null) {
        final key = _cleanPhone(_phoneNumber!);
        final k10 = key.length >= 10 ? key.substring(key.length - 10) : key;
        _registeredUsers[k10] = _userName!;
      }
    }
    if (email != null) _email = email;
    if (whatsappAlerts != null) _whatsappAlertsEnabled = whatsappAlerts;
    notifyListeners();
  }

  void logout() {
    _isLoggedIn = false;
    _phoneNumber = null;
    _userName = null;
    _email = null;
    notifyListeners();
  }

  void addBooking(Booking booking) {
    _bookings.insert(0, booking);
    notifyListeners();
  }

  void updateBookingStatus(String bookingId, BookingStatus newStatus) {
    final index = _bookings.indexWhere((b) => b.id == bookingId);
    if (index != -1) {
      _bookings[index].status = newStatus;
      notifyListeners();
    }
  }
}
