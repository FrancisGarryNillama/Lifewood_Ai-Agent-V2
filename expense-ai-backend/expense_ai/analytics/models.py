from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator

class Receipt(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    image = models.ImageField(upload_to='receipts/')
    
    # Extracted data
    vendor_name = models.CharField(max_length=255, null=True, blank=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    transaction_date = models.DateField(null=True, blank=True)
    category = models.CharField(max_length=100, null=True, blank=True)
    vat_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # AI metadata
    confidence_score = models.FloatField(
        validators=[MinValueValidator(0.0)],
        null=True,
        blank=True
    )
    extraction_metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-uploaded_at']
        indexes = [
            models.Index(fields=['user', 'transaction_date']),
            models.Index(fields=['category']),
            models.Index(fields=['vendor_name']),
        ]

    def __str__(self):
        return f"{self.vendor_name} - {self.total_amount}"


class AnalyticsQuery(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    query_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    # AI Response
    ai_response = models.JSONField(default=dict)
    chart_config = models.JSONField(default=dict, blank=True)
    
    # Metadata
    filters_applied = models.JSONField(default=dict, blank=True)
    record_count = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['-created_at']


class ExportLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    query_text = models.TextField()
    filters_applied = models.JSONField(default=dict)
    file_name = models.CharField(max_length=255)
    file_path = models.CharField(max_length=500)
    record_count = models.IntegerField()
    generated_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True)
    ai_confidence = models.FloatField(null=True)
    chart_type = models.CharField(max_length=50, null=True, blank=True)
    
    # Export options
    include_summary = models.BooleanField(default=True)
    include_raw_data = models.BooleanField(default=True)
    include_pivot = models.BooleanField(default=False)
    include_charts = models.BooleanField(default=True)
    include_metadata = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-generated_at']
        
    def __str__(self):
        return f"{self.user.username} - {self.file_name}"