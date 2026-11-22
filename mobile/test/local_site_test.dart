// Vérifie que le serveur local sert bien le site embarqué (assets/web/,
// copié par tool/sync_web.sh avant les tests).
import 'dart:convert';
import 'dart:io';

import 'package:awzan/main.dart';
import 'package:flutter_test/flutter_test.dart';

Future<(int, String)> get(Uri uri) async {
  final client = HttpClient();
  final req = await client.getUrl(uri);
  final res = await req.close();
  final body = await res.transform(utf8.decoder).join();
  client.close();
  return (res.statusCode, body);
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  HttpOverrides.global = null; // vraie pile réseau (loopback)

  late LocalSite site;
  setUpAll(() async => site = await LocalSite.start());

  test('index.html', () async {
    final (code, body) = await get(site.home);
    expect(code, 200);
    expect(body, contains('زليج الأوزان'));
  });

  test('données du mur et d’une racine', () async {
    final base = site.home.resolve('/');
    final (c1, wall) = await get(base.resolve('data/wall.json'));
    expect(c1, 200);
    final roots = (jsonDecode(wall) as Map)['roots'] as List;
    expect(roots.length, greaterThan(900));
    final (c2, _) = await get(
      base.resolve('data/roots/${roots.first['id']}.json'),
    );
    expect(c2, 200);
    final (c3, _) = await get(base.resolve('data/quran/2.json'));
    expect(c3, 200);
  });

  test('fichier absent → 404', () async {
    final (code, _) = await get(site.home.resolve('/nope.txt'));
    expect(code, 404);
  });
}
