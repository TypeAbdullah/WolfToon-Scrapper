<div align="center">

  # 🐺 WolfToon Scrapper

  **A High-Performance Korean Raw Manhwa Scraper & Batch Downloader with a Modern Vercel-Style Web UI**

  [![TypeScript](https://img.shields.io/badge/TypeScript-5.7-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
  [![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
  [![Vite](https://img.shields.io/badge/Vite-6.1-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
  [![License](https://img.shields.io/badge/License-MIT-white?style=for-the-badge)](LICENSE)

</div>

---

## 📖 Overview

**WolfToon Scrapper** is a full-stack Node.js + TypeScript web application designed to search, browse, view, and **batch download raw Korean manhwa chapters into ZIP archives** directly from **Wolf Toon (늑대닷컴 / `wfwf433.com`)**.

Built with a high-contrast **Vercel Black & White Glassmorphic UI**, this tool offers real-time SSE progress tracking, server-side image proxying to bypass hotlink protections, and instant direct URL parsing.

---

## ✨ Features

- 🐺 **Wolf Toon (늑대닷컴) Integration**: Specifically crafted for `wfwf433.com` and its raw manhwa repository.
- 📦 **Batch & Single Chapter ZIP Downloader**:
  - Download individual chapters as `.zip` archives.
  - Multi-select checkboxes or use **Range Selection** (e.g. select Ch. 1 to 50) to batch download multiple chapters simultaneously.
- 🔄 **EUC-KR Query Encoding**: Transparent conversion of Korean search terms (`해골병사`, `나`, `나 혼자만`) for accurate site search.
- 🔗 **Direct URL & Toon ID Parser**: Paste any WFWF link (e.g., `http://wfwf433.com/list?toon=75355` or `75355`) into the search bar for instant series loading.
- 🛡️ **Built-in Image Proxy**: Streams thumbnails and raw chapter images through `/api/proxy-image` with custom `Referer` and `User-Agent` headers to prevent broken image links.
- ⚡ **Real-Time Progress Streaming (SSE)**: Live progress bars, downloaded image counters, and status updates (Queued, Downloading, Zipping, Complete, Failed).
- 🎨 **Vercel Black & White Glassmorphism UI**: High-contrast monochrome aesthetic with responsive layouts and smooth micro-interactions.
- ⚙️ **Configurable Target Domain**: Update the base site URL (e.g. `https://wfwf434.com`) directly in Settings without restarting the app if domain mirrors change.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, TypeScript, Tailwind CSS, Lucide Icons |
| **Backend** | Express 4, Node.js, `tsx`, `iconv-lite`, `archiver` |
| **Communication** | REST API & Server-Sent Events (SSE) |
| **Packaging** | `archiver` ZIP streams |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm` or `pnpm`

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/TypeAbdullah/WolfToon-Scrapper.git
   cd WolfToon-Scrapper
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start Development Server:**
   ```bash
   npm run dev
   ```
   - Frontend UI: `http://localhost:3000`
   - Express Server: `http://localhost:3001`

---

## 🏗️ Production Build

```bash
# Build client & server
npm run build

# Start production server
npm start
```
The server will run on `http://localhost:3001` serving both the API and built static frontend.

---

## 📂 Project Structure

```
WolfToon-Scrapper/
├── src/
│   ├── client/                  # Vite + React Frontend
│   │   ├── components/          # Navbar, ManhwaCard, ManhwaGrid, DetailModal, DownloadManager, SettingsModal
│   │   ├── api.ts               # API fetch wrappers & SSE listener
│   │   ├── App.tsx              # Main layout & state
│   │   └── index.css            # Tailwind & Vercel Glassmorphism utility styles
│   ├── server/                  # Express Backend
│   │   ├── index.ts             # Express entry point
│   │   ├── scraper.ts           # EUC-KR scraper & HTML parser
│   │   ├── downloader.ts        # Image fetcher, ZIP queue & SSE broadcaster
│   │   ├── routes.ts            # API routes & Image proxy
│   │   └── config.ts            # Persistent settings manager
│   └── shared/                  # Shared TypeScript interfaces
├── downloads/                   # Output folder for downloaded ZIP archives
├── vercel.json                  # Vercel deployment configuration
└── package.json
```

---

## ⚠️ Disclaimer

This tool is created for educational and personal archival purposes only. Respect the copyright holders and official publishing platforms (such as Naver Webtoon, Kakao, Tapas, Webtoon).

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
