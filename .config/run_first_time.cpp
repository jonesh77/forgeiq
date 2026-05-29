// ForgeIQ — First-time setup launcher.
// Compile with:  g++ -std=c++17 -O2 -o ../run_first_time.exe run_first_time.cpp
#include <iostream>
#include <cstdlib>
#include <filesystem>
#include <fstream>
#include <thread>
#include <chrono>
#include <string>

namespace fs = std::filesystem;

#define C_RESET   "\033[0m"
#define C_RED     "\033[31m"
#define C_GREEN   "\033[32m"
#define C_YELLOW  "\033[33m"
#define C_CYAN    "\033[36m"
#define C_BOLD    "\033[1m"

static void enableAnsiOnWindows() {
#ifdef _WIN32
    system("");  // triggers VT processing
#endif
}

static void banner(const std::string& title) {
    std::cout << "\n" << C_BOLD << C_CYAN
              << "================================================================\n"
              << "  " << title << "\n"
              << "================================================================"
              << C_RESET << "\n";
}

static bool run(const std::string& cmd, const std::string& fail_msg = "") {
    int rc = system(cmd.c_str());
    if (rc != 0) {
        if (!fail_msg.empty())
            std::cerr << C_RED << "[FAIL] " << fail_msg << C_RESET << "\n";
        return false;
    }
    return true;
}

static bool checkTool(const std::string& probe, const std::string& name, const std::string& hint) {
    std::cout << "Checking " << name << "... ";
    if (system((probe + " >nul 2>&1").c_str()) == 0) {
        std::cout << C_GREEN << "OK" << C_RESET << "\n";
        return true;
    }
    std::cout << C_RED << "NOT FOUND" << C_RESET << "\n";
    std::cerr << C_YELLOW << "  -> " << hint << C_RESET << "\n";
    return false;
}

static bool setupBackend(const std::string& folder, int port) {
    banner("Installing " + folder + " (Python venv, port " + std::to_string(port) + ")");
    if (!fs::exists(folder)) {
        std::cerr << C_RED << "Error: folder '" << folder << "' not found.\n" << C_RESET;
        return false;
    }
    fs::current_path(folder);

    std::cout << "Creating virtual environment...\n";
    if (!run("python -m venv venv", "Could not create venv. Is Python installed?"))
        { fs::current_path(".."); return false; }

    std::cout << "Upgrading pip and installing requirements (this may take several minutes)...\n";
    std::string pip = "venv\\Scripts\\python.exe -m pip install --upgrade pip "
                      "&& venv\\Scripts\\pip install -r requirements.txt";
    if (!run(pip, "Failed to install Python dependencies. Check internet connection and requirements.txt."))
        { fs::current_path(".."); return false; }

    std::cout << "Launching backend on port " << port << "...\n";
    std::string banner_text = "BACKEND " + folder + " (port " + std::to_string(port) + ")";
    std::string cmd =
        "start cmd /k \"title " + banner_text +
        " && echo " + banner_text +
        " && echo Server starting. Windows may ask for firewall permission." +
        " && echo Press CTRL+C to stop." +
        " && venv\\Scripts\\waitress-serve --listen=0.0.0.0:" + std::to_string(port) +
        " --threads=2 main:app\"";
    run(cmd);

    fs::current_path("..");
    return true;
}

static bool setupFrontend(const std::string& folder) {
    banner("Installing " + folder + " (Node + pnpm)");
    if (!fs::exists(folder)) {
        std::cerr << C_RED << "Error: folder '" << folder << "' not found.\n" << C_RESET;
        return false;
    }
    fs::current_path(folder);

    // Ensure .env.local exists; if not, create from .env.example
    if (!fs::exists(".env.local") && fs::exists(".env.example")) {
        std::cout << C_YELLOW << "No .env.local found. Copying from .env.example...\n" << C_RESET;
        std::ifstream src(".env.example", std::ios::binary);
        std::ofstream dst(".env.local", std::ios::binary);
        dst << src.rdbuf();
        std::cout << C_YELLOW
                  << "  -> Please edit frontend\\.env.local and set real DB_URI and SESSION_PASSWORD.\n"
                  << C_RESET;
    }

    std::cout << "Installing pnpm globally...\n";
    run("npm install -g pnpm",
        "Could not install pnpm. Check npm/Node installation.");

    run("pnpm config set dangerouslyAllowAllBuilds true");

    std::cout << "Installing dependencies (this may take a few minutes)...\n";
    if (!run("pnpm install", "pnpm install failed."))
        { fs::current_path(".."); return false; }

    std::cout << "Building frontend (production build)...\n";
    if (!run("pnpm run build", "Frontend build failed."))
        { fs::current_path(".."); return false; }

    std::cout << "Launching frontend server...\n";
    std::string cmd =
        "start cmd /k \"title FRONTEND (port 3000)"
        " && echo FRONTEND SERVER on http://localhost:3000"
        " && echo Press CTRL+C to stop."
        " && pnpm start\"";
    run(cmd);

    fs::current_path("..");
    return true;
}

int main() {
    enableAnsiOnWindows();
    banner("ForgeIQ Platform — First-Time Setup");

    std::cout << "This installer will:\n"
              << "  1. Verify Python and Node.js are installed\n"
              << "  2. Create Python virtual environments for both backends\n"
              << "  3. Install all dependencies\n"
              << "  4. Build the frontend\n"
              << "  5. Launch all 3 services in separate windows\n\n"
              << C_YELLOW << "Note: First-time setup may take 10-20 minutes depending on internet speed.\n"
              << C_RESET << "\n";

    bool pythonOk = checkTool("python --version", "Python",
        "Install Python 3.9+ from https://python.org and tick 'Add Python to PATH'.");
    bool nodeOk = checkTool("node -v", "Node.js",
        "Install Node.js 18+ LTS from https://nodejs.org/");
    bool npmOk = checkTool("npm -v", "npm",
        "npm comes with Node.js. Reinstall Node.js if missing.");

    if (!pythonOk || !nodeOk || !npmOk) {
        std::cerr << "\n" << C_RED << C_BOLD
                  << "Setup cannot continue. Please install the missing tool(s) and re-run."
                  << C_RESET << "\n";
        std::cout << "\nPress ENTER to exit...";
        std::cin.get();
        return 1;
    }

    bool ok1 = setupBackend("backend1", 5000);
    bool ok2 = setupBackend("backend2", 5001);
    bool okf = setupFrontend("frontend");

    banner("Setup Complete");
    std::cout << "Status:\n"
              << "  backend1: " << (ok1 ? C_GREEN "OK" C_RESET : C_RED "FAILED" C_RESET) << "\n"
              << "  backend2: " << (ok2 ? C_GREEN "OK" C_RESET : C_RED "FAILED" C_RESET) << "\n"
              << "  frontend: " << (okf ? C_GREEN "OK" C_RESET : C_RED "FAILED" C_RESET) << "\n"
              << "\nFrontend: " << C_CYAN << "http://localhost:3000" << C_RESET
              << "\nFor next runs, use " << C_BOLD << "run.exe" << C_RESET
              << " (skips installation).\n\n";

    std::cout << "This window will stay open. Close it to stop monitoring (services keep running).\n";
    while (true) {
        std::this_thread::sleep_for(std::chrono::seconds(30));
    }
    return 0;
}
