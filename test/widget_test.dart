import 'package:flutter_test/flutter_test.dart';
import 'package:coastal_trails/main.dart';

void main() {
  testWidgets('Coastal Trails app smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const CoastalTrailsApp());
    expect(find.text('COASTAL TRAILS'), findsWidgets);
  });
}
