# MAIN - RUN THIS FILE TO EXECUTE

import tkinter as tk
from interface import ToolkitInterface
from logger import Logger

def main():
    logger = Logger()
    root = tk.Tk()
    app = ToolkitInterface(root, logger)
    root.mainloop()

if __name__ == "__main__":
    main()

