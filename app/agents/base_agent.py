from abc import ABC, abstractmethod
from typing import Dict, Any, List
import logging
from datetime import datetime

from app.ai.langchain_config import langchain_config

logger = logging.getLogger(__name__)

class BaseAgent(ABC):
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
        self.llm = langchain_config.llm
        self.memory = langchain_config.memory
        self.created_at = datetime.now()
        self.execution_count = 0
        
        logger.info(f"✅ {self.name} agent initialized")

    @abstractmethod
    def get_prompt_template(self) -> str:
        """Return the prompt template for this agent"""
        pass

    @abstractmethod
    def process_input(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process input and return results"""
        pass

    def create_chain(self):
        """Create a LangChain chain with the prompt template and memory"""
        try:
            prompt_template = self.get_prompt_template()
            return langchain_config.create_chain(prompt_template)
        except Exception as e:
            logger.error(f"❌ Failed to create chain for {self.name}: {e}")
            raise e
        
    def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the agent with input data"""
        try:
            self.execution_count += 1
            log_message = f"🔄 {self.name} agent executing (Execution {self.execution_count})"

            result = self.process_input(input_data)
            result.update({
                "agent_name": self.name,
                "agent_description": self.description,
                "execution_count": self.execution_count,
                "created_at": self.created_at.isoformat(),
                "execution_time": datetime.now().isoformat(),
            })

            logger.info(log_message)
            return result
        except Exception as e:
            logger.error(f"❌ Failed to execute {self.name} agent: {e}")
            raise e
        
    def get_stats(self) -> Dict[str, Any]:
        """Get agent statistics"""
        return {
            "name": self.name,
            "description": self.description,
            "created_at": self.created_at.isoformat(),
            "execution_count": self.execution_count,
            "memory_size": len(self.memory.chat_memory.messages) if self.memory.chat_memory else 0
        }
