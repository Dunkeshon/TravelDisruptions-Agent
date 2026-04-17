# Wayra Travel Companion - Test Report

**Generated**: 2026-04-17T19:43:01.254469

**Model**: gemma4:e4b

**Host**: http://localhost:11434

---

## Summary

- **Total Tests**: 8
- **Avg Router Time**: 17.94s
- **Avg Specialist Time**: 26.84s
- **Avg Total Time**: 44.78s

---


## 01 Mobility breakdowns

### Test #1

**User Message**: Bus delayed and is getting dark. My battery is 12%. I need the safest way out or sleep under $10

#### Routing (Stage 1)

- **Agent**: CHASKA
- **Confidence**: HIGH
- **Reason**: The message primarily expresses immediate safety concerns regarding darkness, low battery, and needing the safest way out, making safety the main priority.
- **Time**: 32.77s

#### Specialist Response (Stage 2)

```
Conserve your remaining 12% battery for emergency calls only, and immediately prioritize moving to a well-lit, secure public structure—like a lobby or 24-hour business—to minimize exposure risk. If moving is impossible, remain visible, stay in high-traffic areas, and use the remaining power to call a service that can coordinate a safe, low-cost pickup near your location.
```

- **Time**: 34.23s

#### Analysis

Router correctly identified CHASKA with HIGH confidence. Specialist provided relevant advice for CHASKA scenario.

---

### Test #2

**User Message**: There's a train strike. The taxi is too expensive. I need carpool or local bus alternatives ASAP. I have heavy luggage

#### Routing (Stage 1)

- **Agent**: RUMI
- **Confidence**: HIGH
- **Reason**: The message discusses a cancelled or disrupted transportation method (train strike) and seeks immediate alternatives (bus, carpool).
- **Time**: 4.73s

#### Specialist Response (Stage 2)

```
**RUMI advises:** Focus immediately on community carpool apps or designated ride-share groups, as they are best suited for heavy luggage and budget constraints. Second, check the local public transit schedule for off-peak, dedicated bus lines which may be less crowded. Finally, if luggage capacity is critical, search for shared van or mini-bus services rather than waiting for individual taxis.
```

- **Time**: 34.36s

#### Analysis

Router correctly identified RUMI with HIGH confidence. Specialist provided relevant advice for RUMI scenario.

---


## 02 Arrival and accommodation

### Test #3

**User Message**: I landed late and the hostel is closed. I am alone at the airport. Find a safe 24/7 alternative nearby <$20

#### Routing (Stage 1)

- **Agent**: TIKA
- **Confidence**: HIGH
- **Reason**: The user is seeking alternative accommodation after their planned hostel stay was closed.
- **Time**: 30.94s

#### Specialist Response (Stage 2)

```
Since I do not have your specific location, I recommend immediately checking the airport's official information boards or using a ride-share app to find nearby airport-hotel lobbies offering late-night lounge access. For immediate safety and sleep, consider reserving an overnight pod or couch corner at a reliable chain hotel rather than a boarding hostel. Alternatively, search for a recognized, heavily-reviewed safe hostel that advertises 24/7 emergency check-in to maximize your chances of meeting the budget.
```

- **Time**: 27.3s

#### Analysis

Router correctly identified TIKA with HIGH confidence. Specialist provided relevant advice for TIKA scenario.

---

### Test #4

**User Message**: The hostel is abandoned, I have no SIM data and it's raining. Find the nearest walk-in bed with Wi-Fi

#### Routing (Stage 1)

- **Agent**: TIKA
- **Confidence**: HIGH
- **Reason**: The user is seeking alternative lodging (a bed) because their planned accommodation (the hostel) is abandoned.
- **Time**: 21.66s

#### Specialist Response (Stage 2)

```
Your immediate safety is paramount; do not enter the abandoned building. Proceed immediately to the nearest main hotel lobby or public community center, as these locations usually provide Wi-Fi and safe shelter. Staff there can help you secure a temporary bed and guide you to safe, operational accommodation nearby.
```

- **Time**: 24.29s

#### Analysis

Router correctly identified TIKA with HIGH confidence. Specialist provided relevant advice for TIKA scenario.

---


## 04 Situational risk

### Test #5

**User Message**: The taxi driver refuses the meter and demands double price. I feel unsafe. How do I de-escalate and pay fair?

#### Routing (Stage 1)

- **Agent**: RUMI
- **Confidence**: MEDIUM
- **Reason**: The message pertains to a problem with the cost and service of a taxi ride, suggesting a transport issue.
- **Time**: 4.49s

#### Specialist Response (Stage 2)

```
**RUMI recommends:**

1. **Exit Immediately and Re-enter:** Decline the ride firmly, stating you need a reliable service. Move to a visible, well-populated area.
2. **Use Ride-Share Apps:** Open a verified app (Uber, Lyft, etc.) to request a ride instantly. These use digital meters and track your trip, eliminating cash negotiation.
3. **Flag a Taxi Stand:** If available, wait for a legitimate, official taxi queue or stand. This minimizes the risk of individual negotiation.
```

- **Time**: 13.68s

#### Analysis

Router correctly identified RUMI with MEDIUM confidence. Specialist provided relevant advice for RUMI scenario.

---

### Test #6

**User Message**: I need an Uber but Wi-Fi needs local SIM for OTP, I'm stuck at terminal. Where is the nearest honest SIM shop?

#### Routing (Stage 1)

- **Agent**: GENERAL
- **Confidence**: HIGH
- **Reason**: The user is seeking general logistical advice and assistance regarding local services (SIM shops) to facilitate travel planning.
- **Time**: 21.92s

#### Specialist Response (Stage 2)

```
Check the main concourse or the ground floor services area; major carriers often have official kiosks there. If you can't find a shop immediately, ask a station employee or use a major convenience store kiosk, as they sometimes sell emergency prepaid data bundles. Alternatively, try linking to the terminal's free public Wi-Fi to communicate with an Uber driver and ask them if they can send the ride details via a phone call instead.
```

- **Time**: 26.11s

#### Analysis

Router correctly identified GENERAL with HIGH confidence. Specialist provided relevant advice for GENERAL scenario.

---


## 05 Border crossing

### Test #7

**User Message**: At border, the officer needs printed flight proof, but I only have PDF. Where is the nearest printer? Is this a scam?

#### Routing (Stage 1)

- **Agent**: AYNI
- **Confidence**: HIGH
- **Reason**: The user mentions being at a border and dealing with documentation requirements.
- **Time**: 4.44s

#### Specialist Response (Stage 2)

```
While the request for a physical copy is standard border protocol, do not panic: immediately use Google Maps to find nearby FedEx, UPS, or print shops. If physical printing is impossible, politely ask the officer if they can accept the PDF on your device or if an email screenshot is sufficient. This is likely a logistical requirement, not a scam, but always have digital backups ready.
```

- **Time**: 24.58s

#### Analysis

Router correctly identified AYNI with HIGH confidence. Specialist provided relevant advice for AYNI scenario.

---

### Test #8

**User Message**: I am at the Cambodia border. The visa is $30 and I only have EUR/Local cash. The exchange rate is a scam. Where's the nearest USD ATM?

#### Routing (Stage 1)

- **Agent**: AYNI
- **Confidence**: HIGH
- **Reason**: The message concerns documentation, visas, and currency exchange at an international border crossing.
- **Time**: 22.57s

#### Specialist Response (Stage 2)

```
For the visa fee, USD cash is mandatory, so skip the border ATM; they may not accept EUR or have low limits. Find a reputable currency exchange shop in the nearest town center for the best rate to convert your EUR. Alternatively, negotiate if the official border agent will accept a direct EUR conversion at a reduced rate for the visa fee.
```

- **Time**: 30.16s

#### Analysis

Router correctly identified AYNI with HIGH confidence. Specialist provided relevant advice for AYNI scenario.

---

