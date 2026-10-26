import webbrowser

class SoftwareInstaller:
    def __init__(self, logger):
        self.logger = logger
        
        # download urls - update if needed 
        # we'll keep it browser muna so we can complete it. soon na yung winget (auto install)
        self.urls = {
            #IDE
            'notepad': 'https://github.com/notepad-plus-plus/notepad-plus-plus/releases/download/v8.8.8/npp.8.8.8.Installer.x64.exe',
            'pycharm': 'https://download.jetbrains.com/python/pycharm-community-2024.2.3.exe',
            'intellij': 'https://download.jetbrains.com/python/pycharm-community-2024.2.3.exe',
            'eclipse': 'https://www.eclipse.org/downloads/download.php?file=/technology/epp/downloads/release/2024-06/R/eclipse-jee-2024-06-R-win32-x86_64.zip&r=1',
            'vscode': 'https://code.visualstudio.com/sha/download?build=stable&os=win32-x64-user',
            'androidstudio': 'https://redirector.gvt1.com/edgedl/android/studio/install/2025.2.2.7/android-studio-2025.2.2.7-windows.exe',
            'sublimetext': 'https://www.sublimetext.com/download_thanks?target=win-x64',
            'visualstudio': 'https://visualstudio.microsoft.com/thank-you-downloading-visual-studio/?sku=Community&channel=Stable&version=VS18&source=VSLandingPage&cid=2500&passive=false',

            #LANGUAGE & RUNTIMES
            'python': 'https://www.python.org/ftp/python/3.12.4/python-3.12.4-amd64.exe',
            'java': 'https://download.oracle.com/java/25/latest/jdk-25_windows-x64_bin.exe',
            'nodejs': 'https://nodejs.org/dist/v24.11.1/node-v24.11.1-x64.msi',
            'visualc': 'https://aka.ms/vs/17/release/vc_redist.x64.exe',                  
            'git': 'https://github.com/git-for-windows/git/releases/download/v2.52.0.windows.1/Git-2.52.0-64-bit.exe',
            'php': 'https://downloads.php.net/~windows/releases/archives/php-8.5.0-src.zip',

            #DATABASE
            'mysqlworkbench': 'https://dev.mysql.com/get/Downloads/MySQLGUITools/mysql-workbench-community-8.0.38-winx64.msi',
            'postgresql': 'https://get.enterprisedb.com/postgresql/postgresql-15.9-1-windows-x64.exe',
            'mongodbcompass': 'https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-8.2.2-signed.msi',
            'sqlitebrowser': 'https://github.com/sqlitebrowser/sqlitebrowser/releases/download/v3.13.1/DB.Browser.for.SQLite-v3.13.1-win64.msi',
            'dbeaver': 'https://dbeaver.io/files/dbeaver-ce-latest-x86_64-setup.exe',

            #ACADEMICS
            'notion': 'https://www.notion.so/desktop/windows/download',
            'grammarly': 'https://download-windows.grammarly.com/w/GrammarlyInstaller.exe',
            'cobalt': 'https://www.cobaltlabs.io/downloads/CobaltSetup.exe',
            'canva': 'https://www.canva.com/download/windows/canva-desktop/',

            #PRODUCTIVITY
            'm365': 'https://go.microsoft.com/fwlink/?linkid=2264705&clcid=0x409&culture=en-us&country=us',
            'tableaupublic': 'https://www.tableau.com/en-us/downloads/public/pc64',

            #CREATIVITY
            'gimp': 'https://download.gimp.org/gimp/v3.0/windows/gimp-3.0.6-setup-1.exe',
            'blender': 'https://www.blender.org/download/release/Blender5.0/blender-5.0.0-windows-x64.msi/',
            'audacity': 'https://muse-cdn.com/Audacity_Installer_via_MuseHub.exe',
            'krita': 'https://download.kde.org/stable/krita/5.2.13/krita-x64-5.2.13-setup.exe',
            'capcut': 'https://www.capcut.com/activity/download_pc',

            #WEB BROWSERS
            'mozillafirefox': 'https://download.mozilla.org/?product=firefox-stub&os=win&lang=en-US&attribution_code=c291cmNlPXd3dy5nb29nbGUuY29tJm1lZGl1bT1yZWZlcnJhbCZjYW1wYWlnbj1TRVRfREVGQVVMVF9CUk9XU0VSJmNvbnRlbnQ9KG5vdCBzZXQpJmV4cGVyaW1lbnQ9KG5vdCBzZXQpJnZhcmlhdGlvbj0obm90IHNldCkmdWE9Y2hyb21lJmNsaWVudF9pZF9nYTQ9Mzg2MzI0MjE5LjE3NjUxODk2NDkmc2Vzc2lvbl9pZD00NDk1MDQxMzQxJmRsc291cmNlPWZ4ZG90Y29t&attribution_sig=76dcba95b770881745bbba89d77b011307f2687a99f970ec8216f135bd39bdc2',
            'opera': 'https://net.geo.opera.com/opera/stable/windows?utm_tryagain=yes&utm_source=PWNgames&utm_medium=pa&utm_campaign=PWN_PH_HVR_9396_WEB_3580&edition=std-2&&utm_id=0a78d242add74539bb3d50de93465cb2&http_referrer=https%3A%2F%2Fwww.opera.com%2Fget%2Fopera-gx%3Futm_source%3DPWNgames%26utm_medium%3Dpa%26utm_campaign%3DPWN_PH_HVR_9396_WEB_3580%26utm_id%3D0a78d242add74539bb3d50de93465cb2%26edition%3Dstd-2&utm_site=opera_com&&utm_lastpage=opera.com/',
            'operagx': 'https://net.geo.opera.com/opera_gx/stable/windows?utm_tryagain=yes&utm_source=PWNgames&utm_medium=pa&utm_campaign=PWN_PH_HVR_9396_WEB_3580&edition=std-2&&utm_id=0a78d242add74539bb3d50de93465cb2&http_referrer=https%3A%2F%2Fwww.opera.com%2Fget%2Fopera-gx%3Futm_source%3DPWNgames%26utm_medium%3Dpa%26utm_campaign%3DPWN_PH_HVR_9396_WEB_3580%26utm_id%3D0a78d242add74539bb3d50de93465cb2%26edition%3Dstd-2&utm_site=opera_com&&utm_lastpage=opera.com/gx',
            'brave': 'https://laptop-updates.brave.com/download/BRV010?bitness=64',
            'vivaldi': 'https://downloads.vivaldi.com/stable/Vivaldi.7.7.3851.58.x64.exe',

            #COMMUNICATION
            'discord': 'https://discord.com/api/download?platform=win',
            'telegram': 'https://telegram.org/dl/desktop/win',
            'microsoftteams': 'https://statics.teams.cdn.office.net/production-windows-x86/lkg/MSTeamsSetup.exe',

            #MEDIA AND FILES
            'vlc': 'https://get.videolan.org/vlc/3.0.18/win64/vlc-3.0.18-win64.exe',
            '7zip': 'https://www.7-zip.org/a/7z2301-x64.exe',
            'winrar': 'https://www.win-rar.com/fileadmin/winrar-versions/winrar/winrar-x64-713.exe',
            'nanazip': 'https://www.nanazip.com/downloads/nanazip-setup.exe',
        }

        # ADD MORE
        # ALSO, ADD KO LANG NA I-CATEGORIZE NIYO YUNG BAWAT PROGRAMS AND COMMENT
        # (ex. PYTHON,MYSQL - #LANGUAGE & RUNTIMES) 
        # (ex. VSCODE - #IDE)
    #LANGUAGE & RUNTIME  
    def install_php(self):
        self.logger.log("Installing PHP")
        try:
            webbrowser.open(self.urls['php'])
            return True
        except:
            return False        
        
    def install_visualc(self):
        self.logger.log("Installing Visual C++")
        try:
            webbrowser.open(self.urls['visualc'])
            return True
        except:
            return False
        
    def install_python(self):
        self.logger.log("Installing Python")
        try:
            webbrowser.open(self.urls['python'])
            return True
        except:
            return False

    def install_java(self):
        self.logger.log("Installing Java JDK")
        try:
            webbrowser.open(self.urls['java'])
            return True
        except:
            return False

    def install_nodejs(self):
        self.logger.log("Installing NodeJS")
        try:
            webbrowser.open(self.urls['nodejs'])
            return True
        except:
            return False
    
    def install_git(self):
        self.logger.log("Installing Git")
        try:
            webbrowser.open(self.urls['git'])
            return True
        except:
            return False

    #IDE
    def install_vscode(self):
        self.logger.log("Installing Visual Studio Code")
        try:
            webbrowser.open(self.urls['vscode'])
            return True
        except:
            return False

    def install_visualstudio(self):
        self.logger.log("Installing Visual Studio")
        try:
            webbrowser.open(self.urls['visualstudio'])
            return True
        except:
            return False

    def install_intellij(self):
        self.logger.log("Installing IntelliJ IDEA")
        try:
            webbrowser.open(self.urls['intellij'])
            return True
        except:
            return False


    def install_androidstudio(self):
        self.logger.log("Installing Android Studio")
        try:
            webbrowser.open(self.urls['androidstudio'])
            return True
        except:
            return False
        
    def install_pycharm(self):
        self.logger.log("Installing PyCharm")
        try:
            webbrowser.open(self.urls['pycharm'])
            return True
        except:
            return False
        
    def install_notepad(self):
        self.logger.log("Installing Notepad++")
        try:
            webbrowser.open(self.urls["notepad"])
            return True
        except:
            return False
        
    def install_eclipse(self):
        self.logger.log("Installing Eclipse")
        try:
            webbrowser.open(self.urls['eclipse'])
            return True
        except:
            return False
        
    def install_sublimetext(self):
        self.logger.log("Installing Sublime Text")
        try:
            webbrowser.open(self.urls['sublimetext'])
            return True
        except:
            return False
        
    #ACADEMIC
    def install_grammarly(self):
        self.logger.log("Installing Grammarly")
        try:
            webbrowser.open(self.urls['grammarly'])
            return True
        except:
            return False
        

    def install_canva(self):
        self.logger.log("Installing Canva")
        try:
            webbrowser.open(self.urls['canva'])
            return True
        except:
            return False
        
    def install_notion(self):
        self.logger.log("Installing Notion")
        try:
            webbrowser.open(self.urls['notion'])
            return True
        except:
            return False
        
    def install_cobalt(self):
        self.logger.log("Installing Cobalt")
        try:
            webbrowser.open(self.urls['cobalt'])
            return True
        except:
            return False

    #PRODUCTIVITY
    def install_tableaupublic(self):
        self.logger.log("Installing Tableau Public")
        try:
            webbrowser.open(self.urls['tableaupublic'])
            return True
        except:
            return False
        
    def install_m365(self):
        self.logger.log("Installing M365")
        try:
            webbrowser.open(self.urls['m365'])
            return True
        except:
            return False

    #CREATIVITY
    def install_gimp(self):
        self.logger.log("Installing GIMP")
        try:
            webbrowser.open(self.urls['gimp'])
            return True
        except:
            return False

    def install_blender(self):
        self.logger.log("Installing Blender")
        try:
            webbrowser.open(self.urls['blender'])
            return True
        except:
            return False

    def install_audacity(self):
        self.logger.log("Installing Audacity")
        try:
            webbrowser.open(self.urls['audacity'])
            return True
        except:
            return False

    def install_krita(self):
        self.logger.log("Installing Krita")
        try:
            webbrowser.open(self.urls['krita'])
            return True
        except:
            return False  

    def install_capcut(self):
        self.logger.log("Installing CapCut")
        try:
            webbrowser.open(self.urls['capcut'])
            return True
        except:
            return False
        
    
    #COMMUNICATION
    def install_microsoftteams(self):
        self.logger.log("Installing Microsoft Teams")
        try:
            webbrowser.open(self.urls['microsoftteams'])
            return True
        except:
            return False
        
    def install_discord(self):
        self.logger.log("Installing Discord")
        try:
            webbrowser.open(self.urls['discord'])
            return True
        except:
            return False
        
    def install_telegram(self):
        self.logger.log("Installing Telegram")
        try:
            webbrowser.open(self.urls['telegram'])
            return True
        except:
            return False
        
    #MEDIA AND FILES
    def install_vlc(self):
        self.logger.log("Installing VLC")
        try:
            webbrowser.open(self.urls['vlc'])
            return True
        except:
            return False
        
    def install_7zip(self):
        self.logger.log("Installing 7zip")
        try:
            webbrowser.open(self.urls['7zip'])
            return True
        except:
            return False
        
    def install_winrar(self):
        self.logger.log("Installing Winrar")
        try:
            webbrowser.open(self.urls['winrar'])
            return True
        except:
            return False
    def install_nanazip(self):
        self.logger.log("Installing Nanazip")
        try:
            webbrowser.open(self.urls['nanazip'])
            return True
        except:
            return False
        
    #DATABASE
    def install_mysqlworkbench(self):
        self.logger.log("Installing MySQL Workbench")
        try:
            webbrowser.open(self.urls['mysqlworkbench'])
            return True
        except:
            return False
        
    def install_postgresql(self):
        self.logger.log("Installing PostGreSQL")
        try:
            webbrowser.open(self.urls['postgresql'])
            return True
        except:
            return False
        
    def install_mongodbcompass(self):
        self.logger.log("Installing Mongo Database Compass")
        try:
            webbrowser.open(self.urls['mongodbcompass'])
            return True
        except:
            return False
        
    def install_sqlitebrowser(self):
        self.logger.log("Installing SQLite Browser")
        try:
            webbrowser.open(self.urls['sqlitebrowser'])
            return True
        except:
            return False
        
    def install_dbeaver(self):
        self.logger.log("Installing DBeaver")
        try:
            webbrowser.open(self.urls['dbeaver'])
            return True
        except:
            return False
        
    #WEB BROWSER
    def install_mozillafirefox(self):
        self.logger.log("Installing Mozilla Firefox")
        try:
            webbrowser.open(self.urls['mozillafirefox'])
            return True
        except:
            return False
        
    def install_opera(self):
        self.logger.log("Installing Opera")
        try:
            webbrowser.open(self.urls['opera'])
            return True
        except:
            return False
        
    def install_operagx(self):
        self.logger.log("Installing OperaGX")
        try:
            webbrowser.open(self.urls['operagx'])
            return True
        except:
            return False
        
    def install_vivaldi(self):
        self.logger.log("Installing vivaldi")
        try:
            webbrowser.open(self.urls['vivaldi'])
            return True
        except:
            return False
        
    def install_brave(self):
        self.logger.log("Installing Brave")
        try:
            webbrowser.open(self.urls['brave'])
            return True
        except:
            return False

