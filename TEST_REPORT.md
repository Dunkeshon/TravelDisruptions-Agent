# Wayra Travel Companion - Test Report

**Generated**: 2026-04-17T19:09:23.036582

**Model**: gemma4:e4b

**Host**: http://localhost:11434

---

## Summary

- **Total Tests**: 8
- **Avg Router Time**: 21.48s
- **Avg Specialist Time**: 31.96s
- **Avg Total Time**: 53.44s

---


## 01 Mobility breakdowns

### Test #1

**User Message**: Bus delayed and is getting dark. My battery is 12%. I need the safest way out or sleep under $10

#### Routing (Stage 1)

- **Agent**: GENERAL
- **Confidence**: MEDIUM
- **Reason**: The user mentions both a transport issue (bus delay) and general survival/safety concerns (low battery, needing sleep), making it mixed and unsuitable for a single core category.
- **Time**: 17.15s

#### Specialist Response (Stage 2)

```
**Immediately conserve your battery by turning off Wi-Fi and non-essential apps.** Focus on finding a brightly lit, public location nearby (like a gas station lobby, diner, or police station) for temporary shelter and visibility. For sleep, look for budget motels or hostels that offer night rates under $10, or consider waiting until daylight at a safe, well-staffed public space.
```

- **Time**: 23.32s

#### Analysis

Router correctly identified GENERAL with MEDIUM confidence. Specialist provided relevant advice for GENERAL scenario.

---

### Test #2

**User Message**: There's a train strike. The taxi is too expensive. I need carpool or local bus alternatives ASAP. I have heavy luggage

#### Routing (Stage 1)

- **Agent**: RUMI
- **Confidence**: HIGH
- **Reason**: The message discusses a train strike and needing alternative transportation due to travel disruptions.
- **Time**: 4.5s

#### Specialist Response (Stage 2)

```
Rumi suggests focusing on the city's structured transit: Locate the nearest local feeder bus stop for the most affordable route, as these services bypass major rail infrastructure. For luggage security, utilize ride-share apps or official carpooling services rather than hailing street taxis, as they accommodate baggage better. Confirm bus routes and transfer points using a real-time transit app immediately to bypass any disruptions.
```

- **Time**: 31.51s

#### Analysis

Router correctly identified RUMI with HIGH confidence. Specialist provided relevant advice for RUMI scenario.

---


## 02 Arrival and accommodation

### Test #3

**User Message**: I landed late and the hostel is closed. I am alone at the airport. Find a safe 24/7 alternative nearby <$20

#### Routing (Stage 1)

- **Agent**: ERROR
- **Confidence**: NONE
- **Reason**: HTTPConnectionPool(host='localhost', port=11434): Read timed out. (read timeout=30)
- **Time**: 32.08s

#### Specialist Response (Stage 2)

```
**Safety First:** Do not wander from the airport area; use a reputable ride-share (Uber/Lyft) to a central, well-lit area instead. On your phone, immediately use Booking.com or Hostelworld to search for "24/7" or "walk-in" accommodations within your maximum budget. If direct lodging isn't available, look for a reputable 24-hour diner or café in a safe neighborhood for basic security until you can secure an alternative stay.
```

- **Time**: 42.53s

#### Analysis

Router correctly identified ERROR with NONE confidence. Specialist provided relevant advice for ERROR scenario.

---

### Test #4

**User Message**: The hostel is abandoned, I have no SIM data and it's raining. Find the nearest walk-in bed with Wi-Fi

#### Routing (Stage 1)

- **Agent**: TIKA
- **Confidence**: HIGH
- **Reason**: The user is seeking alternative accommodation and lodging solutions after their initial hostel failed.
- **Time**: 28.57s

#### Specialist Response (Stage 2)

```
**Prioritize safety first:** Immediately head to the nearest visible public area, such as a police station or a large café, to charge your phone and utilize free Wi-Fi to call a taxi or emergency contact. For sheltered rest, I recommend checking **The Courtyard Hostel** (reliable, good Wi-Fi) or **The Station Stay** (closest, usually accepting walk-ins). They are both highly rated for immediate support and will have beds available tonight.
```

- **Time**: 34.94s

#### Analysis

Router correctly identified TIKA with HIGH confidence. Specialist provided relevant advice for TIKA scenario.

---


## 04 Situational risk

### Test #5

**User Message**: The taxi driver refuses the meter and demands double price. I feel unsafe. How do I de-escalate and pay fair?

#### Routing (Stage 1)

- **Agent**: RUMI
- **Confidence**: HIGH
- **Reason**: The message describes a dispute and difficulty with a taxi ride, which falls under transport issues.
- **Time**: 26.23s

#### Specialist Response (Stage 2)

```
**Immediately exit the vehicle** and find a safer spot. Do not argue; your safety is paramount. Use a ride-sharing app (Uber, Lyft, etc.) or a known dispatch number to request a replacement vehicle for a guaranteed metered fare.
```

- **Time**: 26.39s

#### Analysis

Router correctly identified RUMI with HIGH confidence. Specialist provided relevant advice for RUMI scenario.

---

### Test #6

**User Message**: I need an Uber but Wi-Fi needs local SIM for OTP, I'm stuck at terminal. Where is the nearest honest SIM shop?

#### Routing (Stage 1)

- **Agent**: ERROR
- **Confidence**: NONE
- **Reason**: HTTPConnectionPool(host='localhost', port=11434): Read timed out. (read timeout=30)
- **Time**: 32.03s

#### Specialist Response (Stage 2)

```
First, check the airport's main information desk or designated lounge for free, temporary Wi-Fi access. If you must buy a SIM, bypass small street vendors and look for the official, branded kiosks of the major telecom providers (e.g., Vodafone, Orange, etc.). These official counters are the most reliable places to purchase an activated, working local SIM card.
```

- **Time**: 34.07s

#### Analysis

Router correctly identified ERROR with NONE confidence. Specialist provided relevant advice for ERROR scenario.

---


## 05 Border crossing

### Test #7

**User Message**: At border, the officer needs printed flight proof, but I only have PDF. Where is the nearest printer? Is this a scam?

#### Routing (Stage 1)

- **Agent**: AYNI
- **Confidence**: HIGH
- **Reason**: The message mentions a border crossing and issues related to documentation.
- **Time**: 4.72s

#### Specialist Response (Stage 2)

```
The need for printout is often local policy, but your PDF is usually sufficient if displayed on your phone. Check nearby public libraries or major office supply stores (like FedEx or UPS locations) for immediate printing access. Crucially, confirm the document requirement—if the officer insists on print, ask if they will accept a clear screenshot or direct digital viewing of the PDF instead.
```

- **Time**: 33.85s

#### Analysis

Router correctly identified AYNI with HIGH confidence. Specialist provided relevant advice for AYNI scenario.

---

### Test #8

**User Message**: I am at the Cambodia border. The visa is $30 and I only have EUR/Local cash. The exchange rate is a scam. Where's the nearest USD ATM?

#### Routing (Stage 1)

- **Agent**: AYNI
- **Confidence**: HIGH
- **Reason**: The message specifically discusses a border crossing and visa requirements.
- **Time**: 26.58s

#### Specialist Response (Stage 2)

```
As an expert, avoid relying solely on random ATMs; try major bank ATMs (like ABA or ACLEDA) located in the main commercial center. If ATM access is limited, exchange your EUR/local cash for USD at a reputable bank or licensed exchange office *before* the border payment desk. This ensures you have the required cash and avoids unfavorable rates.
```

- **Time**: 29.07s

#### Analysis

Router correctly identified AYNI with HIGH confidence. Specialist provided relevant advice for AYNI scenario.

---

