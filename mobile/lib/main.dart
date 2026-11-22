// زليج الأوزان — application mobile.
//
// Le site (index.html, css, js, data, fonts) est embarqué dans assets/web/ par
// tool/sync_web.sh. Un petit serveur HTTP local (127.0.0.1, port libre) le sert
// à une WebView plein écran : fetch() des fichiers JSON fonctionne comme en
// ligne, et l'app reste 100 % hors ligne, sans compte ni collecte de données.
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';

const bg = Color(0xFF0A1216);

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: bg,
      statusBarIconBrightness: Brightness.light,
      statusBarBrightness: Brightness.dark,
      systemNavigationBarColor: bg,
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );
  final site = await LocalSite.start();
  runApp(AwzanApp(home: site.home));
}

/// Sert les fichiers de assets/web/ sur 127.0.0.1.
class LocalSite {
  LocalSite._(this.server);
  final HttpServer server;

  Uri get home => Uri.parse('http://127.0.0.1:${server.port}/index.html');

  static const _types = {
    'html': 'text/html; charset=utf-8',
    'css': 'text/css; charset=utf-8',
    'js': 'application/javascript; charset=utf-8',
    'json': 'application/json; charset=utf-8',
    'woff2': 'font/woff2',
    'png': 'image/png',
    'svg': 'image/svg+xml',
  };

  static Future<LocalSite> start() async {
    final server = await HttpServer.bind(InternetAddress.loopbackIPv4, 0);
    server.listen(_serve);
    return LocalSite._(server);
  }

  static Future<void> _serve(HttpRequest req) async {
    final res = req.response;
    var path = Uri.decodeComponent(req.uri.path);
    if (path == '/' || path.isEmpty) path = '/index.html';
    if (path.contains('..')) {
      res.statusCode = HttpStatus.forbidden;
      await res.close();
      return;
    }
    try {
      final data = await rootBundle.load('assets/web$path');
      final ext = path.split('.').last.toLowerCase();
      res.headers.set(
        HttpHeaders.contentTypeHeader,
        _types[ext] ?? 'application/octet-stream',
      );
      res.headers.set(HttpHeaders.cacheControlHeader, 'no-cache');
      res.add(data.buffer.asUint8List(data.offsetInBytes, data.lengthInBytes));
    } catch (_) {
      res.statusCode = HttpStatus.notFound;
    }
    await res.close();
  }
}

class AwzanApp extends StatelessWidget {
  const AwzanApp({super.key, required this.home});
  final Uri home;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'زليج الأوزان',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFD9B45A),
          brightness: Brightness.dark,
        ),
        scaffoldBackgroundColor: bg,
      ),
      home: WallScreen(home: home),
    );
  }
}

class WallScreen extends StatefulWidget {
  const WallScreen({super.key, required this.home});
  final Uri home;

  @override
  State<WallScreen> createState() => _WallScreenState();
}

class _WallScreenState extends State<WallScreen> {
  late final WebViewController _web;
  bool _ready = false;

  @override
  void initState() {
    super.initState();
    _web = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(bg)
      ..enableZoom(false)
      // Liens externes (sources : corpus.quran.com, tanzil.net…) → navigateur.
      ..addJavaScriptChannel(
        'AwzanApp',
        onMessageReceived: (m) {
          _openExternal(Uri.parse(m.message));
        },
      )
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (_) => setState(() => _ready = true),
          onNavigationRequest: (req) {
            final uri = Uri.parse(req.url);
            if (uri.host == '127.0.0.1') return NavigationDecision.navigate;
            _openExternal(uri);
            return NavigationDecision.prevent;
          },
        ),
      )
      ..loadRequest(widget.home);
  }

  Future<void> _openExternal(Uri uri) async {
    if (uri.scheme == 'https' || uri.scheme == 'http') {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  /// Bouton Retour (Android) : ferme d'abord le panneau ouvert dans la page.
  Future<void> _back() async {
    final r = await _web.runJavaScriptReturningResult(
      'window.awzanBack ? awzanBack() : false',
    );
    if (r != true && r.toString() != 'true' && r.toString() != '1') {
      await SystemNavigator.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _back();
      },
      child: Scaffold(
        backgroundColor: bg,
        body: SafeArea(
          child: Stack(
            children: [
              WebViewWidget(controller: _web),
              if (!_ready)
                const ColoredBox(
                  color: bg,
                  child: Center(
                    child: Text(
                      'زليج الأوزان',
                      textDirection: TextDirection.rtl,
                      style: TextStyle(
                        color: Color(0xFFD9B45A),
                        fontSize: 32,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
