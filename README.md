# Serene Structure 🌸

A minimal, calming, and neurodivergent-friendly life organizer designed with custom routines, visual time blocking, and an AI Life Coach helper.

---

## 🚀 Deployment to GitHub Pages (Static Frontend)

Browsers cannot run raw TypeScript/Vite files (`.tsx`) directly from the source repository. To host the frontend of this application on **GitHub Pages**, it must be compiled into standard HTML, CSS, and JavaScript.

We have included an **Automatic GitHub Actions Workflow** (`.github/workflows/deploy.yml`) that builds and deploys your site whenever you push code.

### 📋 Steps to Make It Work on GitHub Pages:

#### 1. Enable Workflow Permissions on GitHub
To allow the GitHub Action to push the built site to your repository:
1. Go to your GitHub repository in your web browser.
2. Click **Settings** (top bar) > **Actions** (left sidebar) > **General**.
3. Scroll down to **Workflow permissions**.
4. Select **Read and write permissions**.
5. Click **Save**.

#### 2. Push Your Code to GitHub
Push your latest changes to the `main` or `master` branch on GitHub:
```bash
git add .
git commit -m "Deploy Serene Structure"
git push origin main
```

#### 3. Enable GitHub Pages in Repository Settings
Once the GitHub Action run completes in the **Actions** tab:
1. Go to **Settings** > **Pages** (left sidebar).
2. Under **Build and deployment** > **Source**, select **Deploy from a branch**.
3. Under **Branch**, select `gh-pages` and `/ (root)`.
4. Click **Save**.
5. Your live app URL will appear at `https://<your-username>.github.io/<your-repo-name>/`.

---

## 🔑 AI Features on GitHub Pages (`VITE_GEMINI_API_KEY`)

When hosted statically on GitHub Pages, the backend Express server (`server.ts`) is not active. The app handles this gracefully! To use AI features (like the **AI Life Coach**) on GitHub Pages:

1. Add your Gemini API key as a Repository Secret or Environment Variable in GitHub:
   - Go to **Settings** > **Secrets and variables** > **Actions**.
   - Add a new secret named `VITE_GEMINI_API_KEY`.
2. Or pass it in your `.env` when building locally.

---

## 💻 Local Development

Run the full-stack application locally with the Express backend server and live Vite development environment:

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file at the root:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Start Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

### 4. Production Build & Start
```bash
npm run build
npm run start
```

---

## 🛠️ Full-Stack Hosting (Render, Railway, Fly.io, Cloud Run)

To deploy both the frontend AND the Express backend server online:
- **Render / Railway / Fly.io / Cloud Run**: Connect your GitHub repository, set the Build Command to `npm run build`, set the Start Command to `npm start`, and set `GEMINI_API_KEY` in environment variables.

