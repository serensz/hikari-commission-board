# ✨ Hikari's Commission Board

A professional, boutique-style client commission and progress tracking platform designed for account maintenance and boosting services. It features a secure private admin dashboard and a real-time public queue for clients to seamlessly track their orders.

## 🌟 Features

* **Public Tracking Gateway:** Clients can view a read-only queue, view service details, and search for their specific order status using a clean, modern landing page.
* **Private Admin Dashboard:** Full control over client orders, statuses, deadlines, and per-game task checklists.
* **Integrated Income Tracking:** Financials are automatically linked to client cards. Marking a job as "Done" instantly updates your paid/unpaid income ledger and calculates total revenue.
* **Live Synchronization:** Uses the GitHub Gist API to seamlessly sync the private admin state with the public-facing viewer—no traditional backend database required.
* **Boutique UI/UX:** A premium, human-centric design featuring a custom color palette, soft glass-morphism, responsive DOM filtering, and modern typography.
* **Supported Games:** Native tracking and icon support for *Wuthering Waves*, *Honkai: Star Rail*, *Zenless Zone Zero*, and *Arknights: Endfield*.

## 🚀 Local Development

1. Clone the repository and install dependencies:
```bash
   npm install
```
2. Create a .env file in the root directory so Vite can read your Gist ID locally:
```VITE_PUBLIC_GIST_ID=your_gist_id_here
```
3. Start the development server:
```npm run dev
```

🌐 Deployment (GitHub Pages)
This project is configured to automatically deploy to GitHub Pages using GitHub Actions.

1. Set Up Your Gist Secret
For the public queue to sync properly, GitHub Actions needs your Gist ID:

Go to your repository Settings → Secrets and variables → Actions.

Click New repository secret.

Name: VITE_PUBLIC_GIST_ID

Secret: Paste your 32-character Gist ID (e.g., 549aec6e7b6f789e789b8b247205fa32).

2. Enable GitHub Pages
Go to repository Settings → Pages.

Set the Source dropdown to GitHub Actions.

3. Deploy
Simply commit and push your code to the main branch.

The GitHub Action workflow will automatically build the Vite project, inject your secret ID, and publish the live site.

📁 Project Structure
/src — Contains all TypeScript logic, UI rendering, routing, and custom CSS.

/public — Contains static assets, game logos, and character hero banners.

/.github/workflows — Contains deploy.yml for CI/CD automation.

🛠️ Tech Stack
Frontend: Vanilla TypeScript + Vite

Styling: Custom CSS with CSS Variables

State Management: Browser localStorage (Admin) + GitHub Gist API (Public Sync)

Hosting: GitHub Pages