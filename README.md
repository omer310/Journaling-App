# Secure Personal Journal

A modern, secure journaling application with both web and mobile interfaces.

## Features

- 🔒 Secure authentication and data encryption
- 📱 Cross-platform support (Web & Mobile)
- 📝 Rich text editing with modern formatting tools
- 🎨 Customizable themes and layouts
- 💾 Automatic saving and offline support
- 📅 Calendar view for journal entries
- 🏷️ Tags and categories for organization
- 🔍 Full-text search capabilities

## Tech Stack

- Web: Next.js, React, Tailwind CSS
- Mobile: React Native, Native Base
- Backend: Firebase (Authentication & Firestore)
- Rich Text Editing: TinyMCE/Draft.js

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install web dependencies
   cd web
   npm install

   # Install mobile dependencies
   cd ../mobile
   npm install
   ```
3. Set up environment variables (see .env.example)
4. Run the development servers:
   ```bash
   # Web
   cd web
   npm run dev

   # Mobile
   cd ../mobile
   npm run start
   ```

## Security Features

- End-to-end encryption for journal entries
- Biometric authentication support on mobile
- Password-protected access
- Automatic logout on inactivity
- No third-party access to journal data 