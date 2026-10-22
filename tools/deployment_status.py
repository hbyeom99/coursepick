"""Read-only deployment snapshot; standard library only, no credentials required."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import json
from pathlib import Path
import re
import subprocess
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
REPO = "hbyeom99/coursepick"
PROJECTS = ("coursepick-web", "coursepick-api")


def get_json(url):
    request = urllib.request.Request(url, headers={
        "User-Agent": "coursepick-deployment-status",
        "Accept": "application/json",
    })
    with urllib.request.urlopen(request, timeout=20) as response:
        return json.load(response)


def summarize(statuses, project):
    # GitHub returns newest entries first. Match the exact project context.
    item = next((s for s in statuses if s.get("context") == f"Vercel \u2013 {project}"), None)
    if item is None:
        return {"project": project, "state": "unknown", "description": "No status for this commit"}
    description = item.get("description") or ""
    state = item.get("state", "unknown")
    if any(word in description.lower() for word in ("skip", "cancel")):
        state = "skipped-or-canceled"
    return {"project": project, "state": state, "description": description,
            "url": item.get("target_url"), "updatedAt": item.get("updated_at")}


def health(url, api=False):
    try:
        with urllib.request.urlopen(url, timeout=20) as response:
            ok = response.status == 200
            if api:
                ok = ok and json.load(response).get("status") == "ok"
            return {"url": url, "http": response.status, "ok": ok}
    except (urllib.error.URLError, ValueError, TimeoutError):
        return {"url": url, "ok": False, "error": "Request failed"}


def snapshot(commit):
    with ThreadPoolExecutor(max_workers=3) as pool:
        statuses = pool.submit(get_json, f"https://api.github.com/repos/{REPO}/commits/{commit}/status")
        web = pool.submit(health, "https://coursepick-web.vercel.app/")
        api = pool.submit(health, "https://coursepick-api.vercel.app/api/health", True)
        try:
            deployments = [summarize(statuses.result().get("statuses", []), p) for p in PROJECTS]
        except (urllib.error.URLError, ValueError, TimeoutError):
            deployments = [{"project": p, "state": "unknown", "description": "GitHub unavailable; check dashboard"} for p in PROJECTS]
        return {"commit": commit, "deployments": deployments, "health": [web.result(), api.result()],
                "note": "Commit status history and current public health only; not proof of current domain commit or full feature verification."}


def exit_code(result, expected):
    relevant = [d for d in result["deployments"] if d["project"] in expected]
    if any(not h["ok"] for h in result["health"]) or any(d["state"] in ("failure", "error") for d in relevant):
        return 1
    if set(expected) != {d["project"] for d in relevant} or any(d["state"] != "success" for d in relevant):
        return 2
    return 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--commit", default="HEAD", help="Git revision to inspect (default HEAD)")
    parser.add_argument("--expect", nargs="+", choices=(*PROJECTS, "none"), default=list(PROJECTS), help="Projects expected to build; use none for docs-only changes")
    args = parser.parse_args()
    if "none" in args.expect and len(args.expect) != 1:
        parser.error("none cannot be combined with a project")
    try:
        commit = subprocess.check_output(["git", "rev-parse", "--verify", args.commit + "^{commit}"], cwd=ROOT, text=True, stderr=subprocess.DEVNULL).strip()
    except subprocess.CalledProcessError:
        parser.error("Unknown Git commit")
    if not re.fullmatch(r"[0-9a-f]{40,64}", commit):
        parser.error("Invalid commit hash")
    result = snapshot(commit)
    # ASCII JSON also works in Windows terminals with a non-Unicode encoding.
    print(json.dumps(result, indent=2, ensure_ascii=True))
    return exit_code(result, [] if args.expect == ["none"] else args.expect)


if __name__ == "__main__":
    raise SystemExit(main())
