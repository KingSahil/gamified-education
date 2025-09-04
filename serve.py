#!/usr/bin/env python3
"""
Simple HTTP Server for EduQuest Development
Serves the application on localhost:8000 to fix Firebase connection issues.
"""

import http.server
import socketserver
import webbrowser
import os
import sys
from pathlib import Path

# Configuration
PORT = 8000
HOST = 'localhost'

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom handler with CORS headers for Firebase compatibility"""
    
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def log_message(self, format, *args):
        """Override to provide cleaner logging"""
        print(f"[{self.address_string()}] {format % args}")

def main():
    """Start the development server"""
    
    # Change to the directory containing this script
    os.chdir(Path(__file__).parent)
    
    # Check if index.html exists
    if not os.path.exists('index.html'):
        print("❌ Error: index.html not found in current directory")
        print(f"📁 Current directory: {os.getcwd()}")
        sys.exit(1)
    
    # Create server
    try:
        with socketserver.TCPServer((HOST, PORT), CustomHTTPRequestHandler) as httpd:
            url = f"http://{HOST}:{PORT}"
            
            print("🚀 Starting EduQuest Development Server...")
            print(f"📡 Server running at: {url}")
            print(f"📁 Serving from: {os.getcwd()}")
            print("\n🔧 Firebase Setup Instructions:")
            print("1. Go to Firebase Console -> Authentication -> Settings")
            print("2. Add 'localhost' to Authorized Domains")
            print("3. Add 'localhost:8000' to Authorized Domains")
            print("\n✨ Features enabled with HTTP server:")
            print("✅ Firebase Authentication")
            print("✅ Google Sign-in")
            print("✅ Firestore Database")
            print("✅ Real-time sync")
            
            print(f"\n🌐 Opening browser at {url}")
            try:
                webbrowser.open(url)
            except Exception as e:
                print(f"⚠️ Could not open browser automatically: {e}")
                print(f"📖 Please manually open: {url}")
            
            print("\n💡 Press Ctrl+C to stop the server")
            print("=" * 50)
            
            # Start serving
            httpd.serve_forever()
            
    except OSError as e:
        if e.errno == 98:  # Address already in use
            print(f"❌ Error: Port {PORT} is already in use")
            print("🔧 Try using a different port or stop the existing server")
        else:
            print(f"❌ Server error: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n🛑 Server stopped by user")
        print("👋 Thanks for using EduQuest!")

if __name__ == "__main__":
    main()