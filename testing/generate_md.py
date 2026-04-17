import json

with open('../reports/TEST_REPORT.json', 'r', encoding='utf-8') as f:
    report = json.load(f)

with open('../reports/TEST_REPORT.md', 'w', encoding='utf-8') as f:
    f.write('# Wayra Travel Companion - Test Report\n\n')
    f.write(f'**Generated**: {report["timestamp"]}\n\n')
    f.write(f'**Model**: {report["model"]}\n\n')
    f.write(f'**Host**: {report["host"]}\n\n')
    f.write('---\n\n')
    
    s = report['summary']
    f.write('## Summary\n\n')
    f.write(f'- **Total Tests**: {s["total_tests"]}\n')
    f.write(f'- **Avg Router Time**: {s["average_router_time"]}s\n')
    f.write(f'- **Avg Specialist Time**: {s["average_specialist_time"]}s\n')
    f.write(f'- **Avg Total Time**: {s["average_total_time"]}s\n\n')
    f.write('---\n\n')
    
    current_category = None
    for test in report['tests']:
        if test['category'] != current_category:
            current_category = test['category']
            f.write(f'\n## {current_category}\n\n')
        
        f.write(f'### Test #{test["test_id"]}\n\n')
        f.write(f'**User Message**: {test["user_message"]}\n\n')
        
        f.write('#### Routing (Stage 1)\n\n')
        routing = test['routing']
        f.write(f'- **Agent**: {routing.get("agent", "ERROR")}\n')
        f.write(f'- **Confidence**: {routing.get("confidence", "NONE")}\n')
        f.write(f'- **Reason**: {routing.get("reason", "")}\n')
        f.write(f'- **Time**: {test["timing"]["router"]}s\n\n')
        
        f.write('#### Specialist Response (Stage 2)\n\n')
        f.write(f'```\n{test["specialist_response"]}\n```\n\n')
        f.write(f'- **Time**: {test["timing"]["specialist"]}s\n\n')
        
        f.write('#### Analysis\n\n')
        f.write(f'{test["analysis"]}\n\n')
        f.write('---\n\n')
