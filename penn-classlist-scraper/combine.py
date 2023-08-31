

import os
import glob

files_to_include = ["*.js", "manifest.json", "popup.html"]

all_filenames = [
    filename
    for pattern in files_to_include
    for filename in glob.glob(pattern)
]

PROMPT = "Ignore any previous versions of the files: " + ", ".join(all_filenames) + "\n\n"
PROMPT += "Below is the current state of the codebase file-by-file.\n"
PROMPT += "===========================================================================.\n\n"
for filename in all_filenames:
    PROMPT += f"File '{filename}':\n```\n"
    PROMPT += open(filename).read()
    PROMPT += "\n```\n\n"

PROMPT += "===========================================================================.\n\n"

open("prompt.txt", "w").write(PROMPT)