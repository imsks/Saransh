import re
from typing import List
from .models import ContentAnalysis

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
