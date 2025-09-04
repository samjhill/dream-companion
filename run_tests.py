#!/usr/bin/env python3
"""
Comprehensive test runner for the Dream Companion App.
Runs both frontend and backend tests with coverage reporting.
"""

import os
import sys
import subprocess
import argparse
from pathlib import Path

def run_command(command, cwd=None, check=True):
    """Run a command and return the result."""
    print(f"Running: {command}")
    if cwd:
        print(f"Working directory: {cwd}")
    
    result = subprocess.run(
        command,
        shell=True,
        cwd=cwd,
        capture_output=True,
        text=True
    )
    
    if result.stdout:
        print("STDOUT:", result.stdout)
    if result.stderr:
        print("STDERR:", result.stderr)
    
    if check and result.returncode != 0:
        print(f"Command failed with exit code {result.returncode}")
        sys.exit(result.returncode)
    
    return result

def install_frontend_dependencies():
    """Install frontend dependencies."""
    print("📦 Installing frontend dependencies...")
    frontend_dir = Path(__file__).parent / "frontend"
    
    if not frontend_dir.exists():
        print("❌ Frontend directory not found!")
        return False
    
    # Install dependencies
    run_command("npm install", cwd=frontend_dir)
    return True

def install_backend_dependencies():
    """Install backend dependencies."""
    print("📦 Installing backend dependencies...")
    backend_dir = Path(__file__).parent / "src"
    
    if not backend_dir.exists():
        print("❌ Backend directory not found!")
        return False
    
    # Install dependencies
    run_command("pip install -r requirements.txt", cwd=backend_dir)
    return True

def run_frontend_tests(coverage=True, watch=False):
    """Run frontend tests."""
    print("🧪 Running frontend tests...")
    frontend_dir = Path(__file__).parent / "frontend"
    
    if not frontend_dir.exists():
        print("❌ Frontend directory not found!")
        return False
    
    if watch:
        command = "npm run test"
    elif coverage:
        command = "npm run test:coverage"
    else:
        command = "npm run test:run"
    
    result = run_command(command, cwd=frontend_dir, check=False)
    return result.returncode == 0

def run_backend_tests(coverage=True, verbose=False):
    """Run backend tests."""
    print("🧪 Running backend tests...")
    backend_dir = Path(__file__).parent / "src"
    
    if not backend_dir.exists():
        print("❌ Backend directory not found!")
        return False
    
    # Set test environment
    env = os.environ.copy()
    env['FLASK_ENV'] = 'testing'
    env['AWS_DEFAULT_REGION'] = 'us-east-1'
    
    # Build pytest command
    command_parts = ["python", "-m", "pytest"]
    
    if verbose:
        command_parts.append("-v")
    
    if coverage:
        command_parts.extend(["--cov=app", "--cov-report=html:htmlcov", "--cov-report=term-missing"])
    
    command_parts.append("tests/")
    
    command = " ".join(command_parts)
    
    result = run_command(command, cwd=backend_dir, check=False)
    return result.returncode == 0

def run_linting():
    """Run linting for both frontend and backend."""
    print("🔍 Running linting...")
    
    # Frontend linting
    print("Frontend linting...")
    frontend_dir = Path(__file__).parent / "frontend"
    if frontend_dir.exists():
        result = run_command("npm run lint", cwd=frontend_dir, check=False)
        if result.returncode != 0:
            print("❌ Frontend linting failed!")
            return False
    
    # Backend linting (if flake8 is installed)
    print("Backend linting...")
    backend_dir = Path(__file__).parent / "src"
    if backend_dir.exists():
        result = run_command("python -m flake8 app/ tests/", cwd=backend_dir, check=False)
        if result.returncode != 0:
            print("⚠️  Backend linting issues found (non-blocking)")
    
    return True

def generate_coverage_report():
    """Generate combined coverage report."""
    print("📊 Generating coverage report...")
    
    # This would require combining frontend and backend coverage
    # For now, just report that coverage was generated
    print("✅ Coverage reports generated:")
    print("  - Frontend: frontend/coverage/index.html")
    print("  - Backend: src/htmlcov/index.html")

def main():
    """Main test runner function."""
    parser = argparse.ArgumentParser(description="Run tests for Dream Companion App")
    parser.add_argument("--frontend-only", action="store_true", help="Run only frontend tests")
    parser.add_argument("--backend-only", action="store_true", help="Run only backend tests")
    parser.add_argument("--no-coverage", action="store_true", help="Skip coverage reporting")
    parser.add_argument("--watch", action="store_true", help="Run tests in watch mode (frontend only)")
    parser.add_argument("--lint", action="store_true", help="Run linting")
    parser.add_argument("--install", action="store_true", help="Install dependencies before running tests")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")
    
    args = parser.parse_args()
    
    print("🚀 Dream Companion App Test Runner")
    print("=" * 50)
    
    success = True
    
    # Install dependencies if requested
    if args.install:
        if not args.backend_only:
            success &= install_frontend_dependencies()
        if not args.frontend_only:
            success &= install_backend_dependencies()
    
    # Run linting if requested
    if args.lint:
        success &= run_linting()
    
    # Run tests
    if not args.backend_only:
        success &= run_frontend_tests(
            coverage=not args.no_coverage,
            watch=args.watch
        )
    
    if not args.frontend_only:
        success &= run_backend_tests(
            coverage=not args.no_coverage,
            verbose=args.verbose
        )
    
    # Generate coverage report
    if not args.no_coverage and not args.watch:
        generate_coverage_report()
    
    print("=" * 50)
    if success:
        print("✅ All tests passed!")
        sys.exit(0)
    else:
        print("❌ Some tests failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
