# Enhanced Industry Analyst Portal

A comprehensive, enterprise-grade platform for managing industry analyst relationships, built with Next.js, TypeScript, and modern web technologies.

## 🚀 Features

### 1. Advanced Analyst Database & CRM
- **Comprehensive Analyst Profiles**: Contact info, social handles, expertise areas, influence scoring
- **Publication Tracking**: Recent articles, whitepapers, research reports with links and summaries
- **Social Media Intelligence**: Automated summaries of analyst social posts and key themes
- **Forward-Looking Pipeline**: Upcoming publications, research projects, awards, speaking engagements
- **Relationship Timeline**: Complete interaction history with conversation summaries
- **Communication Cadence Tracking**: Last contact date, frequency analysis, automated alerts

### 2. Conversation Management & Follow-up System
- **AI-Powered Conversation Summaries**: Auto-generate meeting notes and key discussion points
- **Action Item Tracking**: Extract and manage follow-up tasks and commitments
- **Briefing Schedule Management**: Set 3-month briefing cycles with automated reminders
- **Relationship Health Alerts**: Warning system for overdue communications or missed briefings
- **Gong Integration Ready**: Upload and link call recordings to analyst profiles

### 3. Newsletter & Communications Hub
- **Newsletter Designer**: Drag-and-drop email builder with HR tech templates
- **Audience Segmentation**: Target by expertise, engagement level, or recent publications
- **Campaign Management**: Schedule, send, and track performance
- **Content Personalization**: Based on analyst recent writings and interests

### 4. Exclusive Analyst Portal (Login Required)
- **Company Vision Center**: Mission, values, and strategic direction
- **Educational Hub**: Video libraries, product tutorials, and industry insights
- **Roadmap Gallery**: Interactive timeline of upcoming features and releases
- **Executive Access**: Direct communication channels with leadership team
- **Exclusive Content**: Early access to research, beta features, and insider updates
- **Personalized Dashboard**: Content recommendations based on expertise areas

### 5. Intelligence & Analytics Dashboard
- **Analyst Activity Monitoring**: Track publication schedules and social engagement
- **Relationship Health Metrics**: Communication frequency, engagement scores, last interaction
- **Content Performance**: Which materials resonate most with which analysts
- **Pipeline Insights**: Upcoming opportunities for thought leadership and collaboration

## 🛠 Technology Stack

- **Framework**: Next.js 15.3.4 with Turbopack
- **Language**: TypeScript
- **Database**: SQLite with Prisma ORM
- **Styling**: Tailwind CSS 4.0
- **Authentication**: NextAuth.js
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation
- **Email**: Resend integration

## 🏗 Architecture

### Database Schema
The platform uses a comprehensive database schema with the following key models:

- **Analysts**: Core analyst information with enhanced relationship tracking
- **Publications**: Track analyst publications and research
- **SocialPosts**: Monitor social media activity and sentiment
- **Briefings**: Manage scheduled and completed briefings
- **Alerts**: Automated relationship health monitoring
- **ConversationSummaries**: AI-powered meeting notes and outcomes
- **ExclusiveContent**: Tiered access content management
- **CompanyVision**: Mission, values, and strategic messaging

### Key Pages

1. **Dashboard** (`/`): Real-time metrics and activity feed
2. **Analysts** (`/analysts`): Comprehensive analyst management
3. **Analyst Detail** (`/analysts/[id]`): Deep-dive analyst profiles with tabs for:
   - Overview: Bio, expertise, communication timeline
   - Intelligence: Social insights, publication pipeline
   - Communications: Message history and templates
   - Briefings: Scheduled and completed sessions
   - Content: Relevant materials and resources
   - Alerts: Active notifications and warnings
4. **Analytics** (`/analytics`): Advanced reporting and insights
5. **Newsletters** (`/newsletters`): Campaign management
6. **Portal** (`/portal`): Exclusive analyst access area

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git

### Installation

1. **Clone the repository**:
   ```bash
   git clone [your-repo-url]
   cd analyst-portal
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up the database**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Configure environment variables**:
   Create a `.env` file with:
   ```env
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_SECRET="your-secret-here"
   NEXTAUTH_URL="http://localhost:3000"
   ```

5. **Run the development server**:
   ```bash
   npm run dev
   ```

6. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📊 Key Features Demo

### Enhanced Analyst Profiles
- Influence scoring (0-100 scale)
- Relationship health tracking (Excellent → Critical)
- Communication cadence monitoring
- Social intelligence summaries
- Publication pipeline tracking

### Advanced Analytics
- Relationship health distribution charts
- Influence score analysis
- Communication trend tracking
- Content performance metrics
- Alert management system

### Exclusive Portal Access
- Secure analyst login system
- Tiered content access (ALL, TIER1, TIER2)
- Personalized content recommendations
- Company vision and strategic messaging
- Executive engagement opportunities

## 🔒 Security Features

- **Secure Authentication**: NextAuth.js with session management
- **Role-Based Access**: Admin and analyst user roles
- **Tiered Content Access**: Multiple access levels for exclusive content
- **Data Protection**: Encrypted sensitive information
- **Session Management**: Secure portal access tracking

## 📈 Future Enhancements

- **AI Integration**: GPT-powered conversation analysis
- **Social Media APIs**: Real-time social monitoring
- **Calendar Integration**: Automated briefing scheduling
- **Email Templates**: Dynamic newsletter generation
- **Mobile App**: React Native companion app
- **Advanced Reporting**: Custom dashboard builder

## 🤝 Contributing

This project represents a comprehensive analyst relationship management platform. For contributions:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation wiki

---

**Built with ❤️ for the HR Tech industry**
