# AI Resume Analyzer

An AI-powered resume analysis tool built with React, Firebase, and Groq AI. Helps students optimize their resumes for ATS systems and gives recruiters deep insights into candidate profiles.

## Live Demo
[Add your Vercel URL here after deploying]

## Features

### For Students
- Upload resume as PDF
- Get instant ATS score and compatibility check
- AI-powered feedback — strengths, improvements, keyword analysis
- AI rewrites weak bullet points with stronger versions
- Full resume rewrite optimized for ATS systems
- Download rewritten resume as PDF
- Job description matching — see how well your resume fits a role
- Chat with AI career coach about your resume

### For Recruiters
- Upload candidate resume as PDF
- Overall score and ATS compatibility score
- Candidate summary and professional assessment
- Category breakdown — experience, skills, education, achievements, formatting, keywords
- NLP analysis — sentiment, tone, clarity score, passive voice usage
- Quantifiable impact detection — counts numerical achievements
- Temporal progression analysis — maps career growth and date logic

## Tech Stack

- **Frontend** — React, Vite
- **Authentication** — Firebase Auth (Google Sign In)
- **Database** — Firebase Firestore
- **AI** — Groq API (Llama 3.3 70B)
- **PDF Reading** — pdfjs-dist
- **PDF Generation** — html2pdf.js
- **Styling** — Inline CSS with dark theme

## Getting Started

### Prerequisites
- Node.js 18+
- A Groq API key (free at [console.groq.com](https://console.groq.com))
- A Firebase project

### Installation

1. Clone the repo
```bash
git clone https://github.com/Bhavik1502/ai-resume-analyzer.git
cd ai-resume-analyzer/resume-checker
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file in the `resume-checker` folder