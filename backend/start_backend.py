#!/usr/bin/env python3
"""
Startup script for the ATC System Backend
"""

import sys
import os
import threading
import time

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def main():
    try:
        # Import the app
        import app
        
        print("Starting ATC System Backend...")
        print("Backend will be available at: http://localhost:5005")
        print("Press Ctrl+C to stop the server")
        
        # Run the app
        app.socketio.run(app.app, debug=False, host='0.0.0.0', port=5005, use_reloader=False)
        
    except KeyboardInterrupt:
        print("\nShutting down backend...")
        sys.exit(0)
    except Exception as e:
        print(f"Error starting backend: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
