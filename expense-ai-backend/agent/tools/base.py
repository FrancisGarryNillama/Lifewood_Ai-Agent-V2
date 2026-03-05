from abc import ABC, abstractmethod
from typing import Any, Dict


class BaseTool(ABC):
    """Abstract base class for all agent tools."""
    
    name: str = ""
    description: str = ""

    @abstractmethod
    def execute(self, **kwargs) -> Dict[str, Any]:
        """Execute the tool and return structured output."""
        pass

    def validate_input(self, **kwargs) -> bool:
        """Validate input before execution. Override in subclasses."""
        return True

    def to_schema(self) -> Dict:
        return {
            "name": self.name,
            "description": self.description,
        }