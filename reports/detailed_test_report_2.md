# Wayra Travel Companion - Detailed Test Report 2 (Post-Refactoring & Timeout Fix)

**Generated on:** 2026-04-17
**Model Used:** `gemma4:e4b` (via local Ollama host)
**Total Scenarios Tested:** 8
**Average Total Response Time:** 44.78s

> [!NOTE]
> This second report reflects the testing done *after* fixing the router timeout threshold (increased from 30s to 120s) and organizing the project structure. We can now observe the true routing behavior for scenarios that previously failed.

---

## 01 Mobility Breakdowns

### Scenario 1: Bus delay and low battery
**Prompt:** _"Bus delayed and is getting dark. My battery is 12%. I need the safest way out or sleep under $10"_

* **Redirected Agent:** CHASKA (High Confidence) *(Previously: GENERAL)*
* **Time Passed:** Router: 32.77s | Specialist: 34.23s | Total: 67.01s
* **Specialist Response:**
  > Conserve your remaining 12% battery for emergency calls only, and immediately prioritize moving to a well-lit, secure public structure—like a lobby or 24-hour business—to minimize exposure risk. If moving is impossible, remain visible, stay in high-traffic areas, and use the remaining power to call a service that can coordinate a safe, low-cost pickup near your location.
* **Analysis:** 
  With enough processing time, the router correctly prioritized the underlying risk ("getting dark", "safest way out") and routed to the `CHASKA` risk specialist instead of falling back to GENERAL. Excellent advice that directly addresses the battery constraint.

### Scenario 2: Train strike and heavy luggage
**Prompt:** _"There's a train strike. The taxi is too expensive. I need carpool or local bus alternatives ASAP. I have heavy luggage"_

* **Redirected Agent:** RUMI (High Confidence)
* **Time Passed:** Router: 4.73s | Specialist: 34.36s | Total: 39.09s
* **Specialist Response:**
  > **RUMI advises:** Focus immediately on community carpool apps or designated ride-share groups, as they are best suited for heavy luggage and budget constraints. Second, check the local public transit schedule for off-peak, dedicated bus lines which may be less crowded. Finally, if luggage capacity is critical, search for shared van or mini-bus services rather than waiting for individual taxis.
* **Analysis:**
  Correctly routed to `RUMI` (Transport). Advice remains highly relevant and practical.

---

## 02 Arrival and Accommodation

### Scenario 3: Late arrival and closed hostel
**Prompt:** _"I landed late and the hostel is closed. I am alone at the airport. Find a safe 24/7 alternative nearby <$20"_

* **Redirected Agent:** TIKA (High Confidence) *(Previously: ERROR Timeout)*
* **Time Passed:** Router: 30.94s | Specialist: 27.30s | Total: 58.24s
* **Specialist Response:**
  > Since I do not have your specific location, I recommend immediately checking the airport's official information boards or using a ride-share app to find nearby airport-hotel lobbies offering late-night lounge access. For immediate safety and sleep, consider reserving an overnight pod or couch corner at a reliable chain hotel rather than a boarding hostel. Alternatively, search for a recognized, heavily-reviewed safe hostel that advertises 24/7 emergency check-in to maximize your chances of meeting the budget.
* **Analysis:**
  > [!TIP]
  > Because the timeout was fixed, this scenario successfully routed to `TIKA` (Accommodation)! 
  
  The response is decent, though it hallucinates that the user might find an "overnight pod" at a chain hotel. The system correctly identifies that it needs the user's specific location to provide actual nearby hotel names.

### Scenario 4: Abandoned hostel and no data
**Prompt:** _"The hostel is abandoned, I have no SIM data and it's raining. Find the nearest walk-in bed with Wi-Fi"_

* **Redirected Agent:** TIKA (High Confidence)
* **Time Passed:** Router: 21.66s | Specialist: 24.29s | Total: 45.95s
* **Specialist Response:**
  > Your immediate safety is paramount; do not enter the abandoned building. Proceed immediately to the nearest main hotel lobby or public community center, as these locations usually provide Wi-Fi and safe shelter. Staff there can help you secure a temporary bed and guide you to safe, operational accommodation nearby.
* **Analysis:**
  Perfectly routed to `TIKA`. Interestingly, this response did not hallucinate specific hotel names like it did in the first test run, making it a much safer and more reliable answer.

---

## 04 Situational Risk

### Scenario 5: Unsafe taxi dispute
**Prompt:** _"The taxi driver refuses the meter and demands double price. I feel unsafe. How do I de-escalate and pay fair?"_

* **Redirected Agent:** RUMI (Medium Confidence)
* **Time Passed:** Router: 4.49s | Specialist: 13.68s | Total: 18.17s
* **Specialist Response:**
  > **RUMI recommends:**
  > 1. **Exit Immediately and Re-enter:** Decline the ride firmly, stating you need a reliable service. Move to a visible, well-populated area.
  > 2. **Use Ride-Share Apps:** Open a verified app (Uber, Lyft, etc.) to request a ride instantly. These use digital meters and track your trip, eliminating cash negotiation.
  > 3. **Flag a Taxi Stand:** If available, wait for a legitimate, official taxi queue or stand. This minimizes the risk of individual negotiation.
* **Analysis:**
  Still routed to `RUMI` (Transport) rather than Risk. The advice is highly structured and focuses entirely on transport alternatives (Uber, Taxi Stand) and exiting the current situation. It effectively de-escalates by telling the user to avoid cash negotiation completely.

### Scenario 6: Need Uber but no Wi-Fi/SIM at terminal
**Prompt:** _"I need an Uber but Wi-Fi needs local SIM for OTP, I'm stuck at terminal. Where is the nearest honest SIM shop?"_

* **Redirected Agent:** GENERAL (High Confidence) *(Previously: ERROR Timeout)*
* **Time Passed:** Router: 21.92s | Specialist: 26.11s | Total: 48.03s
* **Specialist Response:**
  > Check the main concourse or the ground floor services area; major carriers often have official kiosks there. If you can't find a shop immediately, ask a station employee or use a major convenience store kiosk, as they sometimes sell emergency prepaid data bundles. Alternatively, try linking to the terminal's free public Wi-Fi to communicate with an Uber driver and ask them if they can send the ride details via a phone call instead.
* **Analysis:**
  > [!TIP]
  > Since the timeout was resolved, this successfully bypassed the `ERROR` fallback and intentionally routed to the `GENERAL` agent with High confidence.
  
  The logic makes sense since SIM cards and terminal navigation don't strictly fall under Risk, Transport, or Borders.

---

## 05 Border Crossing

### Scenario 7: Border demands printed proof
**Prompt:** _"At border, the officer needs printed flight proof, but I only have PDF. Where is the nearest printer? Is this a scam?"_

* **Redirected Agent:** AYNI (High Confidence)
* **Time Passed:** Router: 4.44s | Specialist: 24.58s | Total: 29.01s
* **Specialist Response:**
  > While the request for a physical copy is standard border protocol, do not panic: immediately use Google Maps to find nearby FedEx, UPS, or print shops. If physical printing is impossible, politely ask the officer if they can accept the PDF on your device or if an email screenshot is sufficient. This is likely a logistical requirement, not a scam, but always have digital backups ready.
* **Analysis:**
  Correctly routed to `AYNI` (Border/Customs). The agent still hallucinates that FedEx/UPS stores exist near border crossings. The secondary advice (ask if an email/screenshot is acceptable) is the real practical solution.

### Scenario 8: Cambodia border visa payment scam
**Prompt:** _"I am at the Cambodia border. The visa is $30 and I only have EUR/Local cash. The exchange rate is a scam. Where's the nearest USD ATM?"_

* **Redirected Agent:** AYNI (High Confidence)
* **Time Passed:** Router: 22.57s | Specialist: 30.16s | Total: 52.73s
* **Specialist Response:**
  > For the visa fee, USD cash is mandatory, so skip the border ATM; they may not accept EUR or have low limits. Find a reputable currency exchange shop in the nearest town center for the best rate to convert your EUR. Alternatively, negotiate if the official border agent will accept a direct EUR conversion at a reduced rate for the visa fee.
* **Analysis:**
  Correctly routed to `AYNI` (Border/Customs). The response accurately notes that USD is mandatory for Cambodian border visas and warns about border ATMs, suggesting a currency exchange shop.

---

## Overall Conclusions Post-Refactoring
1. **0% Timeout Failure:** The 120-second timeout completely fixed the "ERROR" routing issue seen in the first test. All 8 scenarios routed organically.
2. **Better Routing Alignment:** Scenario 1 organically routed to the Risk expert (`CHASKA`) when given enough time, proving the routing logic works well under the hood.
3. **Faster Average Time:** Paradoxically, by preventing the script from hanging on 30s timeouts, the average processing time dropped from ~53s to 44.78s per task. The refactoring did not harm the system's performance.
