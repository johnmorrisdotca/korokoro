#!/usr/bin/env python3
"""Roll dice from Python: run the command line, read its JSON."""
import json
import shutil
import subprocess

# On Windows the command is koro.cmd; shutil.which finds it either way.
koro = shutil.which("koro")
done = subprocess.run([koro, "2d20kh1+5", "--seed", "table", "--json"], capture_output=True, text=True, encoding="utf-8")
if done.returncode != 0:
    raise SystemExit(done.stderr)
result = json.loads(done.stdout)
assert result["format"] == 1
roll = result["rolls"][0]
print(roll["total"])  # 24: the dice were 19 and 12, the 19 kept, plus 5
