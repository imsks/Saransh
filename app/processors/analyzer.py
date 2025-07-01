import re
from typing import List, Dict, Any
from .models import ContentAnalysis
from ..ai.openai_service import OpenAIService
import json
import logging

logger = logging.getLogger(__name__)

class ContentAnalyzer:
    """Analyzes content for various metrics"""
    
    def analyze(self, content: str) -> ContentAnalysis:
        """Perform comprehensive content analysis"""
        
        # Basic metrics
        word_count = len(content.split())                    # Count words
        sentence_count = len(re.split(r'[.!?]+', content))  # Count sentences
        
        # Calculate readability score
        readability_score = self._calculate_readability(content)
        
        # Calculate sentiment score
        sentiment_score = self._calculate_sentiment(content)
        
        # Extract entities (people, places, organizations)
        entities = self._extract_entities(content)
        
        # Extract key topics
        key_topics = self._extract_topics(content)
        
        return ContentAnalysis(
            word_count=word_count,
            sentence_count=sentence_count,
            readability_score=readability_score,
            sentiment_score=sentiment_score,
            entities=entities,
            key_topics=key_topics
        )
    
    def _calculate_readability(self, text: str) -> float:
        """Calculate Flesch Reading Ease score (0-100)"""
        words = text.split()
        sentences = re.split(r'[.!?]+', text)
        syllables = sum(self._count_syllables(word) for word in words)
        
        if len(sentences) == 0 or len(words) == 0:
            return 0.0
        
        # Flesch Reading Ease formula
        return 206.835 - (1.015 * len(words) / len(sentences)) - (84.6 * syllables / len(words))
    
    def _calculate_sentiment(self, text: str) -> float:
        """Calculate sentiment score (-1 to 1)"""
        positive_words = ['good', 'great', 'excellent', 'positive', 'success']
        negative_words = ['bad', 'terrible', 'negative', 'failure', 'crash']
        
        words = text.lower().split()
        positive_count = sum(1 for word in words if word in positive_words)
        negative_count = sum(1 for word in words if word in negative_words)
        
        total = len(words)
        if total == 0:
            return 0.0
        
        return (positive_count - negative_count) / total
    
    def _extract_entities(self, text: str) -> List[str]:
        """Extract named entities (simplified)"""
        # Look for capitalized words (basic NER)
        entities = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', text)
        return list(set(entities))[:10]  # Return top 10 unique entities
    
    def _extract_topics(self, text: str) -> List[str]:
        """Extract key topics from text"""
        words = text.lower().split()
        word_freq = {}
        
        # Count word frequency (skip short words)
        for word in words:
            if len(word) > 4:
                word_freq[word] = word_freq.get(word, 0) + 1
        
        # Sort by frequency and return top 5
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        return [word for word, freq in sorted_words[:5]]
    
    def _count_syllables(self, word: str) -> int:
        """Count syllables in a word (simplified)"""
        word = word.lower()
        count = 0
        vowels = "aeiouy"
        on_vowel = False
        
        for char in word:
            is_vowel = char in vowels
            if is_vowel and not on_vowel:
                count += 1
            on_vowel = is_vowel
        
        return max(1, count)  # At least 1 syllable

class AIContentAnalyzer:
    """AI-powered content analysis using OpenAI"""
    
    def __init__(self):
        self.openai_service = OpenAIService()
    
    def analyze(self, content: str) -> ContentAnalysis:
        logger.info("[Analyzer] Starting AI-powered analysis")
        word_count = len(content.split())
        sentence_count = len(content.split('.'))
        sentiment = self._analyze_sentiment(content)
        logger.debug(f"[Analyzer] Sentiment: {sentiment}")
        entities = self._extract_entities(content)
        logger.debug(f"[Analyzer] Entities: {entities}")
        topics = self._classify_topics(content)
        logger.debug(f"[Analyzer] Topics: {topics}")
        summary = self._generate_summary(content)
        logger.info("[Analyzer] AI summary generated")
        keywords = self._extract_keywords(content)
        logger.debug(f"[Analyzer] Keywords: {keywords}")
        language = self._detect_language(content)
        logger.debug(f"[Analyzer] Language: {language}")
        quality_score = self._assess_quality(content)
        logger.debug(f"[Analyzer] Quality score: {quality_score}")
        return ContentAnalysis(
            word_count=word_count,
            sentence_count=sentence_count,
            readability_score=0.0,  # We'll enhance this later
            sentiment_score=sentiment['score'],
            entities=entities,
            key_topics=topics,
            language=language,
            content_type="news",
            ai_summary=summary,
            keywords=keywords,
            quality_score=quality_score,
            sentiment_label=sentiment['label']
        )
    
    def _analyze_sentiment(self, content: str) -> Dict[str, Any]:
        """Analyze sentiment using OpenAI"""
        prompt = f"""
        Analyze the sentiment of this news article. Return a JSON response with:
        - "score": float between -1 (very negative) and 1 (very positive)
        - "label": string ("positive", "negative", "neutral")
        - "confidence": float between 0 and 1
        
        Article: {content[:1000]}
        """
        
        response = self.openai_service._make_request([
            {"role": "system", "content": "You are a sentiment analysis expert. Return only valid JSON."},
            {"role": "user", "content": prompt}
        ])
        
        try:
            return json.loads(response)
        except:
            return {"score": 0.0, "label": "neutral", "confidence": 0.0}
    
    def _extract_entities(self, content: str) -> List[str]:
        """Extract named entities using OpenAI"""
        prompt = f"""
        Extract named entities (people, organizations, locations) from this text.
        Return a JSON array of entity names.
        
        Text: {content[:1000]}
        """
        
        response = self.openai_service._make_request([
            {"role": "system", "content": "You are an NER expert. Return only a JSON array of entity names."},
            {"role": "user", "content": prompt}
        ])
        
        try:
            entities = json.loads(response)
            return entities if isinstance(entities, list) else []
        except:
            return []
    
    def _classify_topics(self, content: str) -> List[str]:
        """Classify content into topics using zero-shot learning"""
        topics = ["Politics", "Technology", "Business", "Sports", "Entertainment", 
                 "Health", "Science", "Education", "Crime", "Environment"]
        
        prompt = f"""
        Classify this news article into the most relevant topics from this list: {topics}
        Return a JSON array of the top 3 most relevant topics.
        
        Article: {content[:1000]}
        """
        
        response = self.openai_service._make_request([
            {"role": "system", "content": "You are a topic classification expert. Return only a JSON array."},
            {"role": "user", "content": prompt}
        ])
        
        try:
            classified_topics = json.loads(response)
            return classified_topics if isinstance(classified_topics, list) else []
        except:
            return []
    
    def _generate_summary(self, content: str) -> str:
        """Generate 60-word summary using OpenAI"""
        prompt = f"""
        Summarize this news article in exactly 60 words or less.
        Focus on the key facts and main story.
        
        Article: {content}
        """
        
        response = self.openai_service._make_request([
            {"role": "system", "content": "You are a news summarization expert. Create concise, factual summaries."},
            {"role": "user", "content": prompt}
        ])
        
        return response or "Summary not available"
    
    def _extract_keywords(self, content: str) -> List[str]:
        """Extract keywords using AI"""
        prompt = f"""
        Extract 10 most important keywords from this text.
        Return a JSON array of keyword strings.
        
        Text: {content[:1000]}
        """
        
        response = self.openai_service._make_request([
            {"role": "system", "content": "You are a keyword extraction expert. Return only a JSON array."},
            {"role": "user", "content": prompt}
        ])
        
        try:
            keywords = json.loads(response)
            return keywords if isinstance(keywords, list) else []
        except:
            return []
    
    def _detect_language(self, content: str) -> str:
        """Detect language using OpenAI"""
        prompt = f"""
        Detect the language of this text. Return only the language name (e.g., "English", "Hindi", "Spanish").
        
        Text: {content[:500]}
        """
        
        response = self.openai_service._make_request([
            {"role": "system", "content": "You are a language detection expert. Return only the language name."},
            {"role": "user", "content": prompt}
        ])
        
        return response or "English"
    
    def _assess_quality(self, content: str) -> float:
        """Assess content quality using AI"""
        prompt = f"""
        Assess the quality of this news article on a scale of 0-10.
        Consider: factual accuracy, writing quality, relevance, completeness.
        Return only a number between 0 and 10.
        
        Article: {content[:1000]}
        """
        
        response = self.openai_service._make_request([
            {"role": "system", "content": "You are a content quality assessor. Return only a number."},
            {"role": "user", "content": prompt}
        ])
        
        try:
            return float(response) / 10.0  # Normalize to 0-1
        except:
            return 0.5
