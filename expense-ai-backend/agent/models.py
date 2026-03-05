from django.db import models
from django.contrib.auth.models import User
import uuid


class ChatSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_sessions')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    title = models.CharField(max_length=255, blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"Session {self.id} - {self.user.username}"


class ChatMessage(models.Model):
    ROLE_CHOICES = [
        ('user', 'User'),
        ('agent', 'Agent'),
        ('tool', 'Tool'),
        ('system', 'System'),
    ]

    STATE_CHOICES = [
        ('IDLE', 'Idle'),
        ('INTENT_CLASSIFICATION', 'Intent Classification'),
        ('TOOL_SELECTION', 'Tool Selection'),
        ('TOOL_EXECUTION', 'Tool Execution'),
        ('OUTPUT_VALIDATION', 'Output Validation'),
        ('MEMORY_UPDATE', 'Memory Update'),
        ('RESPONSE', 'Response'),
    ]

    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    # Agent metadata
    agent_state = models.CharField(max_length=50, choices=STATE_CHOICES, null=True, blank=True)
    tools_used = models.JSONField(default=list, blank=True)
    tool_outputs = models.JSONField(default=dict, blank=True)
    confidence_score = models.FloatField(null=True, blank=True)
    reasoning_trace = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"[{self.role}] {self.content[:50]}"


class GovernanceLog(models.Model):
    ACTION_CHOICES = [
        ('TOOL_CALL', 'Tool Call'),
        ('DATA_ACCESS', 'Data Access'),
        ('EXPORT', 'Export'),
        ('ANALYTICS', 'Analytics'),
        ('RECEIPT_UPLOAD', 'Receipt Upload'),
        ('POLICY_VIOLATION', 'Policy Violation'),
    ]

    STATUS_CHOICES = [
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('FLAGGED', 'Flagged'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='governance_logs')
    session = models.ForeignKey(ChatSession, on_delete=models.SET_NULL, null=True, blank=True)
    action_type = models.CharField(max_length=30, choices=ACTION_CHOICES)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES)
    tool_name = models.CharField(max_length=100, null=True, blank=True)
    input_data = models.JSONField(default=dict, blank=True)
    output_data = models.JSONField(default=dict, blank=True)
    rejection_reason = models.TextField(null=True, blank=True)
    confidence_score = models.FloatField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    schema_valid = models.BooleanField(default=True)
    role_permitted = models.BooleanField(default=True)
    scope_enforced = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.action_type} - {self.status} - {self.user.username}"


class LongTermMemory(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='agent_memory')
    frequent_vendors = models.JSONField(default=list, blank=True)
    preferred_period = models.CharField(max_length=50, null=True, blank=True)
    preferred_chart_type = models.CharField(max_length=50, null=True, blank=True)
    favorite_categories = models.JSONField(default=list, blank=True)
    total_queries = models.IntegerField(default=0)
    total_uploads = models.IntegerField(default=0)
    last_filters = models.JSONField(default=dict, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Memory - {self.user.username}"