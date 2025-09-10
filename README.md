# Laundry Service Management System

A modern, full-stack laundry service management application built with React, TypeScript, and Supabase.

## Features

### Customer Features
- **Service Request Form**: Easy-to-use form for customers to request laundry services
- **Service Selection**: Interactive service selector with real-time pricing
- **Responsive Design**: Mobile-first design that works on all devices
- **Form Validation**: Comprehensive client-side validation with user-friendly error messages

### Admin Features
- **Dashboard**: Overview of pending requests, revenue, and key metrics
- **Request Management**: Complete CRUD operations for managing customer requests
- **Service Management**: Add, edit, and manage laundry services
- **Status Updates**: Update request status with automatic email notifications
- **Internal Notes**: Add private notes to requests for internal use
- **Batch Operations**: Select and update multiple requests simultaneously
- **Filtering & Search**: Advanced filtering by status, date, and customer information
- **CSV Export**: Export request data for reporting and analysis

### Technical Features
- **Error Handling**: Comprehensive error boundaries and network error handling
- **Form Validation**: Robust validation with custom error messages
- **Auto-save**: Form data persistence for long forms
- **Retry Logic**: Automatic retry for failed network requests
- **Email Notifications**: Professional email templates for status updates
- **Real-time Updates**: Auto-refresh dashboard data every 30 seconds

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Forms**: React Hook Form
- **Routing**: React Router DOM
- **State Management**: React Hooks
- **Email**: Custom email service (placeholder for SendGrid/AWS SES)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd RSA-v4
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Fill in your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_ADMIN_PASSWORD=your_admin_password
   ```

4. **Set up the database**
   - Run the SQL schema in `supabase/schema.sql` in your Supabase SQL editor
   - Run the migration in `supabase/migrations/add_internal_notes.sql`

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Build CSS (if needed)**
   ```bash
   npm run build:css
   ```

The application will be available at `http://localhost:5173`

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── admin/           # Admin-specific components
│   ├── ErrorBoundary.tsx
│   ├── ToastProvider.tsx
│   └── ...
├── pages/               # Page components
│   ├── admin/           # Admin pages
│   ├── CustomerRequest.tsx
│   └── NotFound.tsx
├── lib/                 # Utility libraries
│   ├── supabase.ts      # Database operations
│   ├── validation.ts    # Form validation
│   └── emailService.ts  # Email functionality
├── types/               # TypeScript type definitions
└── App.tsx              # Main application component
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |
| `VITE_ADMIN_PASSWORD` | Admin panel password | Yes |

## Database Schema

The application uses three main tables:

- **`laundry_services`**: Available laundry services with pricing
- **`laundry_requests`**: Customer requests with status and notes
- **`request_services`**: Junction table linking requests to services

## API Endpoints

The application uses Supabase client for all database operations:

- **Services**: CRUD operations for laundry services
- **Requests**: CRUD operations for customer requests
- **Request Services**: Managing service selections per request

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Netlify

1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Set environment variables in Netlify dashboard

### Manual Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Upload the `dist` folder to your hosting provider

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@yourcompany.com or create an issue in the GitHub repository.

## Roadmap

- [ ] User authentication and authorization
- [ ] Payment integration
- [ ] Mobile app (React Native)
- [ ] Advanced reporting and analytics
- [ ] Multi-language support
- [ ] API rate limiting
- [ ] Advanced email templates
- [ ] SMS notifications
- [ ] Customer portal
- [ ] Inventory management