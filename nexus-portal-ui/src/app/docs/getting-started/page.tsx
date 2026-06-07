"use client";

import React, { useEffect } from "react";
import { useDocs } from "@/app/docs/layout";
import DocsHeader from "@/components/docs/DocsHeader";
import Callout from "@/components/docs/Callout";
import CodeBlock from "@/components/docs/CodeBlock";
import DocsPagination from "@/components/docs/DocsPagination";
import { motion } from "framer-motion";

export default function GettingStartedPage() {
  const { setTocItems } = useDocs();

  useEffect(() => {
    setTocItems([
      { id: "prerequisites", title: "Prerequisites", level: 2 },
      { id: "database", title: "Database Installation", level: 2 },
      { id: "backend", title: "Backend API Setup", level: 2 },
      { id: "frontend", title: "Frontend Client Setup", level: 2 },
    ]);
  }, [setTocItems]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      <DocsHeader
        title="Installation & Setup"
        description="Follow this walkthrough to get the backend server API, MySQL database, and Next.js portal running locally."
        badge="Getting Started"
        version="2.4.0"
      />

      {/* Prerequisites */}
      <section id="prerequisites" className="space-y-4">
        <h2 className="text-2xl font-bold text-strong">Prerequisites</h2>
        <p className="text-muted leading-relaxed font-medium">
          Make sure your system contains the following dependencies before proceeding:
        </p>
        <ul className="list-disc pl-6 text-muted text-sm space-y-2 font-medium">
          <li><strong>PHP Environment:</strong> PHP 8.1+ (via XAMPP, Laragon, or Docker) with `pdo_mysql`, `curl`, and `json` extensions active.</li>
          <li><strong>Database Server:</strong> MySQL 8.0 or MariaDB 10.4+.</li>
          <li><strong>Runtime Engines:</strong> Node.js v18.0+ and npm/yarn package manager.</li>
          <li><strong>Composer:</strong> Dependency manager for PHP (optional, depending on backend dependencies).</li>
        </ul>
      </section>

      {/* Database Setup */}
      <section id="database" className="space-y-4">
        <h2 className="text-2xl font-bold text-strong">Database Installation</h2>
        <p className="text-muted leading-relaxed font-medium">
          The database schema is located in `/server/database.sql`. Create a database and restore the SQL script.
        </p>
        <CodeBlock
          filename="Restore Terminal"
          language="bash"
          code={`# Create the database inside MySQL terminal
mysql -u root -p -e "CREATE DATABASE bizzflow_erp_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Import the database schema and seed data
mysql -u root -p bizzflow_erp_db < server/database.sql`}
        />
        <Callout type="tip" title="Default User Seeds">
          The base schema seeds a primary administrator account: User: `admin@bizzflow.com` | Password: `password123`.
        </Callout>
      </section>

      {/* Backend API Setup */}
      <section id="backend" className="space-y-4">
        <h2 className="text-2xl font-bold text-strong">Backend API Setup</h2>
        <p className="text-muted leading-relaxed font-medium">
          Configure the environment variables for your PHP server. Locate `/server/.env.example` and rename it to `/server/.env`.
        </p>
        <CodeBlock
          filename="server/.env"
          language="ini"
          code={`DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=bizzflow_erp_db
DB_USER=root
DB_PASS=secret_password

JWT_SECRET=super_secret_signing_key_here
API_URL=http://localhost:8080`}
        />
        <p className="text-muted leading-relaxed text-sm font-medium">
          You can serve the backend using XAMPP Virtual Hosts, or spin up the PHP built-in server inside the `/server` folder:
        </p>
        <CodeBlock
          filename="Backend Server Terminal"
          language="bash"
          code={`cd server
php -S localhost:8080 -t public/`}
        />
      </section>

      {/* Frontend Client Setup */}
      <section id="frontend" className="space-y-4">
        <h2 className="text-2xl font-bold text-strong">Frontend Client Setup</h2>
        <p className="text-muted leading-relaxed font-medium">
          Now spin up the Next.js application inside the `/nexus-portal-ui` directory.
        </p>
        <CodeBlock
          filename="Nexus UI Terminal"
          language="bash"
          code={`cd nexus-portal-ui
npm install
npm run dev`}
        />
        <Callout type="info" title="Dev Server Access">
          The terminal will launch the application on `http://localhost:3000`. Set the `NEXT_PUBLIC_API_URL` to match your local backend endpoint (`http://localhost:8080`).
        </Callout>
      </section>

      <DocsPagination
        prev={{ title: "Introduction & Architecture", href: "/docs" }}
        next={{ title: "RepairOS (ServiceBay)", href: "/docs/modules/repair-os" }}
      />
    </motion.div>
  );
}
