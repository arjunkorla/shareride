# Figma Make AI — ShareRide Product Model Update

Apply **only the following product and UX changes** to the existing ShareRide application design. Do not redesign unrelated screens, flows, components, or the existing visual design system.

## 1. Remove Seat Selection Completely

Remove the traditional seat-booking model from the entire application.

### Remove all:

* Seat selection
* Seat count selectors
* Seat maps
* Available seats indicators
* Number of seats
* "Book Seat" CTA
* "Select Seats" step
* Seat availability filters
* Seat-related booking terminology
* Any passenger flow that requires selecting a number of seats

Do not replace seat selection with another quantity selector.

The application should **not feel like a bus, airline, or traditional ticket-booking application**.

---

# 2. Introduce Two-Way Ride Posting

ShareRide should support two independent ride-posting use cases.

## Passenger — Request a Ride

A passenger posts where they want to go.

Example:

**From:** Madhapur, Hyderabad
**To:** Gachibowli, Hyderabad
**Date:** Tomorrow
**Preferred Time:** 8:00 AM

The passenger posts a **Ride Request**.

Primary CTA:

**Request a Ride**

The request should then be visible to compatible drivers.

---

## Driver — Offer a Ride

A driver posts where they are going.

Example:

**From:** Madhapur, Hyderabad
**To:** Gachibowli, Hyderabad
**Date:** Tomorrow
**Departure:** 8:00 AM

The driver posts an **Offered Ride**.

Primary CTA:

**Offer a Ride**

The offered ride should then be visible to compatible passengers.

---

# 3. Change the Core Matching Model

The core ShareRide experience should become:

**Passenger posts where they want to go**

↕

**Driver posts where they are going**

↓

**ShareRide finds compatible matches**

↓

**Passenger and Driver communicate**

↓

**Both agree**

↓

**Ride Confirmed**

Do not make "booking a seat" the primary interaction.

The primary interaction is **matching two people traveling in a compatible direction**.

---

# 4. Passenger Flow

Update the existing passenger flow to:

**Home**

→ **Request a Ride**

→ From

→ To

→ Date

→ Preferred Time

→ Optional Preferences

→ Optional Note

→ **Post Ride Request**

→ **View Matching Drivers**

→ View Driver Details

→ **Send Request**

→ Driver Accepts

→ **Ride Confirmed**

→ Chat

→ Trip

→ Review

Do not include any seat-selection step.

---

# 5. Driver Flow

Update the existing driver flow to:

**Home**

→ **Offer a Ride**

→ From

→ To

→ Date

→ Departure Time

→ Optional Stops

→ Optional Preferences

→ Optional Note

→ **Publish Ride**

→ **View Matching Passengers**

→ Passenger Details

→ **Accept / Decline**

→ **Ride Confirmed**

→ Chat

→ Trip

→ Review

Do not include seat capacity or seat selection.

---

# 6. Replace Booking Terminology

Update terminology throughout the application.

Use:

| Existing Concept          | New Concept                   |
| ------------------------- | ----------------------------- |
| Book a Seat               | Request Ride                  |
| Select Seats              | Remove                        |
| Available Seats           | Remove                        |
| Seat Booking              | Ride Matching                 |
| Booking Request           | Ride Request                  |
| Driver Booking            | Driver Ride Offer             |
| Seat Availability         | Ride Availability             |
| Book Now                  | Send Request / Request Ride   |
| Passenger Booking         | Passenger Request             |
| Driver Booking Management | Offered Rides / Ride Requests |

Use terminology consistently across:

* Buttons
* Cards
* Bottom sheets
* Notifications
* Chat
* Ride details
* Trips
* Empty states
* Success screens
* Error states
* Prototype interactions

---

# 7. Hyderabad-First Product Context

Make **Hyderabad, Telangana, India** the primary location context for the prototype.

Use realistic Hyderabad locations throughout the UI.

Examples:

* Madhapur
* HITEC City
* Gachibowli
* Kondapur
* Financial District
* Jubilee Hills
* Banjara Hills
* Begumpet
* Secunderabad
* Kukatpally
* Miyapur
* Ameerpet
* Mehdipatnam
* LB Nagar
* Uppal
* Shamshabad
* Rajiv Gandhi International Airport

Use realistic example routes such as:

**Madhapur → Gachibowli**

**Kondapur → HITEC City**

**Jubilee Hills → Financial District**

**Secunderabad → HITEC City**

**LB Nagar → Shamshabad Airport**

For inter-city examples:

**Hyderabad → Warangal**

**Hyderabad → Vijayawada**

**Hyderabad → Nalgonda**

The application architecture must remain scalable to other Indian cities. Hyderabad should be the **primary launch context**, not a hard-coded limitation.

---

# 8. Hyderabad / India UX Constraints

Use India-specific patterns where relevant:

* ₹ for pricing
* Indian mobile number format
* Indian location/address conventions
* Hyderabad landmarks and neighborhoods
* Indian date/time conventions where appropriate
* Realistic Indian names and profile information

Do not invent specific legal, regulatory, insurance, or ride-sharing requirements.

Do not assume a particular pricing, commission, or payment model.

---

# 9. Matching UX

Prioritize **route compatibility** instead of seat availability.

Matching cards should emphasize:

* Starting location
* Destination
* Date
* Time
* Pickup proximity
* Destination proximity
* Route compatibility
* Driver/passenger verification
* Rating
* Vehicle information where relevant

Example:

**Madhapur → Gachibowli**

**Tomorrow · 8:00 AM**

**Pickup: 1.2 km away**

**Great route match**

**Verified Driver**

Do not show:

**2 seats available**

**Select 1 seat**

or any equivalent seat-related information.

---

# 10. Home Screen Change

The primary Home screen actions should be:

### Request a Ride

For passengers who want to travel somewhere.

### Offer a Ride

For drivers who are already traveling somewhere.

Use these as the two primary actions.

Do not make **Book Ride** or **Select Seat** the primary CTA.

---

# 11. Ride Cards

Create two distinct but visually consistent card types.

### Passenger Ride Request Card

Show:

* Passenger
* From
* To
* Date
* Preferred time
* Pickup area
* Destination
* Verification
* Rating
* Optional preferences
* Request status

### Driver Offered Ride Card

Show:

* Driver
* From
* To
* Date
* Departure time
* Route
* Verification
* Rating
* Vehicle
* Optional preferences
* Match status

Do not display seat information on either card.

---

# 12. Ride Status

Use:

**Request Sent**

→ **Accepted**

→ **Confirmed**

→ **Driver Arriving**

→ **At Pickup**

→ **Ride Started**

→ **Ride Completed**

Remove any seat-booking-specific statuses.

---

# 13. Core UX Principle

The application should communicate one simple concept:

> **"Tell us where you want to go, or tell us where you're going. We'll help you find the right match."**

The experience should prioritize:

* Route
* Time
* Location
* Trust
* Matching
* Communication
* Safety

Do not prioritize seat inventory or traditional booking mechanics.

---

# Constraints

### MUST

* Remove seat selection everywhere.
* Remove seat counts everywhere.
* Remove seat maps everywhere.
* Remove "Book Seat" and equivalent CTAs.
* Allow passengers to post ride requests.
* Allow drivers to post offered rides.
* Make route matching the core product interaction.
* Make Hyderabad the primary location context.
* Support both intra-city and inter-city rides.
* Maintain the existing ShareRide design system unless changes are required by this product-model update.
* Reuse existing components and layouts wherever possible.
* Keep the experience simple and production-oriented.
* Update all affected screens, flows, labels, states, notifications, and prototype connections consistently.

### DO NOT

* Do not redesign the entire application.
* Do not introduce unrelated features.
* Do not introduce seat-selection alternatives.
* Do not create seat capacity controls.
* Do not turn the product into a traditional booking/ticketing application.
* Do not assume legal or business rules.
* Do not hard-code Hyderabad so the product cannot expand to other Indian cities.
* Do not change unrelated visual design-system decisions.

### Final Validation

Before completing the update, verify the entire prototype for any remaining:

**Seat Selection → Seat Count → Available Seats → Book Seat → Seat Booking → Select Seats**

Remove or replace every occurrence so the final ShareRide experience consistently follows the **Passenger Ride Request ↔ Driver Ride Offer → Matching → Mutual Confirmation** model.
