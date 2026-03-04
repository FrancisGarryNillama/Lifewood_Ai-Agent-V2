from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
from django.db.models import Q, Sum, Avg, Count
from .models import Receipt, AnalyticsQuery, ExportLog
from .serializers import ReceiptSerializer, AnalyticsQuerySerializer, ExportLogSerializer
from .services.ai_service import AIAnalyticsService
from exports.services.excel_report_builder import ExcelReportBuilder
import pandas as pd
from datetime import datetime
import base64

class ReceiptViewSet(viewsets.ModelViewSet):
    serializer_class = ReceiptSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Receipt.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        # Extract image and convert to base64
        image = self.request.FILES.get('image')
        if image:
            image_base64 = base64.b64encode(image.read()).decode('utf-8')
            
            # Extract data using AI
            extracted_data = AIAnalyticsService.extract_receipt_data(image_base64)
            
            serializer.save(
                user=self.request.user,
                vendor_name=extracted_data.get('vendor_name'),
                total_amount=extracted_data.get('total_amount'),
                transaction_date=extracted_data.get('transaction_date'),
                category=extracted_data.get('category'),
                vat_amount=extracted_data.get('vat_amount'),
                confidence_score=extracted_data.get('confidence_score'),
                extraction_metadata=extracted_data
            )


class AnalyticsViewSet(viewsets.ModelViewSet):
    serializer_class = AnalyticsQuerySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return AnalyticsQuery.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def analyze(self, request):
        """
        Analyze expenses based on user query
        """
        query_text = request.data.get('query', '')
        filters = request.data.get('filters', {})
        
        # Build queryset
        receipts = Receipt.objects.filter(user=request.user)
        
        # Apply filters
        if filters.get('start_date'):
            receipts = receipts.filter(transaction_date__gte=filters['start_date'])
        if filters.get('end_date'):
            receipts = receipts.filter(transaction_date__lte=filters['end_date'])
        if filters.get('category'):
            receipts = receipts.filter(category=filters['category'])
        if filters.get('vendor'):
            receipts = receipts.filter(vendor_name__icontains=filters['vendor'])
        
        # Prepare data for AI
        receipts_data = list(receipts.values(
            'vendor_name', 'total_amount', 'transaction_date',
            'category', 'vat_amount', 'confidence_score'
        ))
        
        # Get AI analysis
        ai_result = AIAnalyticsService.analyze_expenses(query_text, receipts_data)
        
        # Save query
        analytics_query = AnalyticsQuery.objects.create(
            user=request.user,
            query_text=query_text,
            ai_response=ai_result,
            chart_config=ai_result.get('chart_config', {}),
            filters_applied=filters,
            record_count=len(receipts_data)
        )
        
        return Response({
            'query_id': analytics_query.id,
            'summary': ai_result.get('summary'),
            'insights': ai_result.get('insights'),
            'chart_config': ai_result.get('chart_config'),
            'statistics': ai_result.get('statistics'),
            'record_count': len(receipts_data),
            'export_ready': ai_result.get('export_ready', True)
        })
    
    @action(detail=True, methods=['post'])
    def export_to_excel(self, request, pk=None):
        """
        Export analytics results to Excel
        """
        analytics_query = self.get_object()
        export_options = request.data.get('options', {})
        
        # Get receipts data
        receipts = Receipt.objects.filter(user=request.user)
        
        # Apply saved filters
        filters = analytics_query.filters_applied
        if filters.get('start_date'):
            receipts = receipts.filter(transaction_date__gte=filters['start_date'])
        if filters.get('end_date'):
            receipts = receipts.filter(transaction_date__lte=filters['end_date'])
        if filters.get('category'):
            receipts = receipts.filter(category=filters['category'])
        
        # Convert to DataFrame
        df = pd.DataFrame(list(receipts.values(
            'vendor_name', 'total_amount', 'transaction_date',
            'category', 'vat_amount', 'confidence_score'
        )))
        
        # Prepare summary stats
        summary_stats = {
            'Total Expenses': receipts.aggregate(Sum('total_amount'))['total_amount__sum'] or 0,
            'Average Transaction': receipts.aggregate(Avg('total_amount'))['total_amount__avg'] or 0,
            'Transaction Count': receipts.count(),
            'Total VAT': receipts.aggregate(Sum('vat_amount'))['vat_amount__sum'] or 0,
        }
        
        # Prepare metadata
        metadata = {
            'user': request.user.username,
            'report_title': f"Expense Report - {analytics_query.query_text[:50]}",
            'query_text': analytics_query.query_text,
            'generated_at': datetime.now().isoformat(),
            'filters_applied': filters,
            'record_count': len(df),
            'ip_address': request.META.get('REMOTE_ADDR'),
        }
        
        # Build Excel report
        builder = ExcelReportBuilder(company_name="ExpenseAI Platform")
        excel_file = builder.create_report(
            data=df,
            summary_stats=summary_stats,
            chart_config=analytics_query.chart_config,
            metadata=metadata,
            options=export_options
        )
        
        # Generate filename
        filename = f"expense_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        
        # Log export
        ExportLog.objects.create(
            user=request.user,
            query_text=analytics_query.query_text,
            filters_applied=filters,
            file_name=filename,
            file_path=f"/exports/{filename}",
            record_count=len(df),
            ip_address=request.META.get('REMOTE_ADDR'),
            ai_confidence=analytics_query.ai_response.get('statistics', {}).get('confidence'),
            chart_type=analytics_query.chart_config.get('chart_type'),
            **export_options
        )
        
        # Return file
        response = HttpResponse(
            excel_file.read(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response


class ExportLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ExportLogSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ExportLog.objects.filter(user=self.request.user)