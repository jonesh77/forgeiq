// ForgeIQ — Regular launcher (no install).
// Compile with:  g++ -std=c++17 -O2 -o ../run.exe run.cpp
#include <iostream>
#include <cstdlib>
#include <filesystem>
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
    system("");
#endif
}

static bool startBackend(const std::string& folder, int port) {
    if (!fs::exists(folder)) {
        std::cerr << C_RED << "Error: folder '" << folder << "' not found.\n" << C_RESET;
        return false;
    }
    if (!fs::exists(folder + "/venv")) {
        std::cerr << C_YELLOW
                  << "Warning: '" << folder << "/venv' missing. "
                  << "Please run run_first_time.exe first.\n" << C_RESET;
        return false;
    }
    fs::current_path(folder);

    std::cout << C_GREEN << "Starting " << folder << " on port " << port << "...\n" << C_RESET;
    std::string title = "BACKEND " + folder + " (port " + std::to_string(port) + ")";
    std::string cmd =
        "start cmd /k \"title " + title +
        " && echo " + title +
        " && echo Server starting. Press CTRL+C to stop." +
        " && venv\\Scripts\\waitress-serve --listen=0.0.0.0:" + std::to_string(port) +
        " --threads=2 main:app\"";
    system(cmd.c_str());

    fs::current_path("..");
    return true;
}

static bool startFrontend(const std::string& folder) {
    if (!fs::exists(folder)) {
        std::cerr << C_RED << "Error: folder '" << folder << "' not found.\n" << C_RESET;
        return false;
    }
    if (!fs::exists(folder + "/node_modules") || !fs::exists(folder + "/.next")) {
        std::cerr << C_YELLOW
                  << "Warning: frontend not built. Please run run_first_time.exe first.\n"
                  << C_RESET;
        return false;
    }
    fs::current_path(folder);

    std::cout << C_GREEN << "Starting frontend on port 3000...\n" << C_RESET;
    std::string cmd =
        "start cmd /k \"title FRONTEND (port 3000)"
        " && echo FRONTEND SERVER on http://localhost:3000"
        " && echo Press CTRL+C to stop."
        " && pnpm start\"";
    system(cmd.c_str());

    fs::current_path("..");
    return true;
}

int main() {
    enableAnsiOnWindows();
    std::cout << C_BOLD << C_CYAN
              << "================================================================\n"
              << "  ForgeIQ Platform — Quick Launcher\n"
              << "================================================================\n"
              << C_RESET;

    bool b1 = startBackend("backend1", 5000);
    bool b2 = startBackend("backend2", 5001);
    bool fe = startFrontend("frontend");

    if (!(b1 && b2 && fe)) {
        std::cerr << "\n" << C_RED << C_BOLD
                  << "One or more services failed to start. "
                  << "Run " << C_RESET << C_YELLOW << "run_first_time.exe"
                  << C_RED << C_BOLD << " to install missing parts."
                  << C_RESET << "\n";
        std::cout << "\nPress ENTER to exit...";
        std::cin.get();
        return 1;
    }

    std::cout << "\n" << C_GREEN
              << "All services launched.\n"
              << C_RESET
              << "Open " << C_CYAN << "http://localhost:3000" << C_RESET
              << " in your browser.\n\n"
              << "This window will stay open. Closing it does NOT stop the services.\n";

    while (true) {
        std::this_thread::sleep_for(std::chrono::seconds(60));
    }
    return 0;
}
