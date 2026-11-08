# Draco Animi

A personal 3D journal where your personal problems manifest as monumental floating monsters in a surreal void.

## Setup Instructions

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Copy the example environment file and provide your Gemini API key:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and set `GEMINI_API_KEY`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open the application**:
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## ⚠️ Important Data Storage Warning

All journal records, customized creature attributes, and bestiary entries are stored locally in your browser's `localStorage`. Browser storage can be cleared if cookies or site data are wiped. Please export backups regularly using the **Backup & Archive** feature in the top navigation to preserve your bestiary data.
