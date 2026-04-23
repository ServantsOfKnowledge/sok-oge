#!/usr/bin/env python3
import argparse
import json
import re
import socket
import subprocess
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from urllib import request

CLIENT_ID_PATH = Path.home() / ".usb_camera_client_id"


def run_cmd(args: list[str]) -> str:
    try:
        result = subprocess.run(args, capture_output=True, text=True, check=True)
        return result.stdout
    except FileNotFoundError:
        raise RuntimeError(f"Command not found: {args[0]}")
    except subprocess.CalledProcessError as exc:
        err = exc.stderr.strip() or exc.stdout.strip()
        raise RuntimeError(f"Command failed: {' '.join(args)} ({err})")


def get_client_id() -> str:
    if CLIENT_ID_PATH.exists():
        return CLIENT_ID_PATH.read_text().strip()
    client_id = str(uuid.uuid4())
    CLIENT_ID_PATH.write_text(client_id)
    return client_id


def parse_devices(output: str) -> list[dict[str, str]]:
    cameras: list[dict[str, str]] = []
    current_name = None
    for raw_line in output.splitlines():
        line = raw_line.rstrip()
        if not line:
            current_name = None
            continue
        if not line.startswith("\t"):
            current_name = line.rstrip(":")
            continue
        dev = line.strip()
        if dev.startswith("/dev/video"):
            cameras.append({"name": current_name or "Unknown", "device": dev})
    return cameras


def parse_all_info(output: str) -> dict[str, str]:
    info: dict[str, str] = {}
    for raw_line in output.splitlines():
        if ":" not in raw_line:
            continue
        k, v = raw_line.split(":", 1)
        key = k.strip().lower().replace(" ", "_")
        val = v.strip()
        if key and val:
            info[key] = val
    return info


def parse_controls(output: str) -> dict[str, str]:
    controls: dict[str, str] = {}
    regex = re.compile(r"^([a-zA-Z0-9_]+)\s+0x[0-9a-fA-F]+\s+\([^)]*\)\s*:.*\bvalue=([^\s]+)")
    for raw_line in output.splitlines():
        line = raw_line.strip()
        match = regex.match(line)
        if match:
            controls[match.group(1)] = match.group(2)
    return controls


def collect_cameras() -> list[dict[str, object]]:
    devices_out = run_cmd(["v4l2-ctl", "--list-devices"])
    devices = parse_devices(devices_out)
    out: list[dict[str, object]] = []

    for dev in devices:
        device = dev["device"]
        all_out = run_cmd(["v4l2-ctl", "-d", device, "--all"])
        ctrls_out = run_cmd(["v4l2-ctl", "-d", device, "--list-ctrls"])

        info = parse_all_info(all_out)
        controls = parse_controls(ctrls_out)
        out.append(
            {
                "device": device,
                "name": dev["name"],
                "model": info.get("card_type", dev["name"]),
                "bus_info": info.get("bus_info"),
                "driver": info.get("driver_name"),
                "controls": controls,
                "raw_all": all_out,
            }
        )
    return out


def post_report(server_url: str, payload: dict[str, object]) -> None:
    body = json.dumps(payload).encode("utf-8")
    req = request.Request(
        f"{server_url.rstrip('/')}/api/report",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with request.urlopen(req, timeout=15) as resp:
        if resp.status >= 300:
            raise RuntimeError(f"Server returned HTTP {resp.status}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Collect USB camera settings and report to dashboard server.")
    parser.add_argument("--server", required=True, help="Dashboard server base URL, e.g. http://10.0.0.10:8000")
    parser.add_argument("--dry-run", action="store_true", help="Print report JSON instead of sending")
    args = parser.parse_args()

    try:
        cameras = collect_cameras()
    except RuntimeError as exc:
        print(f"Collection error: {exc}", file=sys.stderr)
        return 1

    payload = {
        "client_id": get_client_id(),
        "hostname": socket.gethostname(),
        "reported_at": datetime.now(timezone.utc).isoformat(),
        "cameras": cameras,
    }

    if args.dry_run:
        print(json.dumps(payload, indent=2))
        return 0

    try:
        post_report(args.server, payload)
    except Exception as exc:  # noqa: BLE001
        print(f"Failed to post report: {exc}", file=sys.stderr)
        return 2

    print(f"Reported {len(cameras)} camera(s) from {payload['hostname']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
