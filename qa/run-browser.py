"""Launch an isolated loopback-only test process with a temporary database."""
import argparse
import os
import socket
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path

ap=argparse.ArgumentParser()
ap.add_argument("--executable",help="Optional system Chromium")
ap.add_argument("--browser",default="chromium",choices=["chromium","firefox","webkit"])
ap.add_argument("--axe")
ap.add_argument("--output",default="qa-output")
args=ap.parse_args()
root=Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory(prefix="jas-browser-") as work:
    def run(script, flags, db):
        # The service belongs only to this test process and uses isolated storage.
        with socket.socket() as sock:
            sock.bind(("127.0.0.1",0))
            port=sock.getsockname()[1]
        origin=f"http://127.0.0.1:{port}"
        env=dict(os.environ, DB_PATH=str(db), PORT=str(port), HOST="127.0.0.1", SITE_ORIGIN=origin, PUBLIC_LAUNCH="0")
        child=subprocess.Popen(["node","server.mjs"],env=env,cwd=root)
        try:
            for _ in range(100):
                if child.poll() is not None:raise RuntimeError("Test server stopped during startup")
                try:
                    with urllib.request.urlopen(origin+"/ar",timeout=.5) as response:
                        if response.status==200:break
                except OSError:time.sleep(.05)
            else:raise RuntimeError("Test server did not start")
            cmd=[sys.executable,str(root/script),origin,*flags]
            if args.executable:cmd.extend(["--executable",args.executable])
            subprocess.run(cmd,check=True)
        finally:
            child.terminate()
            child.wait(timeout=5)
    flags=["--browser",args.browser,"--output",args.output]
    if args.axe:flags.extend(["--axe",args.axe])
    run("tests/browser_qa.py",flags,Path(work)/"empty.sqlite")
    fixture=Path(subprocess.check_output(["node","qa/menu-fixture.mjs"],cwd=root,text=True).strip())
    try:run("qa/fixture_browser.py",["--browser",args.browser],fixture)
    finally:
        # Only the fixture helper's freshly generated temporary directory is removed.
        import shutil
        if fixture.parent.parent==Path(tempfile.gettempdir()) and fixture.parent.name.startswith("jas-ci-"):
            shutil.rmtree(fixture.parent)
    if args.browser=="chromium":run("qa/lab.py",["--output",str(Path(args.output)/"lab.json")],Path(work)/"empty.sqlite")
