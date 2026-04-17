import os
import sys

def check(name: str, passed: bool, detail: str = "") -> dict:
    icon = "✅" if passed else "❌"
    print(f"  {icon} {name}" + (f" — {detail}" if detail else ""))
    return {"name": name, "passed": passed}

def run_checks():
    results = []
    base = os.getcwd()

    print("\n" + "=" * 55)
    print("  Production Readiness Check — Node.js Lab 12")
    print("=" * 55)

    # --- Files ---
    print("\n📁 Required Files")
    results.append(check("Backend Dockerfile exists", os.path.exists("exam-worker/Dockerfile")))
    results.append(check("Frontend Dockerfile exists", os.path.exists("vnu/Dockerfile")))
    results.append(check("render.yaml exists", os.path.exists("render.yaml")))
    results.append(check(".env.example exists", os.path.exists(".env.example")))
    results.append(check("MISSION_ANSWERS.md exists", os.path.exists("MISSION_ANSWERS.md")))
    results.append(check("DEPLOYMENT.md exists", os.path.exists("DEPLOYMENT.md")))

    # --- Security ---
    print("\n🔒 Security")
    env_ignored = False
    if os.path.exists(".gitignore"):
        content = open(".gitignore").read()
        if ".env" in content or ".dev.vars" in content:
            env_ignored = True
    results.append(check(".env/.dev.vars in .gitignore", env_ignored))

    # --- API Endpoints (Backend check) ---
    print("\n🌐 API Endpoints & Logic")
    backend_main = "exam-worker/src/index.ts"
    node_server = "exam-worker/src/node-server.ts"
    
    if os.path.exists(backend_main):
        content = open(backend_main).read()
        results.append(check("/health endpoint", "/health" in content))
        results.append(check("/ready endpoint", "/ready" in content))
        results.append(check("Rate limiting", "createRateLimiter" in content))
        results.append(check("Authentication", "verifyDownloadToken" in content or "JWT_SECRET" in content))
    
    if os.path.exists(node_server):
        server_content = open(node_server).read()
        results.append(check("Graceful shutdown (SIGTERM)", "SIGTERM" in server_content))

    # --- Docker Analysis ---
    print("\n🐳 Docker Best Practices")
    if os.path.exists("exam-worker/Dockerfile"):
        docker_content = open("exam-worker/Dockerfile").read()
        results.append(check("Multi-stage build", "AS builder" in docker_content))
        results.append(check("Non-root user (USER)", "USER " in docker_content))
        results.append(check("HEALTHCHECK instruction", "HEALTHCHECK" in docker_content))

    # --- Summary ---
    passed = sum(1 for r in results if r["passed"])
    total = len(results)
    pct = round(passed / total * 100)

    print("\n" + "=" * 55)
    print(f"  Result: {passed}/{total} checks passed ({pct}%)")
    if pct == 100:
        print("  🎉 HOÀN HẢO! Bạn đã sẵn sàng nộp bài để lấy điểm 10!")
    else:
        print(f"  ⚠️ Cần chỉnh sửa thêm {total - passed} mục hiện dấu ❌.")
    print("=" * 55 + "\n")

if __name__ == "__main__":
    run_checks()
