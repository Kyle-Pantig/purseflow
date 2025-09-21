# PurseFlow - Expense Tracker & Budget App

A modern expense tracking and budget management application built with Next.js 15, TypeScript, TailwindCSS, and Supabase.

## Features

- 🔐 **Authentication**: Secure login/signup with Supabase Auth
- 📊 **Dashboard**: Overview of daily expenses with category breakdown
- ➕ **Add Expenses**: Easy expense entry with categories and descriptions
- 📈 **Reports**: Visual charts and analytics for spending patterns
- 🎨 **Modern UI**: Built with shadcn/ui components and TailwindCSS
- ⚡ **Real-time**: Powered by tRPC and React Query for optimal performance

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **API**: tRPC
- **State Management**: React Query
- **Charts**: Recharts

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd expenses
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The application uses a single `expenses` table with the following structure:

```sql
CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL CHECK (category IN ('transportation', 'food', 'bills', 'others')),
  description TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Features Overview

### Dashboard
- Today's total expenses
- Category breakdown
- Recent transactions
- Quick stats cards

### Add Expense
- Amount input with validation
- Category selection (Transportation, Food, Bills, Others)
- Optional description
- Date picker (defaults to today)

### Reports
- Weekly and monthly summaries
- Interactive charts (Pie chart for categories, Bar chart for daily trends)
- Category breakdown with percentages
- Customizable date ranges

### Authentication
- Email/password signup and login
- Protected routes
- Automatic redirects based on auth state

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── dashboard/         # Protected dashboard pages
│   ├── login/            # Authentication pages
│   └── api/trpc/         # tRPC API routes
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Custom components
├── contexts/             # React contexts
├── lib/                  # Utility functions and configurations
└── server/               # tRPC server setup
    └── api/              # API routes and routers
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details