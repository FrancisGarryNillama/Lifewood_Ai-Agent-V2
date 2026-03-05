from typing import Dict, Any, Optional
from agent.models import GovernanceLog, ChatSession
from django.contrib.auth.models import User


CONFIDENCE_THRESHOLD = 0.65

TOOL_PERMISSIONS = {
    "ReceiptVisionTool": ["user", "admin", "manager"],
    "ReceiptStoreTool": ["user", "admin", "manager"],
    "ReceiptQueryTool": ["user", "admin", "manager"],
    "AnalyticsTool": ["user", "admin", "manager"],
    "ExcelExecutiveReportTool": ["user", "admin", "manager"],
    "MemoryTool": ["user", "admin", "manager"],
}

REQUIRED_FIELDS = {
    "ReceiptVisionTool": ["vendor_name", "total_amount", "confidence_score"],
    "ReceiptStoreTool": ["vendor_name", "total_amount"],
    "AnalyticsTool": ["summary", "chart_config", "statistics"],
}


class GovernanceLayer:
    """
    Intercepts all tool calls and outputs.
    Validates: schema, role permissions, confidence thresholds, data scope.
    Logs every decision.
    """

    def __init__(self, user: User, session: Optional[ChatSession] = None,
                 ip_address: Optional[str] = None):
        self.user = user
        self.session = session
        self.ip_address = ip_address

    def _get_user_role(self) -> str:
        if self.user.is_superuser:
            return "admin"
        if self.user.groups.filter(name="manager").exists():
            return "manager"
        return "user"

    def check_tool_permission(self, tool_name: str) -> Dict[str, Any]:
        user_role = self._get_user_role()
        allowed_roles = TOOL_PERMISSIONS.get(tool_name, [])

        if user_role not in allowed_roles:
            self._log(
                action_type="TOOL_CALL",
                status="REJECTED",
                tool_name=tool_name,
                rejection_reason=f"Role '{user_role}' not permitted for {tool_name}",
                role_permitted=False,
            )
            return {"allowed": False, "reason": f"Access denied: role '{user_role}' cannot use {tool_name}"}

        return {"allowed": True}

    def validate_tool_output(self, tool_name: str, output: Dict) -> Dict[str, Any]:
        issues = []

        # Schema validation
        required = REQUIRED_FIELDS.get(tool_name, [])
        schema_valid = True
        for field in required:
            if field not in output:
                issues.append(f"Missing required field: {field}")
                schema_valid = False

        # Confidence threshold
        confidence = output.get("confidence_score")
        confidence_ok = True
        if confidence is not None and confidence < CONFIDENCE_THRESHOLD:
            issues.append(
                f"Confidence score {confidence:.2f} is below threshold {CONFIDENCE_THRESHOLD}"
            )
            confidence_ok = False

        # Error check
        if output.get("status") == "error":
            issues.append(f"Tool returned error: {output.get('error', 'Unknown error')}")
            schema_valid = False

        status = "APPROVED" if not issues else ("FLAGGED" if confidence_ok else "FLAGGED")

        self._log(
            action_type="TOOL_CALL",
            status=status,
            tool_name=tool_name,
            output_data=output,
            confidence_score=confidence,
            rejection_reason="; ".join(issues) if issues else None,
            schema_valid=schema_valid,
        )

        return {
            "valid": schema_valid and confidence_ok,
            "status": status,
            "issues": issues,
            "confidence_ok": confidence_ok,
        }

    def validate_data_access(self, resource_user_id: int) -> Dict[str, Any]:
        """Enforce data scope — users can only access their own data."""
        if self.user.id != resource_user_id and not self.user.is_superuser:
            self._log(
                action_type="DATA_ACCESS",
                status="REJECTED",
                rejection_reason="User attempted to access data outside their scope",
                scope_enforced=True,
            )
            return {"allowed": False, "reason": "Data scope violation"}

        return {"allowed": True}

    def log_export(self, file_name: str, record_count: int):
        self._log(
            action_type="EXPORT",
            status="APPROVED",
            output_data={"file_name": file_name, "record_count": record_count},
        )

    def _log(self, action_type: str, status: str, tool_name: str = None,
             input_data: Dict = None, output_data: Dict = None,
             rejection_reason: str = None, confidence_score: float = None,
             schema_valid: bool = True, role_permitted: bool = True,
             scope_enforced: bool = True):
        try:
            GovernanceLog.objects.create(
                user=self.user,
                session=self.session,
                action_type=action_type,
                status=status,
                tool_name=tool_name,
                input_data=input_data or {},
                output_data=output_data or {},
                rejection_reason=rejection_reason,
                confidence_score=confidence_score,
                ip_address=self.ip_address,
                schema_valid=schema_valid,
                role_permitted=role_permitted,
                scope_enforced=scope_enforced,
            )
        except Exception as e:
            print(f"[GovernanceLayer] Logging failed: {e}")