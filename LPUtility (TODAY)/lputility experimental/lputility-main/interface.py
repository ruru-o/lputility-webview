# GARCIA

import tkinter as tk
from tkinter import messagebox
from functions import ToolkitFunctions
from browser import BrowserEmbedder

class ToolkitInterface:
    COLORS = {
        'bg': '#0d0d0d',              # deep black background
        'card': '#1a1a1a',            # card background
        'card_hover': '#242424',      # card hover
        'accent': '#8b0000',          # lpu dark red
        'accent_bright': '#b30000',   # bright red hover
        'text': '#e0e0e0',            # soft white
        'text_dim': '#808080',        # dim gray
        'border': '#2d2d2d',           # subtle border
        'text': '#FFFFFF'              # white
    }
    
    def __init__(self, root, logger):
        self.root = root
        self.logger = logger
        self.functions = ToolkitFunctions(logger)
        self.browser = BrowserEmbedder(logger)
        self.selected_category = None
        
        self._setup_window()
        self._create_layout()
    
    def _setup_window(self):
        self.root.title("LPUtility")
        self.root.geometry("1200x700")
        self.root.configure(bg=self.COLORS['bg'])
        
        # center window
        self.root.update_idletasks()
        x = (self.root.winfo_screenwidth() - 1200) // 2
        y = (self.root.winfo_screenheight() - 700) // 2
        self.root.geometry(f"1200x700+{x}+{y}")
    
    def _create_layout(self):
        # header
        header = tk.Frame(self.root, bg=self.COLORS['bg'], height=80)
        header.pack(fill='x', pady=(20, 0))
        header.pack_propagate(False)
        
        title = tk.Label(
            header,
            text="LPUtility",
            font=('Segoe UI', 24, 'bold'),
            bg=self.COLORS['bg'],
            fg=self.COLORS['text']
        )
        title.pack(pady=(10, 0))
        
        subtitle = tk.Label(
            header,
            text="Student Utility Toolkit for Lyceans",
            font=('Segoe UI', 10),
            bg=self.COLORS['bg'],
            fg=self.COLORS['text_dim']
        )
        subtitle.pack()
        
        # main content area
        content = tk.Frame(self.root, bg=self.COLORS['bg'])
        content.pack(fill='both', expand=True, padx=30, pady=20)
        
        # left side: interactive categories
        self.categories_frame = tk.Frame(content, bg=self.COLORS['bg'], width=250)
        self.categories_frame.pack(side='left', fill='y', padx=(0, 20))
        self.categories_frame.pack_propagate(False)
        
        self._create_categories()
        
        # center: tools display
        self.tools_frame = tk.Frame(content, bg=self.COLORS['bg'])
        self.tools_frame.pack(side='left', fill='both', expand=True, padx=(0, 20))
        
        # right side: activity logs
        self._create_log_display(content)
        
        # welcome message
        self._show_welcome()
    
    def _create_categories(self):
        categories = [
            ("Programming Tools", "programming"),
            ("Academic Utilities", "academic"),
            ("Productivity Software", "productivity"),
            ("Creative Tools", "creative"),
            ("LPU Portals", "portals")
        ]
        
        tk.Label(
            self.categories_frame,
            text="CATEGORIES",
            font=('Segoe UI', 11, 'bold'),
            bg=self.COLORS['bg'],
            fg=self.COLORS['text_dim'],
            anchor='w'
        ).pack(fill='x', pady=(0, 15))
        
        for name, key in categories:
            self._create_category_button(name, key)
    
    def _create_category_button(self, name, key):
        btn_frame = tk.Frame(
            self.categories_frame,
            bg=self.COLORS['card'],
            highlightbackground=self.COLORS['border'],
            highlightthickness=1,
            cursor='hand2'
        )
        btn_frame.pack(fill='x', pady=5)
        
        label = tk.Label(
            btn_frame,
            text=name,
            font=('Segoe UI', 11),
            bg=self.COLORS['card'],
            fg=self.COLORS['text'],
            anchor='w',
            padx=15,
            pady=12
        )
        label.pack(fill='both')
        
        # make interactive with hover and click
        def on_enter(e):
            if self.selected_category != key:
                btn_frame.config(bg=self.COLORS['card_hover'])
                label.config(bg=self.COLORS['card_hover'])
        
        def on_leave(e):
            if self.selected_category != key:
                btn_frame.config(bg=self.COLORS['card'])
                label.config(bg=self.COLORS['card'])
        
        def on_click(e):
            self._select_category(key, btn_frame, label)
        
        btn_frame.bind('<Enter>', on_enter)
        btn_frame.bind('<Leave>', on_leave)
        btn_frame.bind('<Button-1>', on_click)
        label.bind('<Button-1>', on_click)
        
        # store reference for selection highlighting
        if not hasattr(self, 'category_buttons'):
            self.category_buttons = {}
        self.category_buttons[key] = (btn_frame, label)
    
    def _select_category(self, category, frame, label):
        # reset all categories
        for key, (f, l) in self.category_buttons.items():
            f.config(bg=self.COLORS['card'])
            l.config(bg=self.COLORS['card'], fg=self.COLORS['text'])
        
        # highlight selected
        self.selected_category = category
        frame.config(bg=self.COLORS['accent'])
        label.config(bg=self.COLORS['accent'], fg='white')
        
        # log category selection
        category_names = {
            'programming': 'Programming Tools',
            'academic': 'Academic Utilities',
            'productivity': 'Productivity Software',
            'creative': 'Creative Tools',
            'portals': 'LPU Portals'
        }
        self._add_log(f"Viewing: {category_names.get(category, category)}", "info")
        
        # show tools for this category
        self._show_tools(category)
    
    def _show_welcome(self):
        for widget in self.tools_frame.winfo_children():
            widget.destroy()
        
        welcome = tk.Label(
            self.tools_frame,
            text="← Choose your option.",
            font=('Segoe UI', 13),
            bg=self.COLORS['bg'],
            fg=self.COLORS['text_dim']
        )
        welcome.pack(expand=True)
    
    def _show_tools(self, category):
        # clear current tools
        for widget in self.tools_frame.winfo_children():
            widget.destroy()
        
        # create scrollable area
        canvas = tk.Canvas(
            self.tools_frame,
            bg=self.COLORS['bg'],
            highlightthickness=0
        )
        scrollbar = tk.Scrollbar(
            self.tools_frame,
            orient='vertical',
            command=canvas.yview
        )
        scrollable = tk.Frame(canvas, bg=self.COLORS['bg'])
        
        scrollable.bind(
            '<Configure>',
            lambda e: canvas.configure(scrollregion=canvas.bbox('all'))
        )
        
        canvas.create_window((0, 0), window=scrollable, anchor='nw')
        canvas.configure(yscrollcommand=scrollbar.set)
        
        scrollbar.pack(side='right', fill='y')
        canvas.pack(side='left', fill='both', expand=True)
        
        # bind mousewheel
        canvas.bind_all('<MouseWheel>', lambda e: canvas.yview_scroll(int(-1*(e.delta/120)), 'units'))
        
        # show tools based on category
        if category == 'programming':
            self._show_programming_tools(scrollable)
        elif category == 'academic':
            self._show_academic_tools(scrollable)
        elif category == 'productivity':
            self._show_productivity_tools(scrollable)
        elif category == 'creative':
            self._show_creative_tools(scrollable)
        elif category == 'portals':
            self._show_portals(scrollable)
    
    def _show_programming_tools(self, parent):
        self._create_subcategory(parent, "IDEs & Editors", [
            ("Visual Studio Code", "vscode"),
            ("Visual Studio", "visual_studio"),
            ("PyCharm", "pycharm"),
            ("IntelliJ IDEA", "intellij"),
            ("Eclipse", "eclipse"),
            ("Android Studio", "androidstudio"),
            ("Sublime Text", "sublimetext"),
            ("Notepad++", "notepad"),
        ])
        
        self._create_subcategory(parent, "Languages & Runtimes", [
            ("Python", "python"),
            ("Java JDK", "java"),
            ("Node.js", "nodejs"),
            ("PHP", "php"),
            ("Visual C++", "visualcplusplus"),
        ])
        
        self._create_subcategory(parent, "Databases", [
            ("MySQL Workbench", "mysqlworkbench"),
            ("PostgreSQL", "postgresql"),
            ("MongoDB Compass", "mongodbcompass"),
            ("SQLite Browser", "sqlitebrowser"),
            ("DBeaver", "dbeaver"),
        ])
        
        self._create_subcategory(parent, "Version Control", [
            ("Git", "git"),
        ])
    
    def _show_academic_tools(self, parent):
        self._create_subcategory(parent, "Note Taking & Writing", [
            ("Notion", "notion"),
            ("Grammarly", "grammarly"),
            ("Cobalt", "cobalt"),
        ])
        
        self._create_subcategory(parent, "Data Visualization", [
            ("Tableau Public", "tableaupublic"),
        ])
    
    def _show_productivity_tools(self, parent):
        self._create_subcategory(parent, "Office Suites", [
            ("Microsoft 365", "m365"),
        ])
        
        self._create_subcategory(parent, "Web Browsers", [
            ("Mozilla Firefox", "mozillafirefox"),
            ("Opera", "opera"),
            ("Opera GX", "operagx"),
            ("Brave", "brave"),
            ("Vivaldi", "vivaldi"),
        ])
        
        self._create_subcategory(parent, "Communication", [
            ("Microsoft Teams", "microsoftteams"),
            ("Discord", "discord"),
            ("Telegram", "telegram"),
        ])
        
        self._create_subcategory(parent, "Media & Files", [
            ("VLC Media Player", "vlc"),
            ("7-Zip", "7zip"),
            ("WinRAR", "winrar"),
            ("NanaZip", "nanazip"),
        ])
    
    def _show_creative_tools(self, parent):
        self._create_subcategory(parent, "Graphic Design", [
            ("GIMP", "gimp"),
            ("Krita", "krita"),
            ("Canva", "canva"),
        ])
        
        self._create_subcategory(parent, "3D & Animation", [
            ("Blender", "blender"),
        ])
        
        self._create_subcategory(parent, "Audio & Video", [
            ("Audacity", "audacity"),
            ("CapCut", "capcut"),
        ])
    
    def _show_portals(self, parent):
        portals = [
            ("MyLycean Portal", "mylycean.lpu.edu.ph"),
            ("LMS Portal", "lms.lpucavite.edu.ph"),
        ]
        
        for name, url in portals:
            self._create_portal_card(parent, name, url)
    
    def _create_subcategory(self, parent, title, tools):
        # subcategory header
        header = tk.Label(
            parent,
            text=title,
            font=('Segoe UI', 10, 'bold'),
            bg=self.COLORS['bg'],
            fg=self.COLORS['text_dim'],
            anchor='w'
        )
        header.pack(fill='x', pady=(15, 8), padx=5)
        
        for name, key in tools:
            self._create_tool_card(parent, name, key)
    
    def _create_tool_card(self, parent, name, key):
        card = tk.Frame(
            parent,
            bg=self.COLORS['card'],
            highlightbackground=self.COLORS['border'],
            highlightthickness=1
        )
        card.pack(fill='x', pady=3, padx=5)
        
        name_label = tk.Label(
            card,
            text=name,
            font=('Segoe UI', 10),
            bg=self.COLORS['card'],
            fg=self.COLORS['text'],
            anchor='w'
        )
        name_label.pack(side='left', padx=15, pady=10)
        
        install_btn = tk.Button(
            card,
            text="Install",
            font=('Segoe UI', 9),
            bg=self.COLORS['accent'],
            fg='white',
            activebackground=self.COLORS['accent_bright'],
            activeforeground='white',
            relief='flat',
            cursor='hand2',
            width=10,
            command=lambda: self._handle_install(name, key)
        )
        install_btn.pack(side='right', padx=10, pady=7)
        
        # hover effect
        install_btn.bind('<Enter>', lambda e: install_btn.config(bg=self.COLORS['accent_bright']))
        install_btn.bind('<Leave>', lambda e: install_btn.config(bg=self.COLORS['accent']))
    
    def _create_portal_card(self, parent, name, url):
        card = tk.Frame(
            parent,
            bg=self.COLORS['card'],
            highlightbackground=self.COLORS['border'],
            highlightthickness=1
        )
        card.pack(fill='x', pady=8, padx=5)
        
        info = tk.Frame(card, bg=self.COLORS['card'])
        info.pack(side='left', fill='both', expand=True, padx=15, pady=12)
        
        tk.Label(
            info,
            text=name,
            font=('Segoe UI', 11, 'bold'),
            bg=self.COLORS['card'],
            fg=self.COLORS['text'],
            anchor='w'
        ).pack(anchor='w')
        
        tk.Label(
            info,
            text=url,
            font=('Segoe UI', 9),
            bg=self.COLORS['card'],
            fg=self.COLORS['text_dim'],
            anchor='w'
        ).pack(anchor='w')
        
        open_btn = tk.Button(
            card,
            text="Open Portal",
            font=('Segoe UI', 9),
            bg=self.COLORS['accent'],
            fg='white',
            activebackground=self.COLORS['accent_bright'],
            activeforeground='white',
            relief='flat',
            cursor='hand2',
            width=12,
            command=lambda: self._handle_portal_open(name, url)
        )
        open_btn.pack(side='right', padx=12, pady=12)
        
        open_btn.bind('<Enter>', lambda e: open_btn.config(bg=self.COLORS['accent_bright']))
        open_btn.bind('<Leave>', lambda e: open_btn.config(bg=self.COLORS['accent']))
    
    def _handle_portal_open(self, name, url):
        self._add_log(f"Opening portal: {name}", "info")
        if self.browser.open_portal(url):
            self._add_log(f"✓ Portal opened: {name}", "success")
        else:
            self._add_log(f"✗ Failed to open: {name}", "error")
    
    def _create_log_display(self, parent):
        log_container = tk.Frame(parent, bg=self.COLORS['bg'], width=280)
        log_container.pack(side='right', fill='y')
        log_container.pack_propagate(False)
        
        # log header
        log_header = tk.Frame(
            log_container,
            bg=self.COLORS['card'],
            highlightbackground=self.COLORS['border'],
            highlightthickness=1
        )
        log_header.pack(fill='x', pady=(0, 10))
        
        tk.Label(
            log_header,
            text="ACTIVITY LOG",
            font=('Segoe UI', 10, 'bold'),
            bg=self.COLORS['card'],
            fg=self.COLORS['text'],
            pady=10
        ).pack()
        
        # log display area with scrollbar
        log_frame = tk.Frame(
            log_container,
            bg=self.COLORS['card'],
            highlightbackground=self.COLORS['border'],
            highlightthickness=1
        )
        log_frame.pack(fill='both', expand=True)
        
        # scrollbar
        scrollbar = tk.Scrollbar(log_frame)
        scrollbar.pack(side='right', fill='y')
        
        # text widget for logs
        self.log_text = tk.Text(
            log_frame,
            bg=self.COLORS['card'],
            fg=self.COLORS['text'],
            font=('Consolas', 9),
            wrap='word',
            yscrollcommand=scrollbar.set,
            relief='flat',
            padx=10,
            pady=10,
            state='disabled'
        )
        self.log_text.pack(fill='both', expand=True)
        scrollbar.config(command=self.log_text.yview)
        
        # configure text tags for different log types
        self.log_text.tag_config('timestamp', foreground=self.COLORS['text_dim'])
        self.log_text.tag_config('success', foreground='#00ff00')
        self.log_text.tag_config('error', foreground='#ff4444')
        self.log_text.tag_config('info', foreground=self.COLORS['accent_bright'])
        self.log_text.tag_config('normal', foreground=self.COLORS['text'])
        
        # clear button
        clear_btn = tk.Button(
            log_container,
            text="Clear Logs",
            font=('Segoe UI', 9),
            bg=self.COLORS['card'],
            fg=self.COLORS['text_dim'],
            activebackground=self.COLORS['card_hover'],
            activeforeground=self.COLORS['text'],
            relief='flat',
            cursor='hand2',
            command=self._clear_logs
        )
        clear_btn.pack(fill='x', pady=(10, 0))
        
        clear_btn.bind('<Enter>', lambda e: clear_btn.config(bg=self.COLORS['card_hover']))
        clear_btn.bind('<Leave>', lambda e: clear_btn.config(bg=self.COLORS['card']))
        
        # add initial welcome log
        self._add_log("System initialized", "success")
    
    def _add_log(self, message, log_type='normal'):
        from datetime import datetime
        timestamp = datetime.now().strftime("%H:%M:%S")
        
        # log to file using logger.py
        self.logger.log(message)
        
        # display in UI
        self.log_text.config(state='normal')
        
        # add timestamp
        self.log_text.insert('end', f"[{timestamp}] ", 'timestamp')
        
        # add message with appropriate tag
        self.log_text.insert('end', f"{message}\n", log_type)
        
        self.log_text.config(state='disabled')
        self.log_text.see('end')  # auto-scroll to bottom
    
    def _clear_logs(self):
        self.log_text.config(state='normal')
        self.log_text.delete(1.0, 'end')
        self.log_text.config(state='disabled')
        self._add_log("Logs cleared", "info")
    
    def _handle_install(self, name, key):
        self._add_log(f"Install requested: {name}", "info")
        
        if messagebox.askyesno("Confirm", f"Install {name}?"):
            if self.functions.install(key):
                self._add_log(f"✓ {name} download started", "success")
                messagebox.showinfo("Success", f"{name} download started")
            else:
                self._add_log(f"✗ Failed to install {name}", "error")
                messagebox.showerror("Error", f"Failed to start {name} installation")
