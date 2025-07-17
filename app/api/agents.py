from fastapi import APIRouter
from typing import Dict, List, Optional, Any
from pydantic import BaseModel
import logging
from app.agents.agent_manager import agent_manager

router = APIRouter(prefix="/agents", tags=["Agents"])
logger = logging.getLogger(__name__)

class AgentRequest(BaseModel):
    article_data: Dict[str, Any]
    user_preferences: Optional[Dict[str, Any]] = None
    pipeline: Optional[List[str]] = None

@router.post("/curate")
async def curate_article(request: AgentRequest):
    """Curate an article using the Content Curation Agent"""
    result = agent_manager.execute_agent("curation", request.model_dump())
    return result

@router.post("/summarize")
async def summarize_article(request: AgentRequest):
    """Summarize an article using the Summarization Agent"""
    result = agent_manager.execute_agent("summarization", request.model_dump())
    return result

@router.post("/pipeline")
async def run_agent_pipeline(request: AgentRequest):
    """Run a complete agent pipeline on an article"""
    result = agent_manager.execute_pipeline(request.article_data, request.pipeline)
    return result

@router.get("/stats")
async def get_agent_stats():
    """Get statistics for all agents"""
    return agent_manager.get_agent_stats() 