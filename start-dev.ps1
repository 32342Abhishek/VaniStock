$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend = Join-Path $root 'backend'
$frontend = Join-Path $root 'frontend'

if (-not (Get-Command py -ErrorAction SilentlyContinue)) {
	throw 'Python launcher (py) was not found. Install Python 3.10+ and try again.'
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
	throw 'npm was not found. Install Node.js 18+ and try again.'
}
if (-not (Test-Path (Join-Path $frontend 'node_modules'))) {
	Write-Host 'Frontend dependencies are missing. Run npm install in frontend first.' -ForegroundColor Yellow
}
$envPath = Join-Path $backend '.env'
$mongodbUri = $null
if (Test-Path $envPath) {
	$mongodbLine = Get-Content $envPath | Where-Object { $_ -match '^\s*MONGODB_URI\s*=' } | Select-Object -First 1
	if ($mongodbLine) {
		$mongodbUri = ($mongodbLine -split '=', 2)[1].Trim().Trim('"', "'")
	}
}

if ([string]::IsNullOrWhiteSpace($mongodbUri) -or $mongodbUri -match 'localhost|127\.0\.0\.1') {
	if (-not (Test-NetConnection -ComputerName localhost -Port 27017 -InformationLevel Quiet)) {
		Write-Host 'MongoDB is not reachable on localhost:27017. The API can start, but data operations will fail until MongoDB is running.' -ForegroundColor Yellow
	}
} else {
	Write-Host 'Using configured remote MongoDB connection; skipping localhost MongoDB check.' -ForegroundColor Green
}

Write-Host 'Starting VaaniStock backend...' -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backend'; py -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

Write-Host 'Starting VaaniStock frontend...' -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontend'; npm run dev"

Write-Host 'Development environment started.' -ForegroundColor Yellow
Write-Host 'Frontend: http://localhost:5173' -ForegroundColor Yellow
Write-Host 'Backend: http://localhost:8000' -ForegroundColor Yellow
