# Build and run the C++ Catch2 test suite.
# Run from the repo root: .\tests\build-and-run.ps1
# Or from the tests directory: .\build-and-run.ps1
#
# Requirements: CMake 3.14+, a C++17 compiler (MSVC 2019+, GCC 9+, Clang 10+),
#               git (for FetchContent to download Catch2 on first run).

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BuildDir  = Join-Path $ScriptDir "build"

Write-Host "==> Configuring..." -ForegroundColor Cyan
cmake -S $ScriptDir -B $BuildDir
if (-not $?) { exit 1 }

Write-Host "==> Building..." -ForegroundColor Cyan
cmake --build $BuildDir --config Release
if (-not $?) { exit 1 }

Write-Host "==> Running tests..." -ForegroundColor Cyan
ctest --test-dir $BuildDir -C Release --output-on-failure
