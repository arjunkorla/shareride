# Figma Make AI Prompt — ShareRide

## Hyderabad-Focused Ride Matching Mobile Application

### Role

You are a Senior Product Designer and UX Architect with 10+ years of experience designing production-ready consumer mobile applications, mobility platforms, ride-sharing products, location-based services, and marketplace applications similar to Uber, BlaBlaCar, Rapido, and Google Maps.

Design a **production-ready hybrid mobile application for Android and iOS** called **ShareRide**.

The primary launch market is **Hyderabad, Telangana, India**.

The application connects:

1. **Passengers** who want to travel from one location to another and post a ride request.
2. **Drivers** who are already traveling toward a destination and post an available ride.

The core product concept is **ride matching**, not traditional seat booking.

---

# IMPORTANT PRODUCT CHANGE

## Remove Seat Selection Completely

Do **NOT** design a seat-selection experience.

Do NOT create:

* Select 1 seat
* Select 2 seats
* Seat counters
* Seat maps
* Seat-selection bottom sheets
* Seat availability controls
* "Choose number of seats"
* "Book Seat" CTA

The passenger should simply communicate:

> "I want to travel from A to B."

The driver communicates:

> "I am traveling from A to B."

ShareRide matches passengers and drivers based on:

* Pickup location
* Destination
* Date
* Preferred time
* Route compatibility
* Distance
* Driver/passenger preferences
* Verification
* Rating
* Availability

The UX should feel like a **smart ride-matching marketplace**, not a bus or airline booking application.

---

# PRIMARY PRODUCT MODEL

## Passenger

A passenger can:

* Search existing rides
* Post a ride request
* Specify pickup location
* Specify destination
* Specify date
* Specify preferred departure time
* Add optional notes
* View matching drivers
* Send a ride request
* Chat with the driver
* Accept or decline a driver's response
* View trip details
* Share trip
* Track trip
* Rate the driver after completion

## Driver

A driver can:

* Post an upcoming ride
* Specify starting location
* Specify destination
* Specify date
* Specify departure time
* Add optional stops
* Add optional ride preferences
* View matching passenger requests
* Respond to passenger requests
* Chat with passengers
* Confirm a ride
* Manage upcoming rides
* View completed rides
* View ride history

---

# PRODUCT PRINCIPLE

Design ShareRide around this simple interaction:

### Passenger

**Where do you want to go?**

`From Hyderabad → To Vijayawada`

### Driver

**Where are you going?**

`From Hyderabad → To Vijayawada`

### ShareRide

**We found compatible rides.**

The primary user experience should always make the route and time relationship immediately understandable.

---

# PRIMARY LOCATION

Design the application primarily around **Hyderabad, Telangana, India**.

Use realistic Hyderabad locations throughout the prototype.

Examples:

* HITEC City
* Madhapur
* Kondapur
* Gachibowli
* Financial District
* Jubilee Hills
* Banjara Hills
* Begumpet
* Secunderabad
* Kukatpally
* Miyapur
* LB Nagar
* Uppal
* Dilsukhnagar
* Mehdipatnam
* Ameerpet
* Somajiguda
* Tarnaka
* Shamshabad
* Rajiv Gandhi International Airport

Use other major destinations around Hyderabad and Telangana where appropriate.

Examples:

* Hyderabad → Warangal
* Hyderabad → Vijayawada
* Hyderabad → Nalgonda
* Hyderabad → Karimnagar
* Hyderabad → Sangareddy
* Hyderabad → Srisailam

Do not make the application appear limited to Hyderabad. Hyderabad should be the **primary example location and launch market**, while the architecture must support city-to-city and intra-city rides across India.

---

# DO NOT MAKE UNVERIFIED ASSUMPTIONS

Do not invent:

* Government regulations
* Pricing rules
* Legal requirements
* Payment policies
* Commission models
* Insurance coverage
* Driver eligibility requirements
* Ride-sharing laws
* Specific API capabilities

If functionality requires backend or third-party integration, represent it as a realistic prototype state.

Clearly separate:

**UI/UX prototype behavior**

from

**future backend/API functionality.**

---

# DESIGN GOALS

Prioritize:

* Trust
* Safety
* Simplicity
* Route clarity
* Fast matching
* Minimal user effort
* Local relevance
* Accessibility
* Transparency
* Reliability
* Premium but practical experience

The interface should feel modern and polished but should NOT copy Uber, Rapido, BlaBlaCar, or Google Maps.

Use familiar mobility UX patterns while creating a distinct ShareRide identity.

---

# DESIGN SYSTEM

Create a complete reusable design system.

## Color System

Create semantic design tokens for:

* Primary
* Primary Container
* Success
* Warning
* Error
* Information
* Background
* Surface
* Surface Elevated
* Border
* Text Primary
* Text Secondary
* Text Disabled

Create Light and Dark themes.

Ensure WCAG-accessible contrast.

---

# TYPOGRAPHY

Use a modern highly readable mobile typeface.

Create tokens for:

* Display
* H1
* H2
* H3
* Title
* Body Large
* Body
* Body Small
* Caption
* Button
* Label

Support dynamic/scalable text.

---

# SPACING

Create a consistent spacing system.

Use a logical spacing scale such as:

4
8
12
16
20
24
32
40
48

Do not randomly use spacing values.

---

# COMPONENT SYSTEM

Create reusable Auto Layout components with variants and component properties.

Include:

* Primary Button
* Secondary Button
* Text Button
* Icon Button
* Search Field
* Location Field
* Date Picker
* Time Picker
* Search Bar
* Chips
* Filter Chips
* Tabs
* Cards
* Ride Request Card
* Driver Ride Card
* Passenger Request Card
* Match Card
* Profile Card
* Vehicle Card
* Verification Badge
* Rating
* Avatar
* Status Badge
* Notification Card
* Chat Bubble
* Bottom Sheet
* Modal
* Confirmation Dialog
* Snackbar
* Toast
* Loading Skeleton
* Empty State
* Error State
* Success State
* Timeline
* Map Marker
* Route Indicator
* Navigation Bar
* Bottom Navigation
* Top App Bar
* Floating Action Button

Create component states:

* Default
* Hover where applicable
* Pressed
* Focused
* Disabled
* Loading
* Success
* Error
* Selected
* Unselected

---

# APPLICATION NAVIGATION

Use bottom navigation:

**Home**
**Discover**
**My Rides**
**Chat**
**Profile**

Do not create a separate seat-booking section.

The primary CTA should allow users to choose:

**Request a Ride**

or

**Offer a Ride**

---

# 1. SPLASH SCREEN

Create:

* ShareRide logo
* Minimal mobility/location illustration
* Loading indicator
* Version number

Keep the experience short and premium.

---

# 2. ONBOARDING

Create 3 onboarding screens.

### Screen 1

**Find a ride that matches your route**

### Screen 2

**Offer your ride to people going your way**

### Screen 3

**Travel with a verified community**

CTA:

**Get Started**

Allow:

**Skip**

---

# 3. AUTHENTICATION

Support:

* Mobile number
* OTP verification
* Email
* Google
* Apple on iOS

Do not create unnecessary authentication steps.

Include:

* Terms & Conditions
* Privacy Policy
* Consent

---

# 4. PROFILE SETUP

Collect only essential information initially.

Include:

* Name
* Profile photo
* Mobile number
* Email
* Preferred language
* City

Allow additional verification later.

Use progressive disclosure.

---

# 5. HOME SCREEN

The Home screen is the most important screen.

Create a Hyderabad-focused map-based experience.

### Header

Show:

**Good morning, [Name]**

Location:

**Hyderabad**

Notification icon

Profile avatar

### Primary action area

Two prominent actions:

**Request a Ride**

**Offer a Ride**

### Search / Match area

Show:

**Where are you going?**

Fields:

**From**

**To**

**Date**

**Preferred Time**

### Nearby / Recommended Matches

Show relevant ride matches.

Example:

**HITEC City → Secunderabad**

**Madhapur → Gachibowli**

**Kondapur → Shamshabad Airport**

### Map

Show nearby route activity using simplified ride markers.

Do not overload the map with markers.

---

# 6. REQUEST A RIDE

Create a simple multi-step flow.

## Step 1 — Route

**Where are you starting from?**

From

To

Allow:

* Current location
* Search location
* Map selection
* Saved places

Examples:

**Madhapur**

**Gachibowli**

## Step 2 — Schedule

Date

Preferred departure time

Allow flexible time.

Example:

**Tomorrow**

**8:00 AM – 9:00 AM**

## Step 3 — Preferences

Optional preferences only.

Examples:

* Women preferred
* AC preferred
* EV preferred
* Pets
* Luggage
* Music preference
* Conversation preference

Do not make preferences mandatory.

## Step 4 — Notes

Optional message:

**Anything the driver should know?**

Example:

"Pickup near Cyber Towers."

## Step 5 — Review

Show:

Route

Date

Time

Preferences

Notes

Primary CTA:

**Post Ride Request**

---

# 7. RIDE REQUEST POSTED

Show a confirmation screen:

**Your ride request is live**

Display:

Route

Date

Preferred time

Matching status

Example:

**Searching for compatible drivers**

Provide:

**View Matches**

**Edit Request**

**Cancel Request**

---

# 8. DRIVER — OFFER A RIDE

Create a separate driver flow.

Primary CTA:

**Offer a Ride**

## Step 1

Starting location

Destination

## Step 2

Date

Departure time

## Step 3

Optional stops

Example:

Hyderabad

↓
Kondapur

↓
Gachibowli

↓
Shamshabad

## Step 4

Ride preferences

Examples:

* AC
* EV
* Pets
* Luggage
* Music
* Conversation

## Step 5

Optional note

Example:

"Pickup near IKEA."

## Step 6

Review

Show complete ride information.

Primary CTA:

**Publish Ride**

---

# 9. DRIVER RIDE PUBLISHED

Confirmation:

**Your ride is live**

Show:

Route

Departure time

Stops

Matching passengers

Request status

Actions:

**View Matches**

**Edit Ride**

**Cancel Ride**

---

# 10. MATCHING EXPERIENCE

This is the core ShareRide experience.

Create a dedicated **Matches** experience.

Show:

### Excellent Match

**Madhapur → Vijayawada**

Departure:

**8:00 AM**

Route compatibility:

**92%**

Pickup distance:

**1.2 km**

Destination distance:

**2.4 km**

Driver:

Profile photo

Name

Verification badge

Rating

Completed rides

Vehicle

### Match categories

* Best Match
* Closest Pickup
* Closest Destination
* Best Time Match
* Verified User

Do not expose complicated algorithm terminology.

Instead of technical scoring explanations, communicate match quality in simple human language.

---

# 11. PASSENGER → DRIVER REQUEST

Passenger selects a compatible driver.

Show:

Driver profile

Route

Departure time

Pickup point

Destination

Vehicle

Rating

Verification

Preferences

Optional note

Primary CTA:

**Send Ride Request**

Secondary:

**Chat**

Do not use:

**Book Seat**

---

# 12. DRIVER → PASSENGER REQUEST

Driver sees compatible passenger requests.

Passenger card:

Profile photo

Name

Verification

Rating

Pickup

Destination

Preferred time

Distance from route

Passenger note

Actions:

**Accept**

**Decline**

**Chat**

No seat-selection interface.

---

# 13. RIDE CONFIRMATION

Once both parties agree:

Show:

**Ride Confirmed**

Display:

Passenger

Driver

Route

Pickup

Destination

Date

Time

Vehicle

Meeting point

Contact options

Primary CTA:

**View Trip**

Secondary:

**Chat**

---

# 14. RIDE DETAIL

Create one reusable Ride Detail pattern that adapts to Driver and Passenger roles.

Include:

### Route

Interactive map

Pickup

Stops

Destination

### Trip information

Date

Time

Estimated journey

Meeting point

### People

Driver / Passenger

Verification

Rating

### Vehicle

Photo

Brand

Model

Color

Masked registration number

### Actions

Chat

Call

Share Trip

Report

Cancel

Safety

---

# 15. CHAT

Create modern real-time messaging.

Features:

* Text
* Emoji
* Location
* Ride details
* Quick replies
* Image placeholder
* Typing indicator
* Read receipt
* Online status

Useful quick replies:

**Where should we meet?**

**I'm on my way**

**I'm here**

**Running 5 minutes late**

**Can you share your location?**

Include:

Report User

Block User

---

# 16. RIDE STATUS

Use a clear timeline.

Statuses:

**Request Sent**

↓

**Accepted**

↓

**Confirmed**

↓

**Driver Arriving**

↓

**At Pickup**

↓

**Ride Started**

↓

**Ride Completed**

↓

**Review**

Do not introduce seat-related statuses.

---

# 17. DRIVER PROFILE

Show:

* Profile photo
* Name
* Verification badge
* Rating
* Completed rides
* Member since
* Languages
* Bio
* Response rate
* Response time
* Reviews

Do not invent unrealistic statistics.

---

# 18. PASSENGER PROFILE

Show:

* Profile photo
* Name
* Verification badge
* Rating
* Completed rides
* Member since
* Languages
* Bio
* Reviews

---

# 19. VEHICLE PROFILE

Show:

* Vehicle photo
* Brand
* Model
* Color
* Fuel type
* Masked registration number
* Verification status

Avoid exposing unnecessary sensitive information.

---

# 20. VERIFICATION

Create a dedicated verification center.

Categories:

### Identity

Government ID

### Driver

Driving License

### Vehicle

Vehicle documents

Insurance

Other required documentation where applicable

### Selfie

Identity verification

Statuses:

* Not Started
* In Progress
* Submitted
* Under Review
* Verified
* Action Required
* Rejected

Use clear explanations for every state.

---

# 21. NOTIFICATIONS

Create notification categories:

### Ride Requests

New request

Request accepted

Request declined

### Ride Updates

Ride confirmed

Pickup update

Ride cancelled

### Chat

New message

### Verification

Verification submitted

Verification approved

Action required

### Safety

Safety alerts

### System

Important account updates

---

# 22. MY RIDES

Organize rides into:

### Requests

Ride requests created by the passenger.

### Offered

Rides posted by the driver.

### Upcoming

Confirmed rides.

### Completed

Past rides.

### Cancelled

Cancelled rides.

Each ride should clearly identify the user's role:

**Requested by you**

or

**Offered by you**

---

# 23. RIDE HISTORY

Show:

* Date
* Route
* Driver/passenger
* Status
* Trip details
* Reviews
* Receipt where applicable

Do not create unnecessary financial information unless payment functionality is explicitly required.

---

# 24. PAYMENT

Do not make payment a mandatory part of the core UX unless specified.

If payment is represented, create it as an optional future-ready module.

Possible UI:

Payment method

Transaction status

Payment history

Do not invent:

* Commission percentages
* Fare calculation rules
* Refund policies
* Pricing algorithms

---

# 25. SAFETY CENTER

Safety must be highly visible but should not overwhelm the primary ride experience.

Include:

**SOS**

**Share Live Trip**

**Emergency Contacts**

**Report Ride**

**Report User**

**Block User**

**Safety Tips**

**Support**

SOS should require deliberate confirmation to avoid accidental activation.

---

# 26. EMERGENCY CONTACTS

Allow users to add:

Name

Relationship

Phone number

Provide:

**Share trip automatically**

as an optional setting.

Do not assume emergency services or government integrations.

---

# 27. REVIEWS

After completing a ride:

Rate:

Driver / Passenger

Overall experience

Optional categories:

* Communication
* Pickup experience
* Route experience
* Courtesy

Optional comment.

Do not force users to leave lengthy feedback.

---

# 28. COMMENTS / RIDE DISCUSSION

Allow limited ride-related communication where appropriate.

Examples:

Pickup clarification

Meeting point question

Route clarification

Include:

Report

Delete where permitted

Moderation state

Do not turn this into a public social-media feed.

---

# 29. DISCOVER

Create a discovery experience for available rides.

Users can search:

From

To

Date

Time

Show:

* Matching offered rides
* Matching ride requests
* Nearby matches

Filters:

* Time
* Distance
* Verified users
* Preferences
* Vehicle type where applicable

Avoid excessive filters.

---

# 30. MAP EXPERIENCE

Use a map as a supporting navigation and matching surface.

Do not allow the map to dominate every screen.

Use:

* Route lines
* Pickup markers
* Destination markers
* User location
* Match markers

Use Hyderabad examples throughout the prototype.

For map integration, create a realistic visual placeholder suitable for later Google Maps or another map SDK integration.

Do not claim that an actual map API is implemented inside Figma.

---

# 31. PROFILE

Sections:

Personal Information

Verification

My Rides

Vehicle

Documents

Reviews

Emergency Contacts

Payment

Preferences

Settings

Support

Logout

Delete Account

---

# 32. SETTINGS

Include:

Notifications

Language

Appearance

Dark Mode

Location Permission

Privacy

Security

Biometric Login

Change Password

Blocked Users

Emergency Contacts

---

# 33. SUPPORT

Include:

FAQ

Help Center

Raise Ticket

Live Chat

Email Support

Call Support

Safety Center

Terms

Privacy Policy

---

# 34. EMPTY STATES

Create realistic empty states.

Examples:

**No matching rides**

"Try changing your time or pickup location."

**No ride requests**

**No offered rides**

**No upcoming rides**

**No completed rides**

**No messages**

**No notifications**

**No matches yet**

**No internet connection**

Each empty state should provide a relevant action.

---

# 35. ERROR STATES

Create:

Location unavailable

Location permission denied

Network error

Unable to find matches

Ride request failed

Ride publishing failed

Request expired

Ride cancelled

Verification failed

Chat unavailable

Unable to load map

Session expired

Permission required

Every error should explain:

1. What happened
2. What the user can do next

---

# 36. LOADING STATES

Create skeleton/loading states for:

Home

Map

Ride cards

Match cards

Profiles

Ride details

Chat

Notifications

Verification

Avoid unnecessary full-screen spinners.

---

# 37. SUCCESS STATES

Create:

Ride request posted

Ride offered

Match found

Ride request accepted

Ride confirmed

Ride completed

Verification submitted

Profile updated

Review submitted

---

# 38. CANCEL / EXPIRATION STATES

Create clear confirmation dialogs for:

Cancel ride request

Cancel offered ride

Cancel confirmed ride

Decline request

Block user

Report user

Delete account

Use appropriate warning messaging.

Do not use confusing destructive CTA hierarchy.

---

# 39. TRUST & SAFETY UX

Trust information should appear contextually.

For example:

**Verified**

**Identity verified**

**Vehicle verified**

**Highly rated**

Do not overload every card with badges.

Prioritize the information that helps users make a confident decision.

---

# 40. ACCESSIBILITY

Follow WCAG principles.

Ensure:

* Adequate contrast
* Minimum 44–48px touch targets
* Scalable typography
* Screen-reader-friendly labels
* Logical focus order
* Do not rely only on color
* Clear error messages
* Accessible map alternatives
* Accessible bottom sheets
* Accessible dialogs

---

# 41. RESPONSIVE / PLATFORM ADAPTATION

Design for:

### Android

Follow Material Design 3 principles where appropriate.

### iOS

Use iOS-compatible interaction patterns where appropriate.

Do not blindly duplicate Android UI on iOS.

Create platform-adaptive components while maintaining one ShareRide visual language.

Primary design target:

**Mobile 390 × 844**

Also ensure the components can adapt to:

* 360px width
* 375px width
* 390px width
* 414px width

---

# 42. LIGHT AND DARK THEMES

Every major screen must have:

Light Theme

Dark Theme

Do not simply invert colors.

Create semantic color tokens so the same components work correctly in both themes.

---

# 43. PROTOTYPE FLOWS

Create clickable prototypes for the following critical journeys.

## Passenger Journey

Home

→ Request a Ride

→ Enter Route

→ Select Date/Time

→ Preferences

→ Review

→ Post Request

→ View Matches

→ Select Driver

→ Send Request

→ Driver Accepts

→ Ride Confirmed

→ Chat

→ Trip

→ Ride Completed

→ Review

---

## Driver Journey

Home

→ Offer a Ride

→ Enter Route

→ Date/Time

→ Stops

→ Preferences

→ Review

→ Publish Ride

→ View Passenger Matches

→ Accept Passenger

→ Ride Confirmed

→ Chat

→ Trip

→ Ride Completed

→ Review

---

# 44. MATCHING UX

The matching experience must be one of the strongest parts of the application.

Communicate compatibility using simple human-readable information.

Example:

**Great route match**

**Pickup 1.2 km away**

**Departure within 15 minutes**

**Verified driver**

Avoid exposing complicated technical algorithm details.

Do not imply that a percentage score is scientifically accurate unless the backend actually provides one.

---

# 45. HYDERABAD UX CONTEXT

Use Hyderabad as the primary visual and content context.

Use realistic examples such as:

**Madhapur → Gachibowli**

**Kondapur → HITEC City**

**Jubilee Hills → Financial District**

**Secunderabad → HITEC City**

**LB Nagar → Shamshabad Airport**

**Hyderabad → Warangal**

**Hyderabad → Vijayawada**

The application should feel genuinely relevant to users in Hyderabad rather than looking like a generic global ride-sharing template.

Use:

* Indian date formats where appropriate
* Indian mobile number format
* ₹ currency where pricing is displayed
* Indian location naming conventions
* Local address patterns
* Hyderabad landmarks

Do not overuse local references to the point where the product cannot scale to other Indian cities.

---

# 46. CONTENT GUIDELINES

Use concise, human language.

Prefer:

**Where are you going?**

instead of:

**Enter your desired destination location**

Prefer:

**Request a Ride**

instead of:

**Create Passenger Transportation Request**

Prefer:

**Offer a Ride**

instead of:

**Create Driver Ride Availability**

Avoid corporate jargon and unnecessary technical terminology.

---

# 47. UX CONSTRAINTS

## Mandatory

* No seat selection
* No seat counter
* No seat map
* No Book Seat CTA
* No traditional ticket-booking UX
* Passenger can post a ride request
* Driver can post an offered ride
* Route matching is the core experience
* Hyderabad is the primary launch context
* Support both intra-city and inter-city journeys
* Support Driver and Passenger roles
* Minimize user steps
* Use progressive disclosure
* Reuse components
* Use Auto Layout
* Use Variables
* Use component properties
* Use variants
* Support Light/Dark themes
* Include loading/empty/error/success states

---

# 48. AVOID

Do not create:

* Cluttered dashboards
* Excessive cards
* Excessive map markers
* Long forms
* Unnecessary onboarding
* Complicated pricing screens
* Seat-selection workflows
* Airline/bus-style booking interfaces
* Excessive filters
* Too many navigation items
* Fake analytics
* Fake backend functionality
* Fake payment confirmations
* Unnecessary gamification
* Social-media-style feeds
* Excessive animations
* Unnecessary popups

---

# 49. INFORMATION HIERARCHY

For every ride/match card, prioritize:

1. Route
2. Date/time
3. Match relevance
4. Person
5. Verification
6. Rating
7. Vehicle
8. Distance
9. Optional preferences
10. Secondary actions

Do not allow secondary information to overpower the route.

---

# 50. Figma FILE ORGANIZATION

Create the Figma file using these pages:

### 01 — Foundations

* Color
* Typography
*
