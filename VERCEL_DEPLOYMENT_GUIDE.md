# Comprehensive Guide to Deploying Your Mobile Gallery App on Vercel

**Date: 2025-06-16**

## Introduction

This guide provides comprehensive, step-by-step instructions for deploying the mobile gallery application to Vercel. The application is built with Next.js, utilizes Prisma for database interaction with a PostgreSQL database, and integrates with Google Drive for image storage. This document covers prerequisites, project setup, database and Google Drive API configuration, Vercel deployment procedures, post-deployment checks, troubleshooting common issues, and best practices for a successful and maintainable deployment.

The primary technologies involved are:
*   **Next.js:** React framework for building the application.
*   **Prisma:** ORM for database access, configured for PostgreSQL.
*   **PostgreSQL:** Relational database for storing application metadata.
*   **Google Drive API:** Used for storing and retrieving image files.
*   **Vercel:** Platform for deploying and hosting the frontend and serverless functions.

Following this guide will help you configure your project correctly and launch it on Vercel efficiently.

## Prerequisites Checklist

Before starting the deployment process, ensure you have the following tools, accounts, and information ready:

*   **Node.js and npm:**
    *   Node.js (LTS version recommended, e.g., 18.x or 20.x).
    *   npm (comes bundled with Node.js).
*   **Git:**
    *   Git installed on your local machine.
    *   A Git repository hosted on GitHub, GitLab, or Bitbucket containing your application code.
*   **Vercel Account:**
    *   An active Vercel account. You can sign up at [vercel.com](https://vercel.com).
*   **PostgreSQL Database:**
    *   A publicly accessible PostgreSQL database.
    *   The full connection URL for the database (e.g., `postgresql://username:password@host:port/database`).
    *   Consider services like Vercel Postgres, Neon, Supabase, Aiven, or Amazon RDS.
*   **Google Cloud Platform (GCP):**
    *   A Google Cloud Platform account.
    *   A GCP Project created or selected for this application.
    *   The Google Drive API enabled within your GCP Project.
    *   A Service Account key (JSON file) with permissions to access Google Drive.
    *   The ID of the Google Drive folder where the application will store images.
*   **Application Source Code:**
    *   The mobile gallery app source code cloned to your local development environment.
*   **Familiarity:**
    *   Basic understanding of Next.js, Prisma, command-line interfaces, and Git version control.

## Local Project Preparation

Proper local setup ensures a smoother transition to Vercel.

### 1. Verify Project Structure
Ensure your project directory contains all necessary files and folders, including:
*   `package.json` (defines scripts and dependencies)
*   `next.config.js` (Next.js configuration)
*   `prisma/schema.prisma` (Prisma schema definition)
*   `vercel.json` (Vercel-specific configuration, if any)
*   Your Next.js application code (typically in `app/`, `pages/`, `components/`, `lib/`, etc.)

The provided `package.json` lists the following relevant scripts:
```json
"scripts": {
  "dev": "next dev --hostname 0.0.0.0",
  "build": "next build",
  "start": "next start --hostname 0.0.0.0",
  "lint": "next lint"
}
```
The `build` script (`next build`) is standard and will be used by Vercel.

### 2. Install Dependencies
Navigate to your project's root directory in your terminal and install the required Node.js packages:
```bash
npm install
```
This command installs all dependencies listed in `package.json` and `package-lock.json`.

### 3. Configure Local Environment Variables
For local development and testing, create a `.env.local` file in the root of your Next.js project (e.g., alongside `package.json`). This file should **not** be committed to Git (ensure it's in your `.gitignore` file).

Populate `.env.local` with the necessary variables based on the provided `.env.example`:
```env
DATABASE_URL="postgresql://your_local_db_user:your_local_db_password@localhost:5432/mobile_gallery_dev"

GOOGLE_DRIVE_CLIENT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_LOCAL_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_PROJECT_ID="your-google-cloud-project-id"
GOOGLE_DRIVE_FOLDER_ID="your-local-google-drive-folder-id"

NEXTAUTH_SECRET="a_strong_random_secret_for_local_development"
NEXTAUTH_URL="http://localhost:3000"

# PRISMA_GENERATE_DATAPROXY is typically not needed for local development unless testing proxy features
# PRISMA_GENERATE_DATAPROXY="true"
```
Replace placeholder values with your actual local development credentials.

### 4. Prisma Setup (Local)

Your `prisma/schema.prisma` file defines your database models and connection. The provided schema includes:
```prisma
generator client {
    provider = "prisma-client-js"
    // WARNING: The absolute path below is for a specific local environment.
    // Vercel will likely use a relative path or its own managed path for the client.
    // This may need adjustment or removal for Vercel compatibility if issues arise.
    // However, PRISMA_GENERATE_DATAPROXY=true in vercel.json often means Vercel handles this.
    output   = "/home/ubuntu/mobile-gallery-app/app/node_modules/.prisma/client"
    binaryTargets = ["native", "linux-musl-arm64-openssl-3.0.x"]
}

datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
}

// ... models Upload, Gallery
```

*   **Client Generation:** After installing dependencies, generate the Prisma Client:
    ```bash
    npx prisma generate
    ```
    The `binaryTargets` array in your `schema.prisma` includes `"linux-musl-arm64-openssl-3.0.x"`, which is essential for compatibility with Vercel's serverless environment.
    > **Warning:** The `output` path specified in `generator client` (`/home/ubuntu/mobile-gallery-app/app/node_modules/.prisma/client`) is an absolute path tied to a specific local environment. This is highly unlikely to work correctly on Vercel's build servers. Vercel typically expects the Prisma Client to be generated in the standard `node_modules/.prisma/client` relative to your `package.json`. The presence of `PRISMA_GENERATE_DATAPROXY="true"` in your `vercel.json` and build environment variables suggests Vercel will manage the Prisma Client generation for its Data Proxy, potentially overriding this custom output path. If build issues related to Prisma Client occur, consider removing this `output` line from `schema.prisma` to use the default relative path.

*   **Database Migration (Local):** To set up your local database schema:
    *   If you are starting fresh or want to synchronize your schema without creating migration files (suitable for development):
        ```bash
        npx prisma db push
        ```
    *   If you prefer using migration files (recommended for tracking schema changes):
        ```bash
        npx prisma migrate dev --name initial_setup
        ```
    Ensure your local `DATABASE_URL` in `.env.local` points to your development PostgreSQL database.

### 5. Test Locally
Before deploying, test your application thoroughly in your local environment:
*   Run the development server:
    ```bash
    npm run dev
    ```
    Access the app at `http://localhost:3000` (or as configured).
*   Create a production build locally to catch build errors:
    ```bash
    npm run build
    ```
    This command uses `next build` as specified in your `package.json`.

### 6. Git Configuration
*   **Initialize Git:** If your project isn't already a Git repository:
    ```bash
    git init
    ```
*   **`.gitignore`:** Ensure your `.gitignore` file is comprehensive. The provided `.gitignore` content is a good starting point, correctly ignoring `node_modules/`, `.env*` files (except `.env.example`), build outputs like `.next/`, and Prisma migration folders.
*   **Commit Files:** Add and commit all your project files:
    ```bash
    git add .
    git commit -m "Prepare for Vercel deployment"
    ```
*   **Push to Remote:** Push your code to a remote repository on GitHub, GitLab, or Bitbucket. Vercel will connect to this repository.
    ```bash
    git remote add origin <your-remote-repository-url>
    git push -u origin main # or your default branch name
    ```

## Setting up the PostgreSQL Database

Your application requires a PostgreSQL database. For Vercel deployments, a cloud-hosted, publicly accessible PostgreSQL instance is necessary.

*   **Choose a Provider:** Options include:
    *   **Vercel Postgres:** Integrates seamlessly with Vercel projects.
    *   **Neon:** Serverless Postgres, offers a generous free tier.
    *   **Supabase:** Provides Postgres along with other backend services.
    *   **Aiven for PostgreSQL:** Managed PostgreSQL service.
    *   **Amazon RDS for PostgreSQL, Google Cloud SQL for PostgreSQL, Azure Database for PostgreSQL.**
*   **Create Database:** Follow your chosen provider's instructions to create a new PostgreSQL database instance.
*   **Obtain Connection URL:** Once created, get the database connection URL. It typically looks like:
    `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`
    Keep this URL secure; you'll add it to Vercel's environment variables.
*   **Network Accessibility:** Ensure your database is configured to accept connections from Vercel's IP addresses. Some managed services handle this automatically or provide options for allowing connections from any IP (0.0.0.0/0), which should be secured with strong credentials and SSL. If using Vercel Postgres, this is handled automatically.

## Configuring Google Drive API Access

The application uses Google Drive to store images. This requires setting up a Google Cloud Platform project and a Service Account.

1.  **Navigate to Google Cloud Console:** Go to [console.cloud.google.com](https://console.cloud.google.com).
2.  **Create or Select a GCP Project:**
    *   If you don't have one, create a new project.
    *   Otherwise, select the existing project you want to use. Note the **Project ID**.
3.  **Enable Google Drive API:**
    *   In the navigation menu, go to "APIs & Services" -> "Library".
    *   Search for "Google Drive API" and enable it for your project.
4.  **Create a Service Account:**
    *   Go to "APIs & Services" -> "Credentials".
    *   Click "+ CREATE CREDENTIALS" and select "Service account".
    *   Fill in the service account details (name, ID, description).
    *   Grant this service account access to the project. For Google Drive API usage, specific roles related to Drive might not be directly assigned here but through folder sharing. A general role like "Editor" on the project might be too broad; typically, no project-level role is strictly needed for Drive API if the service account is directly granted access to Drive resources. However, if other Google Cloud services are used by this service account, assign roles accordingly.
    *   Click "Done".
5.  **Generate a Service Account Key:**
    *   Find your newly created service account in the "Credentials" list.
    *   Click on the service account email.
    *   Go to the "KEYS" tab.
    *   Click "ADD KEY" -> "Create new key".
    *   Select "JSON" as the key type and click "CREATE".
    *   A JSON file containing the credentials will be downloaded. **Store this file securely.** You will need its contents:
        *   `client_email`: The service account's email address.
        *   `private_key`: The private key.
        *   `project_id`: Your GCP project ID (though you should already have this).
6.  **Share Google Drive Folder:**
    *   Create a new folder in your Google Drive (or use an existing one) where the application will store images.
    *   Get the **Folder ID** from the folder's URL in Google Drive. (e.g., if URL is `https://drive.google.com/drive/folders/ABCDE12345`, the ID is `ABCDE12345`).
    *   Right-click the folder, select "Share".
    *   In the "Add people and groups" field, paste the `client_email` of your service account (from the JSON key file).
    *   Grant the service account "Editor" permissions for this folder.
    *   Click "Send" or "Share".

## Deploying to Vercel

With your project prepared and external services configured, you can now deploy to Vercel.

### 1. Import Project in Vercel
*   Log in to your Vercel account.
*   On your dashboard, click "Add New..." and select "Project".
*   Choose "Continue with Git" and select the Git provider where your repository is hosted (GitHub, GitLab, or Bitbucket).
*   Import the Git repository for your mobile gallery app. Vercel may ask for permissions to access your repositories.

### 2. Configure Project Settings
Vercel will attempt to auto-detect your project settings.

*   **Framework Preset:** This should be automatically detected as "Next.js".
*   **Build and Output Settings:**
    *   **Build Command:** Vercel typically infers `npm run build` or `next build`. Your `vercel.json` file specifies `"buildCommand": "npm run build"`, which Vercel will use.
        ```json
        // vercel.json
        {
          "buildCommand": "npm run build",
          "framework": "nextjs",
          // ... other settings
        }
        ```
    *   **Output Directory:** This will be `.next` for Next.js projects, which Vercel handles automatically.
    *   **Install Command:** Vercel uses `npm install` by default if a `package-lock.json` is present, or `yarn install` if `yarn.lock` is present.
*   **Root Directory:** If your Next.js app (containing `package.json`, `next.config.js`) is in a subdirectory of your Git repository (e.g., `app/`), adjust the "Root Directory" setting in Vercel accordingly. Based on the `outputFileTracingRoot: path.join(__dirname, '../')` in `next.config.js` and `app/api/` in `vercel.json`, it's possible your Next.js project is in an `app/` subdirectory of the Git root. If so, set Vercel's Root Directory to `app`. If `package.json` is at the Git root, then the Root Directory setting can be left as default.

### 3. Configure Environment Variables
This is a critical step. Navigate to your Vercel Project -> Settings -> Environment Variables. Add the following variables:

*   `DATABASE_URL`: The connection string for your production PostgreSQL database.
    *   Example: `postgresql://prod_user:prod_password@prod_host:port/prod_database`
*   `GOOGLE_DRIVE_CLIENT_EMAIL`: The `client_email` from your downloaded service account JSON file.
*   `GOOGLE_DRIVE_PRIVATE_KEY`: The `private_key` from your service account JSON file.
    *   > **Important:** Copy the entire private key string, including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`, and ensure all newline characters (`\n`) are preserved. Vercel's UI for environment variables handles multi-line values correctly when pasted.
*   `GOOGLE_DRIVE_PROJECT_ID`: Your Google Cloud Project ID.
*   `GOOGLE_DRIVE_FOLDER_ID`: The ID of the Google Drive folder you shared with the service account.
*   `NEXTAUTH_SECRET`: A strong, random secret string used by NextAuth.js for signing tokens. Generate one using a command like `openssl rand -hex 32` or an online generator.
*   `NEXTAUTH_URL`: The canonical URL of your deployed application. Vercel automatically provides a system environment variable `VERCEL_URL` (e.g., `my-project.vercel.app`) which can often be used. If you set up a custom domain later, you might want to update this to your custom domain URL (e.g., `https://www.yourdomain.com`). For initial deployment, you can often omit this and let NextAuth.js infer it, or set it to `https://<your-project-name>.vercel.app`.
*   `PRISMA_GENERATE_DATAPROXY`: Set this to `true`. Your `vercel.json` already includes this in the `env` and `build.env` sections, which is good practice. This instructs Prisma to generate a client tailored for use with Prisma Data Proxy or Vercel Postgres integration.
    ```json
    // vercel.json snippet for reference
    "env": {
      "PRISMA_GENERATE_DATAPROXY": "true"
    },
    "build": {
      "env": {
        "PRISMA_GENERATE_DATAPROXY": "true"
      }
    }
    ```

Ensure you select the appropriate environments (Production, Preview, Development) for each variable. Sensitive credentials like `DATABASE_URL` and `GOOGLE_DRIVE_PRIVATE_KEY` should typically be set for Production and Preview environments.

### 4. Trigger Deployment
*   After configuring settings and environment variables, click the "Deploy" button.
*   Vercel will clone your repository, install dependencies, run the build command (`npm run build`), and deploy your application.
*   You can monitor the build and deployment process in real-time from the Vercel dashboard (Project -> Deployments -> Logs).

## Prisma Schema Migrations on Vercel

Vercel's build process, especially with `PRISMA_GENERATE_DATAPROXY="true"`, will automatically run `prisma generate` to prepare the Prisma Client. However, **database schema migrations (e.g., `prisma migrate deploy`) are not run automatically by Vercel by default.** You need a strategy to apply schema changes to your production database.

**Options for Handling Migrations:**

1.  **Manual Migration (Recommended for Simplicity):**
    *   Connect to your production PostgreSQL database directly using a database tool (like `psql`, pgAdmin, DBeaver) or from your local machine.
    *   Set the `DATABASE_URL` environment variable in your local terminal to point to your *production* database temporarily.
        ```bash
        export DATABASE_URL="your_production_database_url" 
        # For Windows PowerShell: $env:DATABASE_URL="your_production_database_url"
        ```
    *   Run the deploy migrations command from your local project directory:
        ```bash
        npx prisma migrate deploy
        ```
    *   Unset the `DATABASE_URL` or set it back to your local development database URL afterwards.
    *   This approach gives you direct control over when migrations are applied.

2.  **Custom Build Script (Use with Caution):**
    *   Modify your `build` script in `package.json` to include the migration command:
        ```json
        // package.json
        "scripts": {
          "build": "npx prisma migrate deploy && next build"
          // other scripts...
        }
        ```
    *   > **Warning:** This approach runs migrations on every build. If a migration fails, the build will fail. It can also increase build times. Ensure the database user specified in `DATABASE_URL` has permissions to alter the schema. This is generally less safe than manual application for production environments.

3.  **CI/CD Pipeline Integration:**
    *   For more complex setups, integrate migration deployment as a separate step in a CI/CD pipeline (e.g., GitHub Actions) that runs before or after the Vercel deployment.

For most use cases, applying migrations manually (Option 1) before or after a deployment that includes schema changes is the safest and most controlled method.

## Post-Deployment Checks and Configuration

Once Vercel indicates a successful deployment:

1.  **Verify Deployment:**
    *   Access your application using the Vercel-provided domain (e.g., `your-project-name.vercel.app`). This domain is visible on your Vercel project dashboard.
2.  **Test Core Functionality:**
    *   Thoroughly test all features of your mobile gallery app:
        *   User authentication (if applicable, via NextAuth.js).
        *   Image uploads to Google Drive.
        *   Gallery creation and management.
        *   Image display and retrieval.
        *   Any other specific features of your application.
3.  **Check Vercel Logs:**
    *   Review runtime logs in Vercel (Project -> Logs) for any errors or unexpected behavior. Filter by functions or time to pinpoint issues.
4.  **Custom Domain (Optional):**
    *   If you have a custom domain, configure it in Vercel:
        *   Go to your Vercel Project -> Settings -> Domains.
        *   Add your custom domain and follow Vercel's instructions to update your DNS records (usually CNAME or A records).
    *   If you set a custom domain, ensure your `NEXTAUTH_URL` environment variable in Vercel is updated to reflect this new canonical URL (e.g., `https://www.yourcustomdomain.com`), unless you are relying on dynamic detection or `VERCEL_URL`.

## Troubleshooting Common Issues

Encountering issues during deployment is common. Here are some potential problems and their solutions:

*   **Build Failures:**
    *   **Check Logs:** The Vercel build logs are your primary source for diagnosing build failures. Look for specific error messages.
    *   **Node.js Version:** Ensure the Node.js version used by Vercel (configurable in Project Settings -> General -> Node.js Version) is compatible with your project and its dependencies.
    *   **Dependencies:** Verify all dependencies are correctly listed in `package.json`. Missing or conflicting dependencies can cause builds to fail.
    *   **Type Errors:** Your `next.config.js` has `typescript: { ignoreBuildErrors: false }`. This means TypeScript errors will fail the build. Ensure your code is type-safe.
    *   **Prisma Client Path:** As noted earlier, the absolute `output` path in `schema.prisma` could be an issue. If Prisma-related errors occur during build, try removing that line to let Prisma use its default relative path. `PRISMA_GENERATE_DATAPROXY="true"` should ensure Vercel handles client generation correctly for its environment.

*   **Database Connection Errors:**
    *   **Verify `DATABASE_URL`:** Double-check that the `DATABASE_URL` environment variable in Vercel is accurate and complete.
    *   **Firewall/IP Whitelisting:** Ensure your PostgreSQL database server allows connections from Vercel. If your database provider requires IP whitelisting, you may need to add Vercel's egress IP addresses. (Vercel Postgres handles this automatically).
    *   **SSL Configuration:** Some databases require specific SSL parameters in the connection string (e.g., `?sslmode=require`). Ensure your `DATABASE_URL` includes these if necessary.

*   **Google Drive API Errors:**
    *   **Credentials:** Confirm that `GOOGLE_DRIVE_CLIENT_EMAIL`, `GOOGLE_DRIVE_PRIVATE_KEY`, `GOOGLE_DRIVE_PROJECT_ID`, and `GOOGLE_DRIVE_FOLDER_ID` are correctly set in Vercel environment variables.
    *   **API Enabled:** Ensure the Google Drive API is enabled in your GCP project.
    *   **Permissions:** Verify that the service account (`GOOGLE_DRIVE_CLIENT_EMAIL`) has "Editor" permissions on the specified `GOOGLE_DRIVE_FOLDER_ID` in Google Drive.
    *   **Private Key Format:** Ensure the `GOOGLE_DRIVE_PRIVATE_KEY` is pasted correctly in Vercel, including the header/footer and newlines.

*   **Environment Variable Issues:**
    *   **Propagation:** Changes to environment variables in Vercel require a new deployment (redeploy an existing deployment or push a new commit) to take effect.
    *   **Scope:** Ensure variables are available in the correct environments (Production, Preview, Development).

*   **Function Timeouts (API Routes):**
    *   Your `vercel.json` specifies ` "functions": { "app/api/**/*.ts": { "maxDuration": 30 } }`, setting a 30-second timeout for API routes.
    *   If operations like large file uploads take longer, they might time out.
    *   Vercel's maximum timeout duration depends on your plan (Hobby plan has shorter limits than Pro). Check Vercel's documentation for current limits.
    *   For very long-running tasks, consider background jobs or optimizing the operation.

*   **Image Display Issues:**
    *   Your `next.config.js` includes `images: { unoptimized: true }`. This disables Next.js Image Optimization, meaning images are served directly from the URLs provided by your application (likely Google Drive direct links or proxied links).
    *   Ensure the `driveUrl` and `thumbnailUrl` fields in your `Upload` model point to publicly accessible URLs or that your application correctly proxies access to these images if they are not public.
    *   Check Google Drive file sharing settings if direct links are used.

## Best Practices for Vercel Deployment

*   **Vercel CLI:** Install and use the Vercel CLI (`npm install -g vercel`) for local development that mimics the Vercel environment (`vercel dev`), managing projects, and triggering deployments.
*   **Environment Scopes:** Utilize Vercel's Production, Preview, and Development scopes for environment variables to manage configurations for different stages.
*   **Atomic and Immutable Deployments:** Leverage Vercel's deployment model. Each push creates a new immutable deployment, allowing easy rollbacks.
*   **Monitoring and Logging:** Regularly check Vercel's analytics and logs. Consider integrating third-party logging or monitoring services for more in-depth insights.
*   **Security:**
    *   Keep all secrets (API keys, database URLs, `NEXTAUTH_SECRET`) secure and only in environment variables.
    *   Regularly review permissions for your Google Drive service account and folder sharing.
    *   Implement security best practices in your Next.js application (input validation, XSS protection, CSRF protection if applicable).
*   **Cost Management:** Be aware of Vercel's pricing model for bandwidth, function invocations, build minutes, etc., especially as your application scales. Disabling Next.js image optimization (`images: { unoptimized: true }`) avoids Vercel's image optimization costs but may increase bandwidth usage if images are large.
*   **Dependency Updates:** Regularly update Next.js, Prisma, and other dependencies to their latest stable versions to benefit from performance improvements, new features, and security patches. Use tools like `npm outdated` and `npm update`.
*   **Data Backups:** Implement a backup strategy for your PostgreSQL database and critical data in Google Drive.

## Conclusion

Deploying your mobile gallery application to Vercel involves careful preparation of your project, configuration of external services like PostgreSQL and Google Drive API, and proper setup within the Vercel platform. By following the steps outlined in this guide, addressing prerequisites, and understanding how Vercel handles Next.js projects with Prisma, you can achieve a successful deployment. Remember to test thoroughly post-deployment and adhere to best practices for a robust and maintainable application.

Should you encounter issues not covered here, Vercel's documentation and community forums, along with Prisma and Next.js documentation, are valuable resources.

---
*Disclaimer: This guide is based on the project information and common deployment practices as of the date specified. Vercel, Google Cloud, and other services may update their interfaces or features, potentially requiring adjustments to these steps.*