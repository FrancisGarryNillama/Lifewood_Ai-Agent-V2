from .base import BaseTool
from typing import Dict, Any, List
import json
from datetime import datetime, date
from decimal import Decimal, InvalidOperation

class ReceiptStoreTool(BaseTool):
    name = "ReceiptStoreTool"
    description = "Stores a validated receipt JSON into the database."

    def execute(self, validated_receipt: Dict, user, **kwargs) -> Dict[str, Any]:
        from analytics.models import Receipt

        try:
            # Parse date safely
            transaction_date = None
            raw_date = validated_receipt.get("transaction_date")
            if raw_date:
                try:
                    transaction_date = datetime.strptime(raw_date, "%Y-%m-%d").date()
                except (ValueError, TypeError):
                    pass

            # Parse amounts safely
            def safe_decimal(val):
                if val is None:
                    return None
                try:
                    return Decimal(str(val))
                except (InvalidOperation, TypeError):
                    return None

            receipt = Receipt.objects.create(
                user=user,
                vendor_name=validated_receipt.get("vendor_name"),
                total_amount=safe_decimal(validated_receipt.get("total_amount")),
                transaction_date=transaction_date,
                category=validated_receipt.get("category"),
                vat_amount=safe_decimal(validated_receipt.get("vat_amount")),
                confidence_score=validated_receipt.get("confidence_score"),
                extraction_metadata=validated_receipt
            )

            return {
                "tool": self.name,
                "status": "success",
                "receipt_id": receipt.id,
                "vendor_name": receipt.vendor_name,
                "total_amount": str(receipt.total_amount),
                "message": f"Receipt stored successfully with ID {receipt.id}"
            }

        except Exception as e:
            return {
                "tool": self.name,
                "status": "error",
                "error": str(e)
            }


class ReceiptQueryTool(BaseTool):
    name = "ReceiptQueryTool"
    description = "Fetches filtered expense dataset based on user filters and role."

    def execute(self, user, filters: Dict = None, **kwargs) -> Dict[str, Any]:
        from analytics.models import Receipt

        try:
            filters = filters or {}
            receipts = Receipt.objects.filter(user=user)

            if filters.get("start_date"):
                receipts = receipts.filter(transaction_date__gte=filters["start_date"])
            if filters.get("end_date"):
                receipts = receipts.filter(transaction_date__lte=filters["end_date"])
            if filters.get("category"):
                receipts = receipts.filter(category__iexact=filters["category"])
            if filters.get("vendor"):
                receipts = receipts.filter(vendor_name__icontains=filters["vendor"])
            if filters.get("min_amount"):
                receipts = receipts.filter(total_amount__gte=filters["min_amount"])
            if filters.get("max_amount"):
                receipts = receipts.filter(total_amount__lte=filters["max_amount"])

            data = list(receipts.values(
                "id", "vendor_name", "total_amount", "transaction_date",
                "category", "vat_amount", "confidence_score", "uploaded_at"
            ))

            # Serialize dates/decimals
            for row in data:
                for key, val in row.items():
                    if isinstance(val, (datetime, date)):
                        row[key] = val.isoformat()
                    elif isinstance(val, Decimal):
                        row[key] = float(val)

            return {
                "tool": self.name,
                "status": "success",
                "dataset": data,
                "record_count": len(data),
                "filters_applied": filters
            }

        except Exception as e:
            return {
                "tool": self.name,
                "status": "error",
                "error": str(e),
                "dataset": []
            }


class AnalyticsTool(BaseTool):
    name = "AnalyticsTool"
    description = "Aggregates expense dataset into summary statistics and chart configuration."

    def execute(self, dataset: List[Dict], query: str, **kwargs) -> Dict[str, Any]:
        import openai
        from django.conf import settings

        openai.api_key = settings.OPENAI_API_KEY

        system_prompt = """You are ExpenseAI Intelligence Agent — Analytics Module.

You receive a structured expense dataset and a user query.
Analyze the data and return ONLY a JSON object with this exact structure:
{
    "summary": "Brief 2-3 sentence narrative summary",
    "insights": ["insight1", "insight2", "insight3"],
    "chart_config": {
        "chart_type": "bar|line|pie",
        "labels": [],
        "values": [],
        "title": "Chart title"
    },
    "statistics": {
        "total": 0,
        "average": 0,
        "max": 0,
        "min": 0,
        "count": 0
    },
    "anomalies": ["any suspicious patterns or outliers"],
    "recommendations": ["actionable recommendation1", "actionable recommendation2"]
}

Use Philippine Peso (₱) for currency formatting in text.
Base all analysis STRICTLY on the provided data. Never fabricate numbers."""

        try:
            response = openai.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": f"Query: {query}\n\nDataset ({len(dataset)} records):\n{json.dumps(dataset[:50], indent=2)}"
                    }
                ],
                temperature=0.2,
                response_format={"type": "json_object"},
                max_tokens=1500
            )

            result = json.loads(response.choices[0].message.content)
            result["tool"] = self.name
            result["status"] = "success"
            result["records_analyzed"] = len(dataset)
            return result

        except Exception as e:
            return {
                "tool": self.name,
                "status": "error",
                "error": str(e),
                "summary": "Analytics failed",
                "insights": [],
                "chart_config": {},
                "statistics": {}
            }


class ExcelExecutiveReportTool(BaseTool):
    name = "ExcelExecutiveReportTool"
    description = "Generates a branded Excel executive report and returns the file bytes."

    def execute(self, user, analytics_result: Dict, dataset: List[Dict],
                query_text: str, filters: Dict = None, options: Dict = None, **kwargs) -> Dict[str, Any]:
        import pandas as pd
        from exports.services.excel_report_builder import ExcelReportBuilder
        from analytics.models import ExportLog
        from datetime import datetime

        options = options or {
            "include_summary": True,
            "include_raw_data": True,
            "include_pivot": False,
            "include_charts": True,
            "include_metadata": True,
        }
        filters = filters or {}

        try:
            df = pd.DataFrame(dataset)

            summary_stats = analytics_result.get("statistics", {})
            summary_stats_formatted = {
                "Total Expenses": summary_stats.get("total", 0),
                "Average Transaction": summary_stats.get("average", 0),
                "Transaction Count": summary_stats.get("count", 0),
                "AI Summary": analytics_result.get("summary", "N/A")
            }

            metadata = {
                "user": user.username,
                "report_title": f"Expense Report — {query_text[:60]}",
                "query_text": query_text,
                "generated_at": datetime.now().isoformat(),
                "filters_applied": str(filters),
                "record_count": len(dataset),
                "agent": "ExpenseAI Intelligence Agent v2.0",
            }

            builder = ExcelReportBuilder(company_name="ExpenseAI Intelligence Platform")
            excel_file = builder.create_report(
                data=df,
                summary_stats=summary_stats_formatted,
                chart_config=analytics_result.get("chart_config", {}),
                metadata=metadata,
                options=options
            )

            filename = f"expenseai_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

            ExportLog.objects.create(
                user=user,
                query_text=query_text,
                filters_applied=filters,
                file_name=filename,
                file_path=f"/exports/{filename}",
                record_count=len(dataset),
                chart_type=analytics_result.get("chart_config", {}).get("chart_type"),
                **{k: options.get(k, True) for k in [
                    "include_summary", "include_raw_data",
                    "include_charts", "include_metadata"
                ]}
            )

            return {
                "tool": self.name,
                "status": "success",
                "file_bytes": excel_file,
                "filename": filename,
                "record_count": len(dataset),
                "message": f"Report '{filename}' generated successfully."
            }

        except Exception as e:
            return {
                "tool": self.name,
                "status": "error",
                "error": str(e)
            }


class MemoryTool(BaseTool):
    name = "MemoryTool"
    description = "Retrieves short-term and long-term memory for the current user."

    def execute(self, user, session=None, limit: int = 10, **kwargs) -> Dict[str, Any]:
        from agent.models import ChatMessage, LongTermMemory

        short_term = []
        if session:
            messages = ChatMessage.objects.filter(
                session=session
            ).order_by("-created_at")[:limit]
            short_term = [
                {"role": m.role, "content": m.content, "timestamp": m.created_at.isoformat()}
                for m in reversed(list(messages))
            ]

        long_term = {}
        try:
            mem = LongTermMemory.objects.get(user=user)
            long_term = {
                "frequent_vendors": mem.frequent_vendors,
                "preferred_period": mem.preferred_period,
                "preferred_chart_type": mem.preferred_chart_type,
                "favorite_categories": mem.favorite_categories,
                "total_queries": mem.total_queries,
                "total_uploads": mem.total_uploads,
                "last_filters": mem.last_filters,
            }
        except LongTermMemory.DoesNotExist:
            pass

        return {
            "tool": self.name,
            "status": "success",
            "short_term_memory": short_term,
            "long_term_memory": long_term,
        }