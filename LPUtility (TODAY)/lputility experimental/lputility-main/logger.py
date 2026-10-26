# LOGS - JOSWEN PINCA

import os
from datetime import datetime

class Logger:
    def __init__(self, filename="lpu_toolkit.log"):
        self.file = filename
        
        # create log file if not exists
        if not os.path.exists(self.file):
            with open(self.file, 'w') as f:
                f.write("=== LPUtility Logs ===\n\n")
    
    def log(self, message):
        # LOG ENTRY FOR INSTALLATIONS, MESSAGE, AND OTHER SHITS.


        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        entry = f"[{timestamp}] {message}\n"
        
        try:
            with open(self.file, 'a') as f:
                f.write(entry)
        except:
            print(entry)  # fallback to console

