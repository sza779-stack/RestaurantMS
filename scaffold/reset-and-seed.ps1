# Reset Database and Seed with Sample Data
# This script resets the PostgreSQL database and runs Prisma seed

param(
    [switch]$Force = $false
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Database Reset & Seed Tool" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (-not $Force) {
    $confirm = Read-Host "⚠️  This will DELETE ALL DATA and reseed. Continue? (y/N)"
    if ($confirm -ne 'y' -and $confirm -ne 'Y') {
        Write-Host "Cancelled." -ForegroundColor Yellow
        exit 0
    }
}

$ErrorActionPreference = 'Stop'

try {
    # Change to docker directory
    Push-Location docker

    Write-Host "📦 Step 1: Stopping API container..." -ForegroundColor Yellow
    docker compose stop api 2>&1 | Out-Null
    Write-Host "   ✓ API stopped" -ForegroundColor Green

    Write-Host ""
    Write-Host "🗄️  Step 2: Resetting PostgreSQL database..." -ForegroundColor Yellow
    
    # Drop and recreate the database
    docker compose exec -T postgres psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS restaurant_platform WITH (FORCE);" 2>&1 | Out-Null
    docker compose exec -T postgres psql -U postgres -d postgres -c "CREATE DATABASE restaurant_platform;" 2>&1 | Out-Null
    Write-Host "   ✓ Database reset" -ForegroundColor Green

    Write-Host ""
    Write-Host "🚀 Step 3: Starting API container for migration..." -ForegroundColor Yellow
    docker compose up -d api
    
    Write-Host "   ⏳ Waiting for API to be ready..." -ForegroundColor Gray
    $maxAttempts = 30
    $attempt = 0
    $ready = $false
    
    while ($attempt -lt $maxAttempts -and -not $ready) {
        Start-Sleep -Seconds 2
        $attempt++
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                $ready = $true
            }
        } catch {
            Write-Host "     Attempt $attempt/$maxAttempts..." -ForegroundColor Gray
        }
    }
    
    if (-not $ready) {
        throw "API failed to start within expected time"
    }
    Write-Host "   ✓ API is ready" -ForegroundColor Green

    Write-Host ""
    Write-Host "🌱 Step 4: Running database seed..." -ForegroundColor Yellow
    docker compose exec api npx prisma db seed 2>&1 | ForEach-Object {
        if ($_ -match "Created|seed|✅") {
            Write-Host "   $_" -ForegroundColor Green
        } else {
            Write-Host "   $_" -ForegroundColor Gray
        }
    }
    Write-Host "   ✓ Seed completed" -ForegroundColor Green

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  ✅ Database Reset & Seed Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📊 Login Credentials:" -ForegroundColor Cyan
    Write-Host "   Email:    owner@pizzapalace.com" -ForegroundColor White
    Write-Host "   Password: password123" -ForegroundColor White
    Write-Host ""
    Write-Host "🌐 Applications:" -ForegroundColor Cyan
	    Write-Host "   POS/Admin: http://localhost:3001" -ForegroundColor White
	    Write-Host "   Online:    http://localhost:3002" -ForegroundColor White
	    Write-Host "   Walk-in 1: http://localhost:3002/menu?channel=walkin&station=front-1" -ForegroundColor White
	    Write-Host "   Walk-in 2: http://localhost:3002/menu?channel=walkin&station=front-2" -ForegroundColor White
	    Write-Host "   Walk-in 3: http://localhost:3002/menu?channel=walkin&station=front-3" -ForegroundColor White
	    Write-Host "   KDS:       http://localhost:3003" -ForegroundColor White
	    Write-Host "   Packing:   http://localhost:3004" -ForegroundColor White
	    Write-Host "   OSDU:      http://localhost:3005" -ForegroundColor White
	    Write-Host "   Driver:    http://localhost:3006" -ForegroundColor White
    Write-Host ""

} catch {
    Write-Host ""
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    Pop-Location
}
