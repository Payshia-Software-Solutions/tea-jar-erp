# BizzFlow ERP / ServiceBay Documentation

Welcome to the **BizzFlow ERP & ServiceBay Operating System** documentation, powered by Nebulync software. This system is a multi-tenant enterprise resource planning (ERP) platform designed for modern repair workshops, retail stores, hotels, restaurant banquets, and logistics environments.

---

## 🌟 Introduction

BizzFlow ERP, powered by Nebulync software, provides a unified core to eliminate data silos across your business. By combining inventory, POS, HRM, accounting, and specialized modules like RepairOS and Banquet management, the system ensures real-time updates and full compliance.

### Core Ecosystem Modules

1. **RepairOS Lifecycle (ServiceBay)**: Advanced vehicle repair tracking, bay assignment, technician queues, and repair status monitoring.
2. **Hyper-Fast POS**: Touch-optimized checkout system with multi-method payment support (Cash, Card, Bank Transfer, Cheque) and day-end ledgers.
3. **Inventory Intelligence**: Real-time batch-level tracking, reorder thresholds, supplier management, and GRNs.
4. **BizzFlow HRM**: Comprehensive employee directory, attendance tracking, leave applications, and automated payroll systems.
5. **Enterprise Finance**: Balanced double-entry accounting engine with automated tax logs, journal postings, and P&L.
6. **Banquet & Front-Office**: Reservation tracking, kitchen order ticketing (KOT), banquet hall bookings, and steward assignments.

---

## 🚀 Getting Started (Beginner Guide)

Follow these steps to set up and run your local environment.

### Prerequisites
Make sure you have the following installed on your system:
- **XAMPP / Laragon** (Apache, MySQL, and PHP 8.0+)
- **Node.js** (v18.0 or later) & npm
- **Git** (for version control)

---

### 📦 Local Setup Steps

#### Step 1: Clone the Repository
Clone this repository to your web server's public folder (e.g., `C:\xampp\htdocs\rapair-management`).

#### Step 2: Database Configuration
1. Open XAMPP and start the **Apache** and **MySQL** services.
2. Create a new database named `repair_management_db` in phpMyAdmin.
3. Import the base schema from `server/database.sql` or `server/clean_database_template.sql`.
4. Configure database credentials in `server/app/config/config.php` (set DB_HOST, DB_USER, DB_PASS, DB_NAME).

#### Step 3: Run the Server Backend (PHP)
The backend runs on Apache. Ensure your virtual host or local path is pointing correctly (e.g. `http://localhost/rapair-management/server/public/`).

#### Step 4: Run the ERP Frontend (React/Next.js)
1. Open terminal and navigate to the frontend directory:
   ```bash
   cd front-end
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and verify the backend URL points to your server:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost/rapair-management/server
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Step 5: Run the BizzFlow Portal UI (Tenant Control Panel)
1. Navigate to the portal UI directory:
   ```bash
   cd ../nexus-portal-ui
   ```
2. Install dependencies and start the portal dev server:
   ```bash
   npm install
   npm run dev
   ```
3. Open [http://localhost:3001](http://localhost:3001) to view the client-facing Portal UI.

---

## 🛠️ Module Documentation Directory

As we document each module, you can access the guides here:
- **[RepairOS User Guide](file:///c:/xampp/htdocs/rapair-management/front-end/docs/repair-os/overview.md)** (Next module)
- **[POS User Guide](file:///c:/xampp/htdocs/rapair-management/front-end/docs/pos/overview.md)**
- **[Inventory Guide](file:///c:/xampp/htdocs/rapair-management/front-end/docs/inventory/overview.md)**
- **[Accounting Guide](file:///c:/xampp/htdocs/rapair-management/front-end/docs/accounting/overview.md)**
