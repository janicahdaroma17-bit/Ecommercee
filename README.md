# Ecommerce Backend + Admin

This project adds a simple Node/Express backend with MongoDB (Mongoose) and an admin UI for managing products.

Features
- Products CRUD (MongoDB)
- Orders stored in MongoDB
- Simple user registration endpoint
- Admin UI (`admin.html`) uses `x-admin-key` header to authenticate admin actions

Required environment variables
- `MONGODB_URI` - Your MongoDB connection string
- `ADMIN_KEY` - Secret key used by admin UI (`x-admin-key` header)
- `PORT` - (optional) Port to run the server

Quick local run

1. Copy `.env.example` to `.env` and set your values.
2. Install dependencies:

```powershell
npm install
```

3. Start the server:

```powershell
npm start
```

Open `admin.html` in your browser to manage products (enter the `ADMIN_KEY`).

Deploying to Render

1. Create a new Web Service on Render and connect the repository.
2. Set the build command to `npm install` and the start command to `npm start`.
3. Add the environment variables in Render: `MONGODB_URI`, `ADMIN_KEY`, `PORT`.

Notes
- The admin UI sends the admin key in the `x-admin-key` header; keep the key secret.
- The storefront (`index.html`) attempts to fetch products from the backend at `http://localhost:3000/products` when running locally; when deployed, update the client base URL to your backend URL or place client and server behind the same origin.

**Storing your MongoDB URI securely (recommended)**

- Your MongoDB server (you provided) looks like:
	`mongodb+srv://janicah123:<db_password>@cluster0.rcm3enx.mongodb.net/`

- DO NOT commit your real password into the repository. Instead use one of these secure options:
	- Add `MONGODB_URI` to your Render environment variables (or any host) with the full URI including password.
	- Add `MONGODB_URI` as a GitHub Repository Secret and use it in GitHub Actions or CI. Name the secret `MONGODB_URI`.

**How to add `MONGODB_URI` as a GitHub repository secret**

1. Go to your repository on GitHub: `https://github.com/janicahdaroma17-bit/Ecommerce`.
2. Click `Settings` -> `Secrets and variables` -> `Actions` -> `New repository secret`.
3. For `Name` enter: `MONGODB_URI`.
4. For `Value` paste your full connection string, e.g.:

```
mongodb+srv://janicah123:YOUR_REAL_PASSWORD@cluster0.rcm3enx.mongodb.net/ecommer?retryWrites=true&w=majority
```

5. Save the secret. Your workflows and deployment can now read the secret without exposing it in the code.

**If you want to push this repo to GitHub (commands)**

Run these in PowerShell from the project root (replace the remote URL if different):

```powershell
git init
git add .
git commit -m "Initial commit with backend and admin UI"
git remote add origin https://github.com/janicahdaroma17-bit/Ecommerce.git
git branch -M main
git push -u origin main
```

**Create a local `.env` (only on your machine)**

1. Create a file named `.env` in the project root.
2. Add the real connection string using the `MONGODB_URI` variable. Example:

```
MONGODB_URI=mongodb+srv://janicah123:YOUR_REAL_PASSWORD@cluster0.rcm3enx.mongodb.net/ecommer?retryWrites=true&w=majority
ADMIN_KEY=your_admin_key_here
PORT=3000
```

3. Make sure `.gitignore` contains `.env` (this project includes it), so you don't accidentally commit credentials.

If you want, I can help create a GitHub Actions workflow to deploy to Render and read the `MONGODB_URI` secret, or I can help push your local repository to GitHub if you provide permission or run the commands locally and tell me what happened.
