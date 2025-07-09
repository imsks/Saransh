from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain.memory import ConversationBufferMemory
from langchain_core.runnables import RunnablePassthrough
import logging

from app.config import settings

logger = logging.getLogger(__name__)

class LangChainConfig:
    def __init__(self):
        self.llm = self._setup_llm()
        self.memory = self._setup_memory()

    def _setup_llm(self) -> ChatOpenAI:
        try:
            llm = ChatOpenAI(
                model=settings.OPENAI_MODEL,
                temperature=settings.OPENAI_TEMPERATURE,
                max_tokens=settings.OPENAI_MAX_TOKENS,
                api_key=settings.OPENAI_API_KEY
            )

            logger.info(f"✅ LangChain LLM configured with {settings.OPENAI_MODEL}")
            return llm
        except Exception as e:
            logger.error(f"❌ Failed to configure LangChain LLM: {e}")
            raise e
        
    def _setup_memory(self) -> ConversationBufferMemory:
        try:
            memory = ConversationBufferMemory(
                memory_key='chat_history',
                return_messages=True,
            )
            logger.info("✅ LangChain memory configured")
            return memory
        except Exception as e:
            logger.error(f"❌ Failed to configure LangChain memory: {e}")
            raise e
        
    def create_chain(self, prompt_template: str) -> RunnablePassthrough:
        """Create a LangChain chain with prompt and memory"""
        try:
            prompt = ChatPromptTemplate.from_template(prompt_template)
            chain = prompt | self.llm | StrOutputParser()
            logger.info("✅ LangChain chain created successfully")
            return chain
        except Exception as e:
            logger.error(f"❌ Failed to create LangChain chain: {e}")
            raise

langchain_config = LangChainConfig()