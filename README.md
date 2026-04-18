# VitalCare AI - Nursing Documentation & EWS Prototype

This is a professional full-stack prototype of an AI-powered nursing documentation and early warning system (EWS), designed as an educational nursing graduation project.

## Key Features

- **Dashboard**: Unified view of admitted patients with real-time status and risk flags.
- **Monitoring**: Live feed simulation of vital signs with automatic documentation at set intervals.
- **AI Alert Engine**: Intelligent analysis of vital trends to flag potential clinical concerns (Sepsis, Fever, Tachycardia).
- **Sepsis Screening**: Automated SIRS criteria check and suggested immediate clinical actions.
- **AI Note Assistant**: Drafts professional nursing notes using Gemini AI, allowing for nurse review, editing, and final approval.
- **Fluid Management**: Intake and Output tracking with automatic balance calculation and visual trends.
- **Audit Trail**: Complete log of system activity, including AI suggestions and manual documented edits.

## Tech Stack

- **Frontend**: React 18, Tailwind CSS, Recharts, Lucide Icons, Framer Motion.
- **Backend**: Node.js, Express.
- **Database**: SQLite (better-sqlite3) for persistent demo storage.
- **AI**: Google Gemini API (via @google/genai).

## Safety Disclaimer

**THIS IS A PROTOTYPE ONLY.** 
This system is for educational and demonstrative purposes. It is not a certified medical device and should not be used in real clinical environments. AI-generated suggestions are strictly supportive and must be reviewed and approved by licensed medical professionals.

## Getting Started

1. The application starts automatically in this environment.
2. Use the following demo accounts to explore the system:
   - **Nurse**: `nurse1` / `password`
   - **Charge Nurse**: `charge1` / `password`
   - **Admin**: `admin1` / `password`

## Project Structure

- `server.ts`: Full-stack Express server and SQLite database management.
- `src/pages/`: Individual application pages (Dashboard, Patient Details, Audit, etc.).
- `src/hooks/`: Custom hooks for real-time vital sign simulation.
- `src/services/ai.ts`: Integration with the Gemini AI engine.
- `src/types.ts`: Shared TypeScript definitions.
