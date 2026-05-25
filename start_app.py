#!/usr/bin/env python3
"""Start the Seedance Studio backend and frontend from one command."""

from __future__ import annotations

import argparse
import os
import shutil
import signal
import subprocess
import sys
import threading
import time
from pathlib import Path


ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend"
VENV = BACKEND / ".venv"
BACKEND_PORT = "8000"
FRONTEND_URL = "http://127.0.0.1:5173"


def command_exists(command: str) -> bool:
    return shutil.which(command) is not None


def venv_python() -> Path:
    if os.name == "nt":
        return VENV / "Scripts" / "python.exe"
    return VENV / "bin" / "python"


def npm_command() -> str:
    if os.name == "nt" and command_exists("npm.cmd"):
        return "npm.cmd"
    return "npm"


def run(command: list[str], cwd: Path = ROOT) -> None:
    print(f"$ {' '.join(command)}", flush=True)
    subprocess.run(command, cwd=cwd, check=True)


def run_quiet(command: list[str], cwd: Path = ROOT) -> bool:
    return subprocess.run(
        command,
        cwd=cwd,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=False,
    ).returncode == 0


def remove_backend_venv() -> None:
    resolved_venv = VENV.resolve()
    resolved_backend = BACKEND.resolve()
    if resolved_venv.parent != resolved_backend or resolved_venv.name != ".venv":
        raise RuntimeError(f"Refusing to remove unexpected virtualenv path: {resolved_venv}")
    shutil.rmtree(resolved_venv)


def backend_venv_ready() -> bool:
    python_path = venv_python()
    if not python_path.exists():
        return False
    return run_quiet([str(python_path), "-m", "pip", "--version"])


def ensure_env_file() -> None:
    env_file = ROOT / ".env"
    example_file = ROOT / ".env.example"
    if not env_file.exists() and example_file.exists():
        shutil.copyfile(example_file, env_file)
        print("Created .env from .env.example. Edit it to add your API key if needed.", flush=True)


def ensure_backend(skip_install: bool) -> None:
    if VENV.exists() and not backend_venv_ready():
        print("Found an incomplete backend virtualenv. Recreating backend/.venv...", flush=True)
        remove_backend_venv()

    if not backend_venv_ready():
        run([sys.executable, "-m", "venv", str(VENV)])

    if not skip_install:
        run([str(venv_python()), "-m", "pip", "install", "--upgrade", "pip"])
        run([str(venv_python()), "-m", "pip", "install", "-r", str(BACKEND / "requirements.txt")])


def ensure_frontend(skip_install: bool) -> None:
    if not command_exists(npm_command()):
        raise RuntimeError("npm is not available. Install Node.js, then run this script again.")

    if not skip_install and not (FRONTEND / "node_modules").exists():
        run([npm_command(), "install"], cwd=FRONTEND)


def stream_output(process: subprocess.Popen[str], name: str) -> None:
    assert process.stdout is not None
    for line in process.stdout:
        print(f"[{name}] {line}", end="", flush=True)


def start_process(name: str, command: list[str], cwd: Path) -> subprocess.Popen[str]:
    print(f"Starting {name}: {' '.join(command)}", flush=True)
    process = subprocess.Popen(
        command,
        cwd=cwd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )
    threading.Thread(target=stream_output, args=(process, name), daemon=True).start()
    return process


def stop_processes(processes: list[subprocess.Popen[str]]) -> None:
    for process in processes:
        if process.poll() is None:
            process.terminate()

    deadline = time.time() + 8
    for process in processes:
        if process.poll() is not None:
            continue
        remaining = max(0.1, deadline - time.time())
        try:
            process.wait(timeout=remaining)
        except subprocess.TimeoutExpired:
            process.kill()


def serve(skip_install: bool) -> int:
    ensure_env_file()
    ensure_backend(skip_install)
    ensure_frontend(skip_install)

    env = os.environ.copy()
    env.setdefault("PYTHONUNBUFFERED", "1")

    backend = start_process(
        "backend",
        [
            str(venv_python()),
            "-m",
            "uvicorn",
            "backend.app.main:app",
            "--reload",
            "--host",
            "127.0.0.1",
            "--port",
            BACKEND_PORT,
        ],
        ROOT,
    )
    frontend = start_process("frontend", [npm_command(), "run", "dev"], FRONTEND)
    processes = [backend, frontend]

    print(f"\nApp running at {FRONTEND_URL}", flush=True)
    print("Press Ctrl+C to stop both servers.\n", flush=True)

    try:
        while True:
            for process in processes:
                code = process.poll()
                if code is not None:
                    stop_processes(processes)
                    return code
            time.sleep(0.5)
    except KeyboardInterrupt:
        print("\nStopping servers...", flush=True)
        stop_processes(processes)
        return 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Start Seedance Studio backend and frontend.")
    parser.add_argument(
        "--skip-install",
        action="store_true",
        help="Do not install or update Python/npm dependencies before starting.",
    )
    return parser.parse_args()


def main() -> int:
    if os.name != "nt":
        signal.signal(signal.SIGTERM, lambda _signum, _frame: sys.exit(0))

    args = parse_args()
    try:
        return serve(skip_install=args.skip_install)
    except KeyboardInterrupt:
        print("\nStopped.", flush=True)
        return 130
    except subprocess.CalledProcessError as exc:
        print(f"Command failed with exit code {exc.returncode}: {' '.join(exc.cmd)}", file=sys.stderr)
        return exc.returncode
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
