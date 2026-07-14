# Interactive Client Setup Automation for Tea Jar ERP / Repair Management
# Run this script to spin up a fresh client instance with database creation and default seeds.

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "      Tea Jar ERP - Client Setup Wizard   " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Gather input from user
$companyName = Read-Host "Enter Company/Client Name (e.g., Tea Jar Ceylon)"
if (-not $companyName) { $companyName = "Main Branch" }

$dbName = Read-Host "Enter Database Name (default: tea_jar_erp_db)"
if (-not $dbName) { $dbName = "tea_jar_erp_db" }

$tenantSlug = Read-Host "Enter Tenant Slug (default: tea_jar_erp)"
if (-not $tenantSlug) { $tenantSlug = "tea_jar_erp" }

Write-Host "`nInitializing client '$companyName' setup..." -ForegroundColor Yellow

# 2. Update config/config.php
$configPath = ".\server\config\config.php"

if (Test-Path $configPath) {
    Write-Host "Updating config/config.php..." -ForegroundColor DarkGray
    $configContent = Get-Content $configPath -Raw
    
    # Replace DB_NAME
    $configContent = $configContent -replace "define\('DB_NAME',\s*'[^']+'\);", "define('DB_NAME', '$dbName');"
    # Replace TENANT_SLUG
    $configContent = $configContent -replace "define\('TENANT_SLUG',\s*'[^']+'\);", "define('TENANT_SLUG', '$tenantSlug');"
    
    Set-Content -Path $configPath -Value $configContent -Force
    Write-Host "Config file updated successfully." -ForegroundColor Green
} else {
    Write-Warning "config.php not found at $configPath. Skipping config update."
}

# 3. Database Creation and Seeding
Write-Host "Connecting to MySQL server to build '$dbName'..." -ForegroundColor DarkGray

$mysqlCmd = "mysql"
$mysqlArgsCreate = @("-u", "root", "-e", "CREATE DATABASE IF NOT EXISTS `$dbName`;")

# Check if mysql client exists
$mysqlCheck = Get-Command $mysqlCmd -ErrorAction SilentlyContinue
if ($mysqlCheck) {
    # Create DB
    & $mysqlCmd $mysqlArgsCreate
    Write-Host "Database '$dbName' created or verified." -ForegroundColor Green

    # Restore template
    $sqlPath = ".\server\clean_database_template.sql"
    if (Test-Path $sqlPath) {
        Write-Host "Restoring database schema and seeds from template..." -ForegroundColor DarkGray
        
        # We pipe the SQL content directly to mysql
        Get-Content $sqlPath | & $mysqlCmd -u root $dbName
        Write-Host "Base schema and seed dataset restored successfully." -ForegroundColor Green

        # Update Default Location Name and Company Name in database
        Write-Host "Configuring custom company and location details in database..." -ForegroundColor DarkGray
        $updateLocationQuery = "UPDATE service_locations SET name = '$companyName' WHERE id = 1;"
        $updateCompanyQuery = "UPDATE company SET name = '$companyName' WHERE id = 1;"
        
        & $mysqlCmd -u root -e "$updateLocationQuery $updateCompanyQuery" $dbName
        Write-Host "Default location & company renamed to '$companyName'." -ForegroundColor Green
    } else {
        Write-Warning "clean_database_template.sql not found at $sqlPath. Seed skipped."
    }
} else {
    Write-Warning "MySQL CLI ('mysql') was not found in your environment PATH. You will need to manually import 'server/clean_database_template.sql' into '$dbName' via phpMyAdmin."
}

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host "       Setup Completed Successfully!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Login details:" -ForegroundColor Cyan
Write-Host "URL:      http://localhost/tea-jar-erp/server/public" -ForegroundColor Yellow
Write-Host "Username: admin@local" -ForegroundColor Yellow
Write-Host "Password: admin123" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Green
