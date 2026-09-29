Below is a production-ready prompt optimized for **Figma Make** to generate a modern, developer-friendly, high-fidelity mobile application.

---

# Figma Make Prompt – ShareRide (Hybrid Mobile App)

**Role**

You are a Senior Product Designer with 10+ years of experience designing production-ready consumer mobile applications similar to Uber, BlaBlaCar, Rapido and Google Maps.

Design a modern Hybrid Mobile Application (Android + iOS) for people who want to share rides while traveling between cities or within a city.

The design must be production-ready, developer-friendly, scalable and based on real UX patterns.

---

## Design Goal

Create a trustworthy platform where:

* Drivers can instantly post available rides.
* Passengers can search and request seats.
* Driver and passenger communicate through in-app chat.
* Safety and verification are the highest priority.
* Booking should require the fewest possible steps.

Focus on:

* Simplicity
* Speed
* Trust
* Accessibility
* Clean UI
* Premium experience

---

# Design System

Create a complete design system.

### Colors

* Primary Blue
* Success Green
* Error Red
* Warning Orange
* White
* Neutral Gray Scale

Support:

* Light Theme
* Dark Theme

---

### Typography

Modern readable font.

Hierarchy:

* Display
* Heading
* Title
* Body
* Caption
* Button

---

### Components

Build reusable components.

Examples:

* Buttons
* Text Fields
* Search Bar
* Dropdown
* Cards
* Bottom Sheets
* Floating Action Button
* Navigation Drawer
* Bottom Navigation
* Tabs
* Badges
* Chips
* Rating Stars
* Timeline
* Avatar
* Notification Card
* Ride Card
* Driver Card
* Passenger Card
* Vehicle Card
* Verification Badge
* Empty States
* Error States
* Loading Skeleton
* Success Screen
* Confirmation Dialog

Everything should use Auto Layout.

Create reusable Variables and Component Properties.

---

# Application Structure

## 1. Splash Screen

* Logo
* Brand Illustration
* Animated Loading
* Version Number

---

## 2. Onboarding

3–4 screens.

Explain:

* Share rides
* Save fuel
* Earn money
* Safe verified community

CTA

* Get Started

---

## 3. Login

Support

* Mobile OTP
* Email
* Google Login
* Apple Login (iOS)

Forgot Password

Terms & Privacy

---

## 4. Registration

Collect

* Name
* Mobile
* Email
* Password

Then continue profile completion.

---

# User Verification Flow

Progress tracker.

Collect

Profile Photo

Government ID

Driving License (for Drivers)

Vehicle RC

Insurance

Vehicle Photo

Selfie Verification

Verification Status

Pending

Approved

Rejected

Verified Badge

---

# Home Screen

Google Maps occupies approximately 70% of the screen.

Top Search Panel

From

To

Departure Date

Passengers

Instant Ride

Scheduled Ride

Floating Action Button

Post Ride

Bottom Navigation

Home

Search

Trips

Chat

Profile

Nearby ride markers appear on the map.

---

# Search Ride

Google Map

Search

From

To

Date

Time

Seat Count

Filters

Price

Women Only

Verified Driver

AC

EV

Pets Allowed

Luggage

Smoking

Instant Booking

Scheduled

Ride Cards

---

Each Ride Card includes

Driver Photo

Verification Badge

Rating

Vehicle

Vehicle Number (partially masked)

Price

Distance

ETA

Departure Time

Available Seats

Book Now

Chat

Call

---

# Post Ride

Multi-step flow.

Step 1

Source

Destination

Step 2

Stops

Step 3

Date

Time

Step 4

Seats

Price Per Seat

Step 5

Vehicle

Step 6

Review

Publish Ride

After publishing

Ride becomes visible instantly.

Nearby users receive notifications.

---

# Ride Detail

Large Map

Timeline Route

Driver Details

Vehicle Details

Available Seats

Reviews

Comments

Safety Information

Ride Rules

Book Seat

Chat

Share Ride

---

# Booking Flow

Passenger

Select Seats

Payment (Optional)

Booking Request

Driver receives request.

Driver

Accept

Reject

Counter Offer

Passenger notified instantly.

---

# Real-Time Chat

Modern Messenger UI.

Features

Text

Emoji

Images

Location Sharing

Ride Details

Quick Replies

Voice Messages (placeholder)

Typing Indicator

Read Receipts

Online Status

Report User

Block User

---

# Ride Status

Requested

Accepted

Confirmed

Driver Arriving

Ride Started

Ride Ongoing

Ride Completed

Cancelled

Timeline view.

---

# Driver Profile

Large Avatar

Verified Badge

Rating

Completed Trips

Years Driving

Bio

Languages

Reviews

Vehicle Information

Ride Statistics

Response Time

---

# Vehicle Details

Vehicle Photos

Brand

Model

Fuel Type

Color

Registration Number (masked)

RC Verified

Insurance Verified

Pollution Certificate

Vehicle Rating

---

# Passenger Profile

Photo

Verification Badge

Ratings

Completed Trips

Reviews

Bio

Languages

Emergency Contact

---

# Reviews & Feedback

After ride completion.

Rate

Driver

Passenger

Vehicle

Ride Experience

Comments

Upload Photos

Report Issues

---

# Comments

Ride discussion

Questions

Pickup Clarifications

Moderation

Report Comment

---

# Notifications

Ride Request

Booking Accepted

Ride Cancelled

Messages

Verification Updates

Promotions

System Alerts

---

# My Trips

Upcoming

Completed

Cancelled

Posted Rides

Booked Rides

---

# Ride History

Timeline

Date

Price

Distance

Passengers

Driver

Invoice

Receipt

Download

---

# Wallet

Ride Earnings

Ride Expenses

Transaction History

Withdraw

Payment Methods

---

# My Account

Personal Information

Vehicle

Verification

Documents

Payments

Preferences

Emergency Contacts

Settings

Logout

Delete Account

---

# Contact & Support

FAQ

Raise Ticket

Email Support

Call Support

Live Chat

Safety Center

Terms

Privacy Policy

---

# Settings

Notifications

Language

Dark Mode

Location Permission

Security

Privacy

Change Password

Biometric Login

---

# Safety Features

SOS Button

Emergency Contacts

Share Live Trip

Report Ride

Report Driver

Report Passenger

Blocked Users

Ride Tracking

---

# Empty States

No Rides

No Messages

No Notifications

No Trips

No Reviews

No Internet

---

# Error Screens

Location Disabled

Network Error

Verification Failed

Booking Failed

Payment Failed

Permission Required

---

# Success Screens

Ride Published

Booking Confirmed

Verification Submitted

Profile Updated

Feedback Submitted

---

# Navigation

Bottom Navigation

* Home
* Search
* Trips
* Chat
* Profile

Global Search available from Home.

---

# UX Principles

* Minimize user steps.
* Use progressive disclosure for complex tasks.
* Optimize forms with autofill and validation.
* Use clear visual hierarchy.
* Maintain consistent spacing, typography, and components.
* Provide loading, empty, success, and error states for all flows.
* Follow Material Design 3 principles while remaining platform-adaptive for Android and iOS.
* Ensure accessibility with adequate contrast, large touch targets, screen reader labels, and scalable text.

---

# Deliverables

Generate a production-ready Figma file containing:

* Complete Design System (colors, typography, spacing, icons, components, variables)
* Low-fidelity user flows
* High-fidelity mobile screens (Light and Dark themes)
* Interactive prototype with realistic navigation
* Auto Layout on all frames
* Responsive components with variants and states
* Reusable design tokens
* Developer handoff-ready specifications
* Organized pages for Foundations, Components, Flows, Screens, and Prototype
* Comprehensive user journeys for Driver and Passenger roles
* Edge cases, loading, empty, success, and error states for every major workflow
* Clean layer naming, reusable assets, and production-quality design suitable for implementation in Flutter or React Native.
