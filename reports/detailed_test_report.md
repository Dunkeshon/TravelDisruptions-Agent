# Wayra Travel Companion - Detailed Test Report

**Generated on:** 2026-04-17
**Model Used:** `gemma4:e4b` (via local Ollama host)
**Total Scenarios Tested:** 8
**Average Total Response Time:** 53.44s

> [!NOTE]
> This report evaluates the two-stage routing system (Router -> Specialist). The router classifies the issue into RUMI (Transport), TIKA (Accommodation), CHASKA (Safety/Risk), AYNI (Border/Visa), or GENERAL.

---

## 01 Mobility Breakdowns

### Scenario 1: Bus delay and low battery
**Prompt:** _"Bus delayed and is getting dark. My battery is 12%. I need the safest way out or sleep under $10"_

* **Redirected Agent:** GENERAL (Medium Confidence)
* **Time Passed:** Router: 17.15s | Specialist: 23.32s | Total: 40.47s
* **Specialist Response:**
  > **Immediately conserve your battery by turning off Wi-Fi and non-essential apps.** Focus on finding a brightly lit, public location nearby (like a gas station lobby, diner, or police station) for temporary shelter and visibility. For sleep, look for budget motels or hostels that offer night rates under $10, or consider waiting until daylight at a safe, well-staffed public space.
* **Analysis:** 
  The router selected `GENERAL` instead of `RUMI` or `TIKA`. This is an acceptable fallback because the prompt contains mixed intents (transport vs accommodation) and safety concerns (dark, low battery). The response is highly practical, specifically addressing the battery issue first, which is critical in this scenario.

### Scenario 2: Train strike and heavy luggage
**Prompt:** _"There's a train strike. The taxi is too expensive. I need carpool or local bus alternatives ASAP. I have heavy luggage"_

* **Redirected Agent:** RUMI (High Confidence)
* **Time Passed:** Router: 4.50s | Specialist: 31.51s | Total: 36.01s
* **Specialist Response:**
  > Rumi suggests focusing on the city's structured transit: Locate the nearest local feeder bus stop for the most affordable route, as these services bypass major rail infrastructure. For luggage security, utilize ride-share apps or official carpooling services rather than hailing street taxis, as they accommodate baggage better. Confirm bus routes and transfer points using a real-time transit app immediately to bypass any disruptions.
* **Analysis:**
  Correctly routed to `RUMI` (Transport). The specialist addressed both the alternative transport requirement (feeder buses/ride-shares) and the constraint of having heavy luggage. Excellent contextual awareness.

---

## 02 Arrival and Accommodation

### Scenario 3: Late arrival and closed hostel
**Prompt:** _"I landed late and the hostel is closed. I am alone at the airport. Find a safe 24/7 alternative nearby <$20"_

* **Redirected Agent:** ERROR (Router Timeout, Fallback to GENERAL)
* **Time Passed:** Router: 32.08s | Specialist: 42.53s | Total: 74.61s
* **Specialist Response:**
  > **Safety First:** Do not wander from the airport area; use a reputable ride-share (Uber/Lyft) to a central, well-lit area instead. On your phone, immediately use Booking.com or Hostelworld to search for "24/7" or "walk-in" accommodations within your maximum budget. If direct lodging isn't available, look for a reputable 24-hour diner or café in a safe neighborhood for basic security until you can secure an alternative stay.
* **Analysis:**
  > [!WARNING]
  > The router timed out after 30 seconds for this request. The system successfully fell back to the `GENERAL` prompt.
  
  Despite the routing failure, the fallback specialist provided solid, actionable advice (staying put, using booking apps, alternative safe locations like 24-hour diners). 

### Scenario 4: Abandoned hostel and no data
**Prompt:** _"The hostel is abandoned, I have no SIM data and it's raining. Find the nearest walk-in bed with Wi-Fi"_

* **Redirected Agent:** TIKA (High Confidence)
* **Time Passed:** Router: 28.57s | Specialist: 34.94s | Total: 63.50s
* **Specialist Response:**
  > **Prioritize safety first:** Immediately head to the nearest visible public area, such as a police station or a large café, to charge your phone and utilize free Wi-Fi to call a taxi or emergency contact. For sheltered rest, I recommend checking **The Courtyard Hostel** (reliable, good Wi-Fi) or **The Station Stay** (closest, usually accepting walk-ins). They are both highly rated for immediate support and will have beds available tonight.
* **Analysis:**
  Perfectly routed to `TIKA` (Accommodation). The response correctly addresses the "no data" constraint by suggesting finding public Wi-Fi first, and then provides hypothetical walk-in bed options. (Note: The LLM hallucinated specific hostel names, which is expected without real-time location grounding APIs attached).

---

## 04 Situational Risk

### Scenario 5: Unsafe taxi dispute
**Prompt:** _"The taxi driver refuses the meter and demands double price. I feel unsafe. How do I de-escalate and pay fair?"_

* **Redirected Agent:** RUMI (High Confidence)
* **Time Passed:** Router: 26.23s | Specialist: 26.39s | Total: 52.62s
* **Specialist Response:**
  > **Immediately exit the vehicle** and find a safer spot. Do not argue; your safety is paramount. Use a ride-sharing app (Uber, Lyft, etc.) or a known dispatch number to request a replacement vehicle for a guaranteed metered fare.
* **Analysis:**
  > [!TIP]
  > The router classified this as `RUMI` (Transport) rather than `CHASKA` (Safety/Risk). While technically a transport issue, the phrase "I feel unsafe" should ideally trigger the safety specialist.
  
  Regardless, the response was highly effective for de-escalation by prioritizing immediate physical safety ("exit the vehicle... do not argue") over financial fairness.

### Scenario 6: Need Uber but no Wi-Fi/SIM at terminal
**Prompt:** _"I need an Uber but Wi-Fi needs local SIM for OTP, I'm stuck at terminal. Where is the nearest honest SIM shop?"_

* **Redirected Agent:** ERROR (Router Timeout, Fallback to GENERAL)
* **Time Passed:** Router: 32.03s | Specialist: 34.07s | Total: 66.10s
* **Specialist Response:**
  > First, check the airport's main information desk or designated lounge for free, temporary Wi-Fi access. If you must buy a SIM, bypass small street vendors and look for the official, branded kiosks of the major telecom providers (e.g., Vodafone, Orange, etc.). These official counters are the most reliable places to purchase an activated, working local SIM card.
* **Analysis:**
  Another router timeout occurred here. The fallback `GENERAL` agent handled the OTP/SIM issue well, advising against street vendors and suggesting looking for official kiosks or airport lounges for temporary Wi-Fi.

---

## 05 Border Crossing

### Scenario 7: Border demands printed proof
**Prompt:** _"At border, the officer needs printed flight proof, but I only have PDF. Where is the nearest printer? Is this a scam?"_

* **Redirected Agent:** AYNI (High Confidence)
* **Time Passed:** Router: 4.72s | Specialist: 33.85s | Total: 38.57s
* **Specialist Response:**
  > The need for printout is often local policy, but your PDF is usually sufficient if displayed on your phone. Check nearby public libraries or major office supply stores (like FedEx or UPS locations) for immediate printing access. Crucially, confirm the document requirement—if the officer insists on print, ask if they will accept a clear screenshot or direct digital viewing of the PDF instead.
* **Analysis:**
  Correctly routed to `AYNI` (Border/Customs). The response attempts to address both the practical (finding a printer) and the procedural (negotiating digital proof). However, advising someone to look for FedEx or a public library at a border crossing is generally impractical; border areas rarely have these facilities. 

### Scenario 8: Cambodia border visa payment scam
**Prompt:** _"I am at the Cambodia border. The visa is $30 and I only have EUR/Local cash. The exchange rate is a scam. Where's the nearest USD ATM?"_

* **Redirected Agent:** AYNI (High Confidence)
* **Time Passed:** Router: 26.58s | Specialist: 29.07s | Total: 55.65s
* **Specialist Response:**
  > As an expert, avoid relying solely on random ATMs; try major bank ATMs (like ABA or ACLEDA) located in the main commercial center. If ATM access is limited, exchange your EUR/local cash for USD at a reputable bank or licensed exchange office *before* the border payment desk. This ensures you have the required cash and avoids unfavorable rates.
* **Analysis:**
  Correctly routed to `AYNI` (Border/Customs). The advice is generally good for the region (mentioning ABA/ACLEDA), but since the user is already *at* the border, walking back to a main commercial center might be difficult. The core advice of exchanging currency before the payment desk is solid.

---

## Summary and Recommendations

1. **Router Timeouts:** The router failed with a timeout in 2 out of 8 cases (25%). To improve reliability, consider increasing the timeout on the Router HTTP request (currently `30s` in `test_scenarios.py`) or optimizing the prompt payload.
2. **Fallback Mechanism Works:** In both timeout scenarios, the system successfully defaulted to the `GENERAL` agent, which provided high-quality advice despite missing the specialized context.
3. **Safety Prioritization:** `RUMI` and `TIKA` agents successfully prioritized the user's immediate physical safety over solving the logistical problem when risk words ("getting dark", "feel unsafe", "abandoned") were present.
4. **Context Hallucination:** The agents sometimes assumed a city-center context (suggesting FedEx, libraries, or specific named hostels) when the user was in an isolated area (like an airport or a border crossing). Integrating an actual geolocation API context into the prompt would solve this.
