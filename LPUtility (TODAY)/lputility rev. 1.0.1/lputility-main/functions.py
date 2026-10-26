# FUNCTION - JOSWEN PINKGUY

from installer import SoftwareInstaller

class ToolkitFunctions:
    def __init__(self, logger):
        self.logger = logger
        self.installer = SoftwareInstaller(logger)
    
    def install(self, software_key):
        #IDE
        if software_key == "notepad":
            return self.installer.install_notepad()
        elif software_key == "pycharm":
            return self.installer.install_pycharm()
        elif software_key == "intellij":
            return self.installer.install_intellij()
        elif software_key == "eclipse":
            return self.installer.install_eclipse()
        elif software_key == "vscode":
            return self.installer.install_vscode()
        elif software_key == "visual_studio":
            return self.installer.install_visualstudio()
        elif software_key == "androidstudio":
            return self.installer.install_androidstudio()
        elif software_key == "sublimetext":
            return self.installer.install_sublimetext()
        
        #LANGUAGE & RUNTIMES
        elif software_key == "python":
            return self.installer.install_python()
        elif software_key == "java":
            return self.installer.install_java()
        elif software_key == "nodejs":
            return self.installer.install_nodejs()
        elif software_key == "visualc":
            return self.installer.install_visualc()
        elif software_key == "git":
            return self.installer.install_git()
        elif software_key == "php":
            return self.installer.install_php()

        #DATABASE
        elif software_key == "mysqlworkbench":
            return self.installer.install_mysqlworkbench()
        elif software_key == "postgresql":
            return self.installer.install_postgresql()
        elif software_key == "mongodbcompass":
            return self.installer.install_mongodbcompass()
        elif software_key == "sqlitebrowser":
            return self.installer.install_sqlitebrowser()
        elif software_key == "dbeaver":
            return self.installer.install_dbeaver()

        #ACADEMICS
        elif software_key == "notion":
            return self.installer.install_notion()
        elif software_key == "grammarly":
            return self.installer.install_grammarly()
        elif software_key == "cobalt":
            return self.installer.install_cobalt()
        elif software_key == "canva":
            return self.installer.install_canva()

        #PRODUCTIVITY
        elif software_key == "m365":
            return self.installer.install_m365()
        elif software_key == "tableaupublic":
            return self.installer.install_tableaupublic()

        #CREATIVITY
        elif software_key == "gimp":
            return self.installer.install_gimp()
        elif software_key == "blender":
            return self.installer.install_blender()
        elif software_key == "audacity":
            return self.installer.install_audacity()
        elif software_key == "krita":
            return self.installer.install_krita()
        elif software_key == "capcut":
            return self.installer.install_capcut()

        #WEB BROWSERS
        elif software_key == "mozillafirefox":
            return self.installer.install_mozillafirefox()
        elif software_key == "opera":
            return self.installer.install_opera()
        elif software_key == "operagx":
            return self.installer.install_operagx()
        elif software_key == "brave":
            return self.installer.install_brave()
        elif software_key == "vivaldi":
            return self.installer.install_vivaldi()
        
        #COMMUNICATION
        elif software_key == "discord":
            return self.installer.install_discord()
        elif software_key == "telegram":
            return self.installer.install_telegram()
        elif software_key == "microsoftteams":
            return self.installer.install_microsoftteams()

        #MEDIA AND FILES
        elif software_key == "vlc":
            return self.installer.install_vlc()
        elif software_key == "7zip":
            return self.installer.install_7zip()
        elif software_key == "winrar":
            return self.installer.install_winrar()
        elif software_key == "nanazip":
            return self.installer.install_nanazip()

        return False






