from datetime import datetime
from typing import Dict, List, Any
from pydantic import BaseModel, ConfigDict

class MaturityCategoryDetail(BaseModel):
    name: str
    points: float # 0 to 10
    max_points: float = 10.0
    percentage: float # 0 to 100%
    metrics_summary: str
    status: str # "Optimal", "Good", "Needs Improvement", "Critical"

class SecurityMaturityResponse(BaseModel):
    overall_score: float # 0 to 100
    level: str # Initial, Developing, Defined, Managed, Optimized
    score_trend: float # change percentage vs previous evaluation
    categories: Dict[str, float] # Category key -> percentage (0-100)
    category_details: Dict[str, MaturityCategoryDetail]
    strengths: List[str]
    weaknesses: List[str]
    recommendations: List[str]
    evaluated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class MaturityHistoryItem(BaseModel):
    id: int
    timestamp: datetime
    overall_score: float
    level: str
    categories: Dict[str, float]
    score_trend: float

    model_config = ConfigDict(from_attributes=True)
