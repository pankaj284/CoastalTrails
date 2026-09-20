import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../models/homestay.dart';
import 'mock_data.dart';

class ApiService {
  // Configured default base URL:
  // - Android Emulator: 'http://10.0.2.2:5000/api'
  // - Local Physical Device / Web: 'http://192.168.1.22:5000/api' or 'http://localhost:5000/api'
  static String baseUrl = kIsWeb
      ? 'http://localhost:5000/api'
      : defaultTargetPlatform == TargetPlatform.android
          ? 'http://10.0.2.2:5000/api'
          : 'http://localhost:5000/api';

  static final http.Client _client = http.Client();

  /// Fetches homestays from the shared SQLite database.
  /// Seamlessly falls back to local MockData if offline.
  static Future<List<Homestay>> fetchHomestays({String? beach, String? search}) async {
    try {
      final queryParams = <String, String>{};
      if (beach != null && beach != 'all') queryParams['location'] = beach;
      if (search != null && search.isNotEmpty) queryParams['search'] = search;

      final uri = Uri.parse('$baseUrl/homestays').replace(queryParameters: queryParams.isEmpty ? null : queryParams);
      final response = await _client.get(uri).timeout(const Duration(seconds: 4));

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((item) => Homestay.fromJson(item as Map<String, dynamic>)).toList();
      }
    } catch (e) {
      debugPrint('ApiService.fetchHomestays: offline or network error ($e). Using cached/mock stays.');
    }

    // Fallback to local stays
    if (beach != null && beach != 'all') {
      return MockData.homestays.where((h) => h.location.name == beach).toList();
    }
    return MockData.homestays;
  }

  /// Creates a booking in the shared database
  static Future<Map<String, dynamic>?> createBooking({
    required String homestayId,
    required String userName,
    required String userPhone,
    required DateTime checkIn,
    required DateTime checkOut,
    int guestsCount = 2,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl/bookings');
      final body = jsonEncode({
        'homestay_id': homestayId,
        'user_name': userName,
        'user_phone': userPhone,
        'check_in': checkIn.toIso8601String().split('T')[0],
        'check_out': checkOut.toIso8601String().split('T')[0],
        'guests_count': guestsCount,
      });

      final response = await _client.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: body,
      ).timeout(const Duration(seconds: 5));

      if (response.statusCode == 201 || response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
    } catch (e) {
      debugPrint('ApiService.createBooking: $e');
    }
    return null;
  }
}
