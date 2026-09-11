# Restaurant Platform - Start All Services
# Starts infrastructure and all applications via Docker Compose.

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Write-Host 'Restaurant Platform - Starting All Services...' -ForegroundColor Green
Write-Host ''

function Assert-Success {
    param([string]$Message)
    if ($LASTEXITCODE -ne 0) {
        throw $Message
    }
}

$root = Get-Location

try {
    docker info *> $null
    Assert-Success 'Docker is not running. Please start Docker Desktop first.'
    Write-Host 'Docker is running' -ForegroundColor Green
    Write-Host ''

    Push-Location 'docker'
    Write-Host 'Starting infrastructure (PostgreSQL, Redis, MinIO)...' -ForegroundColor Cyan
    docker-compose up -d postgres redis minio
    Assert-Success 'Failed to start infrastructure services.'
    Write-Host 'Waiting for infrastructure to be ready...' -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    Pop-Location

    Push-Location 'api'
    if (-not (Test-Path 'node_modules')) {
        Write-Host 'Installing API dependencies...' -ForegroundColor Cyan
        npm install
        Assert-Success 'API npm install failed.'
    }

    Write-Host 'Generating Prisma client (best effort)...' -ForegroundColor Cyan
    npx prisma generate
    if ($LASTEXITCODE -ne 0) {
        Write-Host 'Warning: local Prisma generate failed. Continuing because Docker containers manage their own node_modules.' -ForegroundColor Yellow
    }
    Pop-Location

    Push-Location 'docker'
    Write-Host 'Starting API server...' -ForegroundColor Cyan
    docker-compose up -d api
    Assert-Success 'Failed to start API container.'
    Write-Host 'Waiting for API to start...' -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    Write-Host 'Applying database migrations...' -ForegroundColor Cyan
    docker-compose exec -T api npx prisma migrate deploy
    Assert-Success 'Failed to apply Prisma migrations.'
    Write-Host 'Syncing database schema...' -ForegroundColor Cyan
    docker-compose exec -T api npx prisma db push
    Assert-Success 'Failed to sync Prisma schema.'
    Write-Host 'Seeding database (safe to re-run)...' -ForegroundColor Cyan
    docker-compose exec -T api npx prisma db seed
    Assert-Success 'Failed to seed database.'

    Write-Host 'Starting web applications...' -ForegroundColor Cyan
    docker-compose up -d web-admin web-online web-kds web-packing web-osdu web-driver
    Assert-Success 'Failed to start one or more web containers.'
    Pop-Location

    Write-Host ''
    Write-Host 'All services started.' -ForegroundColor Green
    Write-Host ''
    Write-Host 'Available Applications:' -ForegroundColor Cyan
    Write-Host '  API Docs:      http://localhost:3000/api/docs' -ForegroundColor White
    Write-Host '  Admin/POS:     http://localhost:3001' -ForegroundColor White
    Write-Host '  Online:        http://localhost:3002' -ForegroundColor White
    Write-Host '  Walk-in 1:     http://localhost:3002/menu?channel=walkin&station=front-1' -ForegroundColor White
    Write-Host '  Walk-in 2:     http://localhost:3002/menu?channel=walkin&station=front-2' -ForegroundColor White
    Write-Host '  Walk-in 3:     http://localhost:3002/menu?channel=walkin&station=front-3' -ForegroundColor White
    Write-Host '  KDS:           http://localhost:3003' -ForegroundColor White
    Write-Host '  Packing:       http://localhost:3004' -ForegroundColor White
    Write-Host '  OSDU:          http://localhost:3005' -ForegroundColor White
    Write-Host '  Driver:        http://localhost:3006' -ForegroundColor White
    Write-Host '  MinIO Console: http://localhost:9001' -ForegroundColor White
    Write-Host ''
    Write-Host 'Default Login:' -ForegroundColor Cyan
    Write-Host '  Email:    owner@pizzapalace.com' -ForegroundColor White
    Write-Host '  Password: password123' -ForegroundColor White
    Write-Host ''
    Write-Host 'To stop all services: cd docker; docker-compose down' -ForegroundColor Yellow
}
catch {
    Set-Location $root
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
