# Repair Management System

Welcome to the Repair Management repository. This project is a monorepo containing several related services and user interfaces for the repair management ecosystem.

## Project Structure

* **`front-end/`**: The primary user interface application.
* **`server/`**: The main backend service and API.
* **`nexus-portal-ui/`**: User interface for the Nexus Portal.
* **`nexus-portal-server/`**: Backend service for the Nexus Portal.
* **`portal-landing/`**: The landing page for the application.
* **`local-printer/` & `local-printer-py/`**: Services and scripts for handling local printing functionality.

## Getting Started

Please refer to the individual directories for specific instructions on how to install dependencies, run development servers, and build the respective components.

## Client Deployment & Sync Strategy (BizzFlow)

The `rapair-management` repository acts as the **Core / Upstream Template** for all client installations. Individual clients (e.g., `lanka-auto-mart`, `linton-teas-system`, `lanka-auto-prime`) are isolated in their own repositories but receive feature updates from this core repo.

### How to Sync Updates to Clients

When a new feature or bug fix is pushed to the core `rapair-management` repository, follow these steps to deploy the update to a specific client:

1. **Ensure Core is Updated:**
   Make sure all changes in `rapair-management` are committed and pushed to the `main` branch on GitHub.

2. **Navigate to the Client Directory:**
   ```bash
   cd c:/xampp/htdocs/lanka-auto-mart
   ```

3. **Verify Git Remotes:**
   The client repository should have two remotes configured:
   - `origin`: The client's private GitHub repository.
   - `core-origin`: The upstream public `rapair-management` core repository.
   
   *(If `core-origin` is missing, add it via: `git remote add core-origin https://github.com/Payshia-Software-Solutions/rapair-management.git`)*

4. **Pull and Merge the Core Updates:**
   Fetch the latest code from the core and merge it into the client's local branch:
   ```bash
   git fetch core-origin
   git merge core-origin/main
   ```

5. **Resolve Conflicts & Push:**
   - If Git flags any merge conflicts (usually regarding client-specific logos, `.env` database passwords, or branding), **keep the client's specific versions**.
   - After resolving any conflicts, push the synchronized code to the client's repository:
   ```bash
   git push origin main
   ```
   
Repeat steps 2-5 for all other active clients.
