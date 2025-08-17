# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Concert Connect is a cross-platform application that combines concert ticket purchasing, AI-powered music discovery, and social networking features. The project targets a $90 billion market opportunity at the intersection of live music ticketing, AI-powered discovery, and social networking.

## Project Status

This is currently a **planning and design phase** project containing:
- Business case documentation (`Concert_Connect_Business_Case.md`)
- Technical design document (`concert_connect_tech_design.md`)
- No actual code implementation yet

## Architecture Overview

**Planned Technology Stack:**
- **Frontend**: React Native (mobile) + Next.js (web)
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL + Redis
- **Cloud**: AWS or Google Cloud Platform
- **Payment**: Stripe
- **APIs**: Ticketmaster, Bandsintown, Spotify Web API

**Core Services Architecture:**
1. User Service - Authentication, profiles, preferences
2. Concert Service - Event discovery, ticket integration
3. Social Service - Friend connections, groups, messaging
4. Recommendation Service - AI-powered music/event suggestions
5. Payment Service - Stripe integration, transaction handling
6. Notification Service - Push notifications, email alerts

## Development Phases

**Phase 1: MVP (4-6 months, $80K-150K)**
- User authentication (email/password, social login)
- Event discovery via Ticketmaster API
- Basic social features (profiles, friends, sharing)
- Ticket purchase flow with affiliate tracking

**Phase 2: Enhanced Features (2-3 months, $30K-60K)**
- Restaurant partnerships with QR codes
- Enhanced social features (groups, meetups, chat)
- Basic AI recommendations

**Phase 3: Advanced Platform (3-4 months, $60K-120K)**
- Travel integration (hotels, transportation)
- Advanced AI with machine learning models
- Premium features (ad-free, early access, exclusive content)

## Key Business Metrics

- Target ARPU: $10-15 monthly through multiple revenue streams
- Projected user acquisition cost: $25
- Target LTV:CAC ratio: 7.2:1
- Year 3 financial goal: $15M revenue with EBITDA profitability

## Development Guidelines

**File Structure (Planned):**
```
concert-connect/
├── mobile/           # React Native app
├── web/             # Next.js web app  
├── backend/         # Node.js API
└── shared/          # Shared utilities
```

**API Integrations:**
- Ticketmaster API for event data and ticket purchases
- Spotify Web API for music discovery and artist information
- Bandsintown API for additional event coverage
- Stripe for payment processing

**Security Requirements:**
- JWT authentication with 24h expiry
- PCI DSS Level 3-4 compliance for payments
- GDPR/CCPA compliance for data protection
- Rate limiting on all public endpoints
- Input validation and SQL injection prevention

## Getting Started

Since this project is in the planning phase:

1. Review the business case document for market context
2. Study the technical design document for implementation details
3. When starting development, follow the phased approach outlined
4. Begin with Phase 1 MVP features before expanding functionality
5. Ensure all security requirements are implemented from the start

## Revenue Model

Multiple revenue streams:
- Affiliate commissions from ticket sales (4-5% via TickPick)
- Freemium subscriptions ($3-5/month basic, $9.99-19.99 premium)
- Ad revenue for free users ($2-10 CPM)
- Restaurant/venue partnerships ($500-5K monthly)
- Merchandise affiliate commissions (5-25%)

## Target Market

- Primary: Southeast US regional market ($3-5B annual live music revenue)
- Initial deployment: Columbia, SC (leveraging University of South Carolina's 34K students)
- Expansion markets: Charlotte, NC and other Southeast cities
- Demographics: Music fans aged 35-54 (over-index at 2.6x general population)