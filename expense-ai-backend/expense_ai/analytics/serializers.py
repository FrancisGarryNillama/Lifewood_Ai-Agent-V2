from rest_framework import serializers
from .models import Receipt, AnalyticsQuery, ExportLog

class ReceiptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Receipt
        fields = '__all__'
        read_only_fields = ['user', 'uploaded_at', 'vendor_name', 
                           'total_amount', 'transaction_date', 'category',
                           'vat_amount', 'confidence_score', 'extraction_metadata']


class AnalyticsQuerySerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalyticsQuery
        fields = '__all__'
        read_only_fields = ['user', 'created_at']


class ExportLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExportLog
        fields = '__all__'
        read_only_fields = ['user', 'generated_at']