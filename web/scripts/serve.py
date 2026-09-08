#!/usr/bin/env python3
"""Статика без кэша: иначе правки в css не доезжают до браузера и полдня
уходит на отладку того, чего в файлах уже нет."""
import http.server, socketserver, sys, functools, os

class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        super().end_headers()
    def log_message(self, *a): pass

port = int(sys.argv[1]) if len(sys.argv) > 1 else 4321
# Корень — папка web рядом со скриптом, а не текущий каталог: иначе сервер
# отдаёт список файлов репозитория вместо сайта.
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(('127.0.0.1', port), functools.partial(H, directory=root)) as s:
    print(f'http://localhost:{port}')
    s.serve_forever()
