import openai
from django.conf import settings
import json
from typing import Dict, List, Any

openai.api_key = settings.OPENAI_API_KEY

class AIAnalyticsService:
    
    SYSTEM_PROMPT = """You are ExpenseAI, a financial analysis expert.

When analyzing expense data:
1. Provide clear, actionable insights
2. Use actual numbers from the data
3. Identify trends and anomalies
4. Format currency in Philippine Peso (₱)

When user requests export:
- Provide structured dataset
- Provide summary statistics
- Provide chart configuration
- Provide pivot configuration instructions
- Return structured JSON only

Always return JSON in this format:
{
    "summary": "Brief text summary",
    "insights": ["insight1", "insight2"],
    "chart_config": {
        "chart_type": "bar|line|pie",
        "labels": [],
        "values": [],
        "title": ""
    },
    "statistics": {
        "total": 0,
        "average": 0,
        "max": 0,
        "min": 0
    },
    "export_ready": true/false,
    "pivot_config": {
        "rows": [],
        "columns": [],
        "values": []
    }
}
"""

    @staticmethod
    def analyze_expenses(query: str, receipts_data: List[Dict]) -> Dict[str, Any]:
        """
        Analyze expenses using GPT-4o-mini
        """
        user_message = f"""
User Query: {query}

Expense Data:
{json.dumps(receipts_data, indent=2, default=str)}

Analyze this data and provide insights.
"""

        try:
            response = openai.ChatCompletion.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": AIAnalyticsService.SYSTEM_PROMPT},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            return result
            
        except Exception as e:
            return {
                "error": str(e),
                "summary": "Failed to analyze data",
                "insights": [],
                "chart_config": {},
                "statistics": {}
            }

    @staticmethod
    def extract_receipt_data(image_base64: str) -> Dict[str, Any]:
        """
        Extract data from receipt image using GPT-4o-mini vision
        """
        try:
            response = openai.ChatCompletion.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "Extract receipt data and return JSON with: vendor_name, total_amount, transaction_date, category, vat_amount, line_items, confidence_score"
                    },
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": "Extract all information from this receipt"},
                            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}}
                        ]
                    }
                ],
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            
            return json.loads(response.choices[0].message.content)
            
        except Exception as e:
            return {"error": str(e)}