# BROWSER - JASKABADDIE PIMINTALLERS

import webbrowser

class BrowserEmbedder:
    def __init__(self, logger):
        self.logger = logger
    
    def open_portal(self, url):
        url = url.strip()  
        self.logger.log(f"Opening portal: {url}")

        
        if not url.lower().startswith(('http://', 'https://')):
            url = 'https://' + url

        try:
            webbrowser.open(url)
            return True
        except Exception:
            return False
