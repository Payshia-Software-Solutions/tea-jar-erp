# BizzFlow ERP / Repair Management: New Client Setup Guide

This guide describes how to initialize, configure, and sync a new client system (tenant instance) using the **`rapair-management`** repository as the upstream core template.

---

## 🛠️ Phase 1: Repository & Remote Setup

### Step 1: Create a private GitHub Repository
1. Log in to GitHub and navigate to the **`Payshia-Software-Solutions`** organization.
2. Create a new **Private** repository for the client:
   * **Repository Name:** `new-client-name` (e.g., `lanka-auto-mart`)
   * **Initialization:** Leave it empty (do **not** initialize with README, `.gitignore`, or license).

### Step 2: Clone the Core Codebase locally
1. Open terminal/command prompt and navigate to your local public web server folder (e.g., XAMPP htdocs):
   ```bash
   cd c:/xampp/htdocs
   ```
2. Clone the core upstream repository into a new folder named after the client:
   ```bash
   git clone https://github.com/Payshia-Software-Solutions/rapair-management.git new-client-name
   ```
3. Navigate into the newly created folder:
   ```bash
   cd new-client-name
   ```

### Step 3: Configure Git Remotes
To sync updates easily, the client repository needs two remotes:
- `origin`: The client's private GitHub repository.
- `core-origin`: The upstream core `rapair-management` template.

1. Rename the existing `origin` (which points to core) to `core-origin`:
   ```bash
   git remote rename origin core-origin
   ```
2. Add the client's private repository as `origin`:
   ```bash
   git remote add origin https://github.com/Payshia-Software-Solutions/new-client-name.git
   ```
3. Push the codebase to the client's repository:
   ```bash
   git push -u origin main
   ```

---

## 💾 Phase 2: Database Initialization

1. Open **XAMPP Control Panel** and ensure Apache and MySQL are running.
2. Open **phpMyAdmin** (`http://localhost/phpmyadmin`) or MySQL shell.
3. Create a new empty database for the client:
   * **Database Name:** `new_client_db` (e.g., `lanka_auto_mart_db`)
   * **Collation:** `utf8mb4_general_ci`
4. Import the schema database dump:
   * Select the new database, click **Import**, and select the database template file:
     `c:/xampp/htdocs/new-client-name/server/clean_database_template.sql`

---

## ⚙️ Phase 3: Server-side (Backend) Configuration

The database and environment configurations are stored in `server/config/config.php` which is gitignored to avoid leaking client secrets.

1. Create a folder named `config` inside `server/` if it doesn't exist (it should be present but empty).
2. Create/copy a config.php file inside `server/config/` and configure database connection and client metadata:
   ```php
   <?php
   /**
    * Configuration for the Repair Management Backend (Client Instance)
    */

   date_default_timezone_set('Asia/Colombo');

   define('APPROOT', dirname(dirname(__FILE__)));
   define('URLROOT', 'http://localhost/new-client-name/server');
   define('SITENAME', 'Repair Management API');

   // Database Connection Parameters
   define('DB_HOST', '127.0.0.1');
   define('DB_USER', 'root');
   define('DB_PASS', '');
   define('DB_NAME', 'new_client_db'); // Set your client database name

   // JWT Secret (Change this in production)
   define('JWT_SECRET', 'io3pq9L-FMfAWKpIygRtwXYoFCLyflGk-VbMF70r79buhnYini9azrlI_q_U7nO59ta24seDguike1Xygj5XYg');
   define('JWT_ISSUER', 'repair-management');
   define('JWT_TTL_SECONDS', 28800); // 8 hours

   // SaaS License & API configurations
   define('TENANT_SLUG', 'new_client_slug'); // Unique identifier for the client (e.g., lanka_auto_mart)
   define('NEXUS_LICENSE_KEY', 'RM-PAYSHIA-SOFTWARE-SOLUTIONS-XXXXX-XXXXX-XXXXX'); // Assign unique license key
   define('NEXUS_API_KEY', 'NX-XXXXXX...');
   define('NEXUS_PORTAL_URL', 'http://api-saas.nebulync.com');
   ```

---

## 💻 Phase 4: Client-side (Frontend) Configuration

1. Navigate to the `front-end` folder:
   ```bash
   cd front-end
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
4. Edit the `.env` file and set the API backend path pointing to the local client server public folder:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost/new-client-name/server/public
   NEXT_PUBLIC_CONTENT_BASE_URL=https://content-provider.payshia.com/service-center-system/
   ```
5. Run the frontend local development server:
   ```bash
   npm run dev
   ```
   *(This starts the dev server on port `9003`)*

---

## 🔄 Phase 5: Client Update & Sync Configuration (BizzFlow)

To include the new client in the automated core update-distribution pipeline:

1. Open the sync-clients.ps1 script in the core `rapair-management` repository folder.
2. Add the client's folder name to the `$clients` array (line 1):
   ```powershell
   $clients = @(
       "lanka-auto-mart",
       "linton-teas-system",
       "lanka-auto-prime",
       "nebulync-erp-office",
       "new-client-name" # Add the new client folder name here
   )
   ```
3. When updates are pushed to the core template repo, run the sync script to pull, auto-merge core changes, and push updates to the client repository:
   ```powershell
   powershell -File .\sync-clients.ps1
   ```
