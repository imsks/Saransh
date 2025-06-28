from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class ScrapedArticle(BaseModel):
    """Data Model for Scraped Articles"""
    title: str
    content: str
    source: str
    url: str
    published_date: Optional[str] = None
    author: Optional[str] = None
    category: Optional[str] = None
    scraped_at: datetime
    status: str = "success"

    # Pydantic v2 configuration
    model_config = ConfigDict(
        json_encoders={
            datetime: lambda v: v.isoformat()
        }
    )