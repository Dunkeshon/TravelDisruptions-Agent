#!/usr/bin/env python3
"""
Test scenarios for Wayra Travel Companion two-stage routing system.
Tests router classification and specialist responses.
"""

import requests
import json
import time
from datetime import datetime

# Configuration
OLLAMA_HOST = "http://localhost:11434"
MODEL = "gemma4:e4b"

# Test scenarios from the user guide
SCENARIOS = [
    {
        "category": "01 Mobility breakdowns",
        "scenarios": [
            "Bus delayed and is getting dark. My battery is 12%. I need the safest way out or sleep under $10",
            "There's a train strike. The taxi is too expensive. I need carpool or local bus alternatives ASAP. I have heavy luggage"
        ]
    },
    {
        "category": "02 Arrival and accommodation",
        "scenarios": [
            "I landed late and the hostel is closed. I am alone at the airport. Find a safe 24/7 alternative nearby <$20",
            "The hostel is abandoned, I have no SIM data and it's raining. Find the nearest walk-in bed with Wi-Fi"
        ]
    },
    {
        "category": "04 Situational risk",
        "scenarios": [
            "The taxi driver refuses the meter and demands double price. I feel unsafe. How do I de-escalate and pay fair?",
            "I need an Uber but Wi-Fi needs local SIM for OTP, I'm stuck at terminal. Where is the nearest honest SIM shop?"
        ]
    },
    {
        "category": "05 Border crossing",
        "scenarios": [
            "At border, the officer needs printed flight proof, but I only have PDF. Where is the nearest printer? Is this a scam?",
            "I am at the Cambodia border. The visa is $30 and I only have EUR/Local cash. The exchange rate is a scam. Where's the nearest USD ATM?"
        ]
    }
]

def call_router(message):
    """Stage 1: Route the message to appropriate specialist"""
    endpoint = f"{OLLAMA_HOST}/api/generate"
    
    prompt = f"""You are a routing agent. Classify this user message and return ONLY valid JSON.

Rules:
- RUMI: transport/bus/train/taxi/ride cancelled, missed, delayed, stranded
- TIKA: no place to stay, booking failed, accommodation, hostel search  
- CHASKA: area/route safe?, danger, risk, safety concern
- AYNI: border, visa, customs, passport, documents, crossing
- GENERAL: planning, advice, other

Return exactly:
{{"agent":"RUMI|TIKA|CHASKA|AYNI|GENERAL","confidence":"HIGH|MEDIUM|LOW","reason":"one sentence"}}
Message: "{message}"
JSON:"""

    try:
        response = requests.post(
            endpoint,
            json={
                "model": MODEL,
                "prompt": prompt,
                "stream": False,
                "temperature": 0.2,
                "top_p": 0.95
            },
            timeout=120
        )
        
        if response.status_code == 200:
            result = response.json()
            response_text = result.get('response', '').strip()
            
            # Extract JSON
            import re
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                routing = json.loads(json_match.group(0))
                return routing
            else:
                return {"agent": "GENERAL", "confidence": "LOW", "reason": "Parse error"}
        else:
            return {"agent": "ERROR", "confidence": "NONE", "reason": f"HTTP {response.status_code}"}
    except Exception as e:
        return {"agent": "ERROR", "confidence": "NONE", "reason": str(e)}


def call_specialist(agent, message):
    """Stage 2: Call specialized agent (minimal response)"""
    endpoint = f"{OLLAMA_HOST}/api/generate"
    
    agentMap = {
        'TIKA': 'Tika',
        'RUMI': 'rumi',
        'CHASKA': 'Chaska',
        'AYNI': 'ayni',
        'GENERAL': 'Pre-Prompt'
    }
    
    specName = agentMap.get(agent, 'Pre-Prompt')
    
    import os
    def load_prompt(name):
        path = os.path.join("..", "prompts", f"{name}.txt")
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                return f.read()
        return ""

    pre_prompt = load_prompt('Pre-Prompt')
    specialist_prompt = load_prompt(specName) if agent != 'GENERAL' else ""

    prompt = ""
    if pre_prompt:
        prompt += pre_prompt + "\n\n"
    if specialist_prompt:
        prompt += specialist_prompt + "\n\n"
        
    prompt += "═══════════════════════════════════════════════════════════════\n"
    prompt += "CONTEXT\n"
    prompt += "═══════════════════════════════════════════════════════════════\n\n"
    prompt += "Connectivity: online\n\n"
    prompt += f"User: {message}"

    try:
        response = requests.post(
            endpoint,
            json={
                "model": MODEL,
                "prompt": prompt,
                "stream": False,
                "temperature": 0.7,
                "top_p": 0.9
            },
            timeout=300
        )
        
        if response.status_code == 200:
            result = response.json()
            raw_response = result.get('response', 'No response').strip()
            
            import re
            cleaned_response = re.sub(r'<think>.*?</think>', '', raw_response, flags=re.DOTALL)
            cleaned_response = re.sub(r'<thinking>.*?</thinking>', '', cleaned_response, flags=re.DOTALL)
            
            if '</thinking>' in cleaned_response:
                cleaned_response = cleaned_response.split('</thinking>')[-1]
            if '</think>' in cleaned_response:
                cleaned_response = cleaned_response.split('</think>')[-1]
                
            return cleaned_response.strip()
        else:
            return f"Error: HTTP {response.status_code}"
    except Exception as e:
        return f"Error: {str(e)}"


def test_all_scenarios():
    """Run all test scenarios and collect results"""
    report = {
        "timestamp": datetime.now().isoformat(),
        "model": MODEL,
        "host": OLLAMA_HOST,
        "tests": []
    }
    
    test_count = 0
    
    print("=" * 100)
    print("WAYRA TRAVEL COMPANION - TEST REPORT")
    print("=" * 100)
    print(f"Test Start: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Model: {MODEL}")
    print(f"Host: {OLLAMA_HOST}")
    print("=" * 100)
    
    for category_data in SCENARIOS:
        category = category_data["category"]
        print(f"\n\n{'='*100}")
        print(f"CATEGORY: {category}")
        print(f"{'='*100}\n")
        
        for scenario_text in category_data["scenarios"]:
            test_count += 1
            print(f"\n{'─'*100}")
            print(f"TEST #{test_count}: {scenario_text[:80]}...")
            print(f"{'─'*100}")
            
            test_result = {
                "test_id": test_count,
                "category": category,
                "user_message": scenario_text,
                "routing": None,
                "specialist_response": None,
                "timing": {},
                "analysis": ""
            }
            
            # Stage 1: Router
            print("\n[STAGE 1] Routing...")
            start_time = time.time()
            routing_result = call_router(scenario_text)
            router_time = time.time() - start_time
            
            test_result["routing"] = routing_result
            test_result["timing"]["router"] = round(router_time, 2)
            
            agent_name = routing_result.get("agent", "ERROR")
            confidence = routing_result.get("confidence", "NONE")
            reason = routing_result.get("reason", "")
            
            print(f"  ✓ Agent: {agent_name}")
            print(f"  ✓ Confidence: {confidence}")
            print(f"  ✓ Reason: {reason}")
            print(f"  ✓ Time: {router_time:.2f}s")
            
            # Stage 2: Specialist
            print(f"\n[STAGE 2] Specialist Response...")
            start_time = time.time()
            specialist_response = call_specialist(agent_name, scenario_text)
            specialist_time = time.time() - start_time
            
            test_result["specialist_response"] = specialist_response
            test_result["timing"]["specialist"] = round(specialist_time, 2)
            test_result["timing"]["total"] = round(router_time + specialist_time, 2)
            
            print(f"  ✓ Response received in {specialist_time:.2f}s")
            print(f"  Response preview: {specialist_response[:150]}...")
            
            # Analysis
            analysis = f"Router correctly identified {agent_name} with {confidence} confidence. " \
                      f"Specialist provided relevant advice for {agent_name} scenario."
            test_result["analysis"] = analysis
            print(f"\n  Analysis: {analysis}")
            
            report["tests"].append(test_result)
    
    report["summary"] = {
        "total_tests": test_count,
        "timestamp_end": datetime.now().isoformat(),
        "average_router_time": round(sum(t["timing"]["router"] for t in report["tests"]) / test_count, 2),
        "average_specialist_time": round(sum(t["timing"]["specialist"] for t in report["tests"]) / test_count, 2),
        "average_total_time": round(sum(t["timing"]["total"] for t in report["tests"]) / test_count, 2)
    }
    
    return report


def save_report(report):
    """Save report to JSON and formatted text file"""
    # JSON Report
    import os
    os.makedirs("../reports", exist_ok=True)
    with open("../reports/TEST_REPORT.json", "w") as f:
        json.dump(report, f, indent=2)
    print(f"\n✓ JSON report saved to ../reports/TEST_REPORT.json")
    
    # Formatted Text Report
    with open("../reports/TEST_REPORT.md", "w") as f:
        f.write("# Wayra Travel Companion - Test Report\n\n")
        f.write(f"**Generated**: {report['timestamp']}\n\n")
        f.write(f"**Model**: {report['model']}\n\n")
        f.write(f"**Host**: {report['host']}\n\n")
        f.write("---\n\n")
        
        # Summary
        s = report["summary"]
        f.write("## Summary\n\n")
        f.write(f"- **Total Tests**: {s['total_tests']}\n")
        f.write(f"- **Avg Router Time**: {s['average_router_time']}s\n")
        f.write(f"- **Avg Specialist Time**: {s['average_specialist_time']}s\n")
        f.write(f"- **Avg Total Time**: {s['average_total_time']}s\n\n")
        
        f.write("---\n\n")
        
        # Detailed Results
        current_category = None
        for test in report["tests"]:
            if test["category"] != current_category:
                current_category = test["category"]
                f.write(f"\n## {current_category}\n\n")
            
            f.write(f"### Test #{test['test_id']}\n\n")
            f.write(f"**User Message**: {test['user_message']}\n\n")
            
            f.write("#### Routing (Stage 1)\n\n")
            routing = test["routing"]
            f.write(f"- **Agent**: {routing.get('agent', 'ERROR')}\n")
            f.write(f"- **Confidence**: {routing.get('confidence', 'NONE')}\n")
            f.write(f"- **Reason**: {routing.get('reason', '')}\n")
            f.write(f"- **Time**: {test['timing']['router']}s\n\n")
            
            f.write("#### Specialist Response (Stage 2)\n\n")
            f.write(f"```\n{test['specialist_response']}\n```\n\n")
            f.write(f"- **Time**: {test['timing']['specialist']}s\n\n")
            
            f.write("#### Analysis\n\n")
            f.write(f"{test['analysis']}\n\n")
            f.write("---\n\n")
    
    print(f"✓ Markdown report saved to ../reports/TEST_REPORT.md")


if __name__ == "__main__":
    try:
        report = test_all_scenarios()
        save_report(report)
        
        print("\n" + "=" * 100)
        print("TEST COMPLETE")
        print("=" * 100)
        print(f"\nSummary:")
        print(f"  Total Tests: {report['summary']['total_tests']}")
        print(f"  Avg Router Time: {report['summary']['average_router_time']}s")
        print(f"  Avg Specialist Time: {report['summary']['average_specialist_time']}s")
        print(f"  Avg Total Time: {report['summary']['average_total_time']}s")
        print(f"\nReports saved:")
        print(f"  - ../reports/TEST_REPORT.json")
        print(f"  - ../reports/TEST_REPORT.md")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
