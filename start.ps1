# start.ps1
# Lance le backend et le frontend de Green-Stock simultanement

Write-Host "Demarrage de Green-Stock..." -ForegroundColor Green
Write-Host ""

# Demarrer le backend dans une nouvelle fenetre
Write-Host "Lancement du serveur backend (port 3000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start"

# Attendre 2 secondes
Start-Sleep -Seconds 2

# Demarrer le frontend dans une nouvelle fenetre
Write-Host "Lancement du serveur frontend (port 5173)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client; npm run dev"

# Attendre 3 secondes
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "Application en cours de demarrage !" -ForegroundColor Green
Write-Host "Accedez a : http://localhost:5173" -ForegroundColor Yellow
Write-Host ""