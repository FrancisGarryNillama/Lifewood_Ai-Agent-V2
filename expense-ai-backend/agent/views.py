from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
from .models import ChatSession, ChatMessage, GovernanceLog, LongTermMemory
from .serializers import (
    ChatSessionSerializer, ChatMessageSerializer,
    GovernanceLogSerializer, LongTermMemorySerializer
)
from .services.agent_service import AgentReasoningEngine
from .services.governance import GovernanceLayer
import base64


class ChatSessionViewSet(viewsets.ModelViewSet):
    serializer_class = ChatSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        """
        Main agent endpoint. Accepts text + optional image.
        Runs the full agent reasoning loop.
        """
        session = self.get_object()
        user_input = request.data.get('message', '').strip()
        image_base64 = None

        if not user_input and 'image' not in request.FILES:
            return Response(
                {'error': 'Message or image required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Handle image upload
        if 'image' in request.FILES:
            image_file = request.FILES['image']
            image_base64 = base64.b64encode(image_file.read()).decode('utf-8')
            if not user_input:
                user_input = "Please extract and store this receipt."

        # Save user message
        ChatMessage.objects.create(
            session=session,
            role='user',
            content=user_input,
            agent_state='IDLE',
        )

        # Initialize governance layer
        governance = GovernanceLayer(
            user=request.user,
            session=session,
            ip_address=request.META.get('REMOTE_ADDR')
        )

        # Run agent
        agent = AgentReasoningEngine(
            user=request.user,
            session=session,
            governance=governance
        )

        result = agent.run(user_input, image_base64=image_base64)

        # Handle Excel file response
        if result.get('excel_file'):
            excel_bytes = result['excel_file']
            filename = result.get('tool_outputs', {}).get(
                'ExcelExecutiveReportTool', {}
            ).get('result', {}).get('filename', 'report.xlsx')

            http_response = HttpResponse(
                excel_bytes.read(),
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            http_response['Content-Disposition'] = f'attachment; filename="{filename}"'
            http_response['X-Agent-Response'] = result['response']
            return http_response

        return Response({
            'session_id': str(session.id),
            'response': result['response'],
            'tools_used': result['tools_used'],
            'tool_outputs': result['tool_outputs'],
            'reasoning_trace': result['reasoning_trace'],
            'confidence_score': result['confidence_score'],
            'state': result['state'],
        })

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Get all messages in a session."""
        session = self.get_object()
        messages = ChatMessage.objects.filter(session=session)
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data)


class GovernanceLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = GovernanceLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = GovernanceLog.objects.filter(user=self.request.user)
        status_filter = self.request.query_params.get('status')
        action_filter = self.request.query_params.get('action_type')
        if status_filter:
            qs = qs.filter(status=status_filter)
        if action_filter:
            qs = qs.filter(action_type=action_filter)
        return qs

    @action(detail=False, methods=['get'])
    def summary(self, request):
        qs = GovernanceLog.objects.filter(user=request.user)
        return Response({
            'total': qs.count(),
            'approved': qs.filter(status='APPROVED').count(),
            'rejected': qs.filter(status='REJECTED').count(),
            'flagged': qs.filter(status='FLAGGED').count(),
        })


class AgentMemoryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = LongTermMemorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return LongTermMemory.objects.filter(user=self.request.user)

    def list(self, request, *args, **kwargs):
        mem, _ = LongTermMemory.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(mem)
        return Response(serializer.data)