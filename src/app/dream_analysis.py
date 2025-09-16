from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
import boto3
import os
import json
import re
from datetime import datetime, timedelta
from collections import Counter
from functools import wraps
from .premium import require_premium, check_premium_access
from .auth import require_cognito_auth

dream_analysis_bp = Blueprint('dream_analysis_bp', __name__)

# Initialize S3 client
s3_client = boto3.client('s3')
S3_BUCKET_NAME = os.getenv('S3_BUCKET_NAME')

# Dream archetypes and their meanings with comprehensive keyword lists
DREAM_ARCHETYPES = {
    'water': {
        'meaning': 'Emotions, subconscious, purification, change',
        'positive': 'Emotional healing, spiritual growth, renewal',
        'negative': 'Emotional overwhelm, feeling lost, fear of change',
        'keywords': ['water', 'ocean', 'sea', 'lake', 'river', 'stream', 'pool', 'rain', 'flood', 'drowning', 'swimming', 'bathing', 'waves', 'tide', 'sink', 'drain', 'thirsty', 'wet', 'moisture', 'liquid']
    },
    'flying': {
        'meaning': 'Freedom, transcendence, spiritual elevation, escape',
        'positive': 'Achievement, breaking limitations, spiritual awakening',
        'negative': 'Avoiding problems, unrealistic expectations, escapism',
        'keywords': ['flying', 'fly', 'soaring', 'floating', 'airplane', 'plane', 'bird', 'wings', 'sky', 'air', 'elevation', 'height', 'gliding', 'hovering', 'ascending', 'upward', 'clouds', 'altitude']
    },
    'falling': {
        'meaning': 'Loss of control, fear, anxiety, letting go',
        'positive': 'Surrendering to change, releasing control, transformation',
        'negative': 'Fear of failure, loss of security, anxiety',
        'keywords': ['falling', 'fall', 'dropping', 'plummeting', 'descending', 'downward', 'cliff', 'height', 'drop', 'sink', 'collapse', 'tumbling', 'crashing', 'landing', 'ground', 'bottom']
    },
    'chase': {
        'meaning': 'Avoiding problems, running from fears, pursuit of goals',
        'positive': 'Facing challenges, determination, goal pursuit',
        'negative': 'Avoidance, fear, unresolved issues',
        'keywords': ['chase', 'chasing', 'running', 'pursuing', 'following', 'hunting', 'escaping', 'fleeing', 'chased', 'pursued', 'tracking', 'stalking', 'catching', 'caught', 'hide', 'hiding', 'seek', 'seeking']
    },
    'house': {
        'meaning': 'Self, mind, personality, life structure',
        'positive': 'Self-discovery, personal growth, stability',
        'negative': 'Identity crisis, instability, feeling lost',
        'keywords': ['house', 'home', 'building', 'room', 'rooms', 'door', 'doors', 'window', 'windows', 'kitchen', 'bedroom', 'bathroom', 'living room', 'basement', 'attic', 'stairs', 'hallway', 'mansion', 'apartment', 'dwelling']
    },
    'death': {
        'meaning': 'Transformation, change, ending of old patterns',
        'positive': 'Personal growth, new beginnings, transformation',
        'negative': 'Fear of change, loss, anxiety about endings',
        'keywords': ['death', 'dying', 'dead', 'funeral', 'grave', 'cemetery', 'coffin', 'burial', 'ghost', 'spirit', 'soul', 'afterlife', 'heaven', 'hell', 'reincarnation', 'passed away', 'deceased', 'mortal', 'immortal']
    },
    'teeth': {
        'meaning': 'Communication, power, confidence, appearance',
        'positive': 'Clear communication, confidence, self-expression',
        'negative': 'Communication issues, loss of power, insecurity',
        'keywords': ['teeth', 'tooth', 'dental', 'smile', 'bite', 'chewing', 'mouth', 'gums', 'dentist', 'braces', 'cavity', 'toothache', 'grinding', 'gnashing', 'incisors', 'molars', 'canines', 'wisdom teeth']
    },
    'naked': {
        'meaning': 'Vulnerability, authenticity, exposure, truth',
        'positive': 'Being authentic, revealing true self, honesty',
        'negative': 'Feeling exposed, vulnerability, shame',
        'keywords': ['naked', 'nude', 'bare', 'clothes', 'clothing', 'dressed', 'undressed', 'exposed', 'vulnerable', 'shame', 'embarrassed', 'nakedness', 'stripped', 'unclothed', 'garment', 'outfit', 'attire']
    }
}

# Psychological patterns and their interpretations
PSYCHOLOGICAL_PATTERNS = {
    'recurring_themes': {
        'description': 'Themes that appear repeatedly suggest unresolved issues or ongoing life patterns',
        'interpretation': 'These recurring elements may indicate areas in your life that need attention or resolution'
    },
    'emotional_intensity': {
        'description': 'Strong emotional responses in dreams often reflect real-life emotional states',
        'interpretation': 'Your dream emotions may be amplifying feelings you experience during the day'
    },
    'symbol_transformation': {
        'description': 'When dream symbols change or evolve, it suggests personal growth and transformation',
        'interpretation': 'This indicates you are processing change and adapting to new circumstances'
    },
    'time_patterns': {
        'description': 'Dreams about past, present, or future can reveal your relationship with time',
        'interpretation': 'Consider how you relate to your past experiences and future aspirations'
    }
}

# Basic English stopword set for cleaner theme extraction
STOPWORDS = set([
    'a','an','the','and','or','but','if','then','else','when','at','by','for','with','about','against',
    'between','into','through','during','before','after','above','below','to','from','up','down','in','out',
    'on','off','over','under','again','further','once','here','there','all','any','both','each','few','more',
    'most','other','some','such','no','nor','not','only','own','same','so','than','too','very','can','will',
    'just','don','should','now','is','are','was','were','be','been','being','have','has','had','do','does','did',
    'of','as','it','its','i','me','my','myself','we','our','ours','ourselves','you','your','yours','yourself',
    'yourselves','he','him','his','himself','she','her','hers','herself','they','them','their','theirs',
    'themselves','what','which','who','whom','this','that','these','those','am','because','while','where','why',
    'how','also','into','out','very','much','many','lot','lots','like','get','got','getting','gotten','go','goes',
    'going','went','say','says','said','would','could','should','may','might','one','two','three','four','five',
    'it\'s','im','i\'m','you\'re','we\'re','they\'re','there\'s','here\'s'
])

def extract_meaningful_words(text: str):
    """Tokenize text and filter to meaningful words for theme analysis.
    - Lowercase
    - Keep alphabetic tokens only
    - Remove stopwords
    - Remove very short tokens (length <= 2)
    """
    if not text:
        return []
    # Extract alphabetic words; ignore numbers/punctuation (hyphens become separators)
    tokens = re.findall(r"[a-zA-Z]+", text.lower())
    filtered = [t for t in tokens if len(t) > 2 and t not in STOPWORDS]
    return filtered

def extract_dream_symbols(dreams):
    """Extract all potential symbols from dreams using comprehensive analysis"""
    symbol_categories = {
        'nature': ['water', 'ocean', 'sea', 'lake', 'river', 'stream', 'rain', 'storm', 'tree', 'forest', 'mountain', 'hill', 'valley', 'desert', 'beach', 'island', 'sky', 'cloud', 'sun', 'moon', 'stars', 'earth', 'fire', 'wind', 'snow', 'ice'],
        'structures': ['house', 'home', 'building', 'castle', 'tower', 'bridge', 'tunnel', 'road', 'street', 'path', 'door', 'window', 'room', 'kitchen', 'bedroom', 'bathroom', 'basement', 'attic', 'stairs', 'elevator', 'wall', 'floor', 'ceiling'],
        'transportation': ['car', 'truck', 'bus', 'train', 'plane', 'airplane', 'boat', 'ship', 'bicycle', 'motorcycle', 'taxi', 'subway', 'helicopter', 'rocket', 'spaceship'],
        'animals': ['dog', 'cat', 'bird', 'fish', 'horse', 'cow', 'pig', 'sheep', 'lion', 'tiger', 'bear', 'wolf', 'elephant', 'monkey', 'snake', 'spider', 'butterfly', 'bee', 'dragon', 'unicorn'],
        'people': ['person', 'man', 'woman', 'child', 'baby', 'friend', 'family', 'mother', 'father', 'brother', 'sister', 'teacher', 'doctor', 'stranger', 'crowd', 'group'],
        'objects': ['book', 'phone', 'computer', 'key', 'money', 'jewelry', 'clothes', 'shoes', 'bag', 'box', 'mirror', 'clock', 'watch', 'camera', 'guitar', 'piano', 'ball', 'toy'],
        'food': ['food', 'meal', 'bread', 'cake', 'fruit', 'apple', 'banana', 'orange', 'meat', 'vegetable', 'drink', 'water', 'coffee', 'tea', 'wine', 'beer'],
        'emotions': ['love', 'hate', 'fear', 'joy', 'sadness', 'anger', 'peace', 'excitement', 'anxiety', 'calm', 'confusion', 'surprise'],
        'activities': ['running', 'walking', 'swimming', 'flying', 'dancing', 'singing', 'playing', 'working', 'sleeping', 'eating', 'driving', 'reading', 'writing', 'drawing'],
        'abstract': ['dream', 'memory', 'thought', 'idea', 'problem', 'solution', 'secret', 'mystery', 'magic', 'power', 'freedom', 'escape', 'journey', 'adventure']
    }
    
    all_symbols = set()
    for category_symbols in symbol_categories.values():
        all_symbols.update(category_symbols)
    
    return list(all_symbols)

def extract_symbols_from_text(text, symbol_list):
    """Extract symbols present in text with fuzzy matching"""
    found_symbols = []
    words = text.lower().split()
    
    for symbol in symbol_list:
        # Exact match
        if symbol in words:
            found_symbols.append(symbol)
        # Partial match (symbol is part of a word)
        elif any(symbol in word for word in words):
            found_symbols.append(symbol)
        # Plural/singular variations
        elif symbol.endswith('s') and symbol[:-1] in words:
            found_symbols.append(symbol[:-1])
        elif symbol + 's' in words:
            found_symbols.append(symbol)
    
    return found_symbols

def extract_symbol_context(text, symbol, context_window=5):
    """Extract context words around a symbol"""
    words = text.lower().split()
    context_words = []
    
    for i, word in enumerate(words):
        if symbol in word:
            # Get words before and after
            start = max(0, i - context_window)
            end = min(len(words), i + context_window + 1)
            context_words.extend(words[start:end])
    
    # Remove duplicates and filter meaningful words
    context_words = list(set(context_words))
    meaningful_context = [word for word in context_words if len(word) > 2 and word not in STOPWORDS]
    
    return meaningful_context[:10]  # Limit to 10 most relevant words

def analyze_symbol_emotional_context(context_words):
    """Analyze the emotional context around a symbol"""
    emotional_words = {
        'positive': ['happy', 'joy', 'love', 'peace', 'beautiful', 'wonderful', 'amazing', 'good', 'great', 'safe', 'comfortable', 'bright', 'warm'],
        'negative': ['scared', 'afraid', 'angry', 'sad', 'dark', 'cold', 'dangerous', 'terrible', 'awful', 'bad', 'frightening', 'worried', 'anxious'],
        'neutral': ['normal', 'regular', 'usual', 'common', 'typical', 'ordinary', 'standard']
    }
    
    context_text = ' '.join(context_words).lower()
    emotion_scores = {}
    
    for emotion, words in emotional_words.items():
        score = sum(1 for word in words if word in context_text)
        emotion_scores[emotion] = score
    
    # Determine dominant emotion
    if emotion_scores['positive'] > emotion_scores['negative'] and emotion_scores['positive'] > emotion_scores['neutral']:
        return 'positive'
    elif emotion_scores['negative'] > emotion_scores['positive'] and emotion_scores['negative'] > emotion_scores['neutral']:
        return 'negative'
    else:
        return 'neutral'

def calculate_symbol_evolution_metrics(symbol, appearances, frequency_tracking, context_analysis):
    """Calculate comprehensive evolution metrics for a symbol"""
    if len(appearances) < 2:
        return {'evolution_score': 0}
    
    # Frequency evolution
    frequencies = [entry['frequency'] for entry in frequency_tracking]
    frequency_trend = 'increasing' if frequencies[-1] > frequencies[0] else 'decreasing' if frequencies[-1] < frequencies[0] else 'stable'
    
    # Context evolution
    contexts = [entry['emotional_context'] for entry in context_analysis]
    context_changes = len(set(contexts)) - 1  # Number of different emotional contexts
    
    # Temporal spread
    dates = [appearance['date'] for appearance in appearances]
    temporal_spread = len(set(dates))  # Number of different days
    
    # Evolution score calculation
    evolution_score = (
        len(appearances) * 0.3 +  # Frequency of appearance
        context_changes * 0.4 +   # Context diversity
        temporal_spread * 0.2 +    # Temporal spread
        (1 if frequency_trend == 'increasing' else 0.5) * 0.1  # Growth trend
    )
    
    return {
        'evolution_score': evolution_score,
        'appearance_count': len(appearances),
        'frequency_trend': frequency_trend,
        'context_diversity': context_changes,
        'temporal_spread': temporal_spread,
        'dominant_context': max(set(contexts), key=contexts.count) if contexts else 'neutral'
    }

def generate_symbol_evolution_insights(evolution_metrics):
    """Generate insights about symbol evolution patterns"""
    insights = []
    
    if not evolution_metrics:
        return ["No recurring symbols found in your dreams yet. Continue journaling to discover patterns!"]
    
    # Find most evolving symbols
    top_symbols = sorted(evolution_metrics.items(), key=lambda x: x[1]['evolution_score'], reverse=True)[:3]
    
    for symbol, metrics in top_symbols:
        if metrics['frequency_trend'] == 'increasing':
            insights.append(f"'{symbol}' appears more frequently over time, suggesting growing significance in your dream life.")
        elif metrics['context_diversity'] > 2:
            insights.append(f"'{symbol}' appears in diverse emotional contexts, indicating complex symbolic meaning.")
        elif metrics['temporal_spread'] > 5:
            insights.append(f"'{symbol}' appears consistently across many dreams, showing it's a core symbol in your psyche.")
    
    # Overall pattern insights
    if len(evolution_metrics) > 5:
        insights.append("You have many evolving symbols, indicating rich symbolic activity in your dreams.")
    elif len(evolution_metrics) > 2:
        insights.append("Your dreams show focused symbolic patterns, suggesting specific areas of psychological processing.")
    
    return insights

def analyze_temporal_content(text, temporal_patterns):
    """Analyze temporal content in text with sophisticated detection"""
    time_scores = {'past': 0, 'present': 0, 'future': 0}
    keywords_found = {'past': [], 'present': [], 'future': []}
    context_indicators = []
    
    words = text.lower().split()
    
    # Score each time period
    for time_period, patterns in temporal_patterns.items():
        # Explicit keywords (higher weight)
        for keyword in patterns['explicit']:
            if keyword in words:
                time_scores[time_period] += 2
                keywords_found[time_period].append(keyword)
        
        # Implicit keywords (medium weight)
        for keyword in patterns['implicit']:
            if keyword in words:
                time_scores[time_period] += 1
                keywords_found[time_period].append(keyword)
        
        # Context phrases (highest weight)
        for context in patterns['context']:
            if context in text:
                time_scores[time_period] += 3
                context_indicators.append(context)
    
    # Determine primary time period
    max_score = max(time_scores.values())
    if max_score == 0:
        return {
            'has_temporal_content': False,
            'primary_time_period': 'neutral',
            'confidence': 0,
            'keywords_found': [],
            'context': []
        }
    
    primary_time_period = max(time_scores, key=time_scores.get)
    confidence = min(max_score / 10, 1.0)  # Normalize confidence to 0-1
    
    return {
        'has_temporal_content': True,
        'primary_time_period': primary_time_period,
        'confidence': confidence,
        'keywords_found': keywords_found[primary_time_period],
        'context': context_indicators
    }

def analyze_temporal_relationships(text):
    """Analyze temporal relationships between events in dreams"""
    relationships = []
    
    # Temporal connectors
    temporal_connectors = {
        'sequence': ['then', 'after', 'next', 'following', 'subsequently', 'later', 'afterwards'],
        'simultaneous': ['while', 'during', 'meanwhile', 'at the same time', 'simultaneously'],
        'cause_effect': ['because', 'since', 'as a result', 'therefore', 'consequently', 'due to'],
        'contrast': ['but', 'however', 'although', 'despite', 'nevertheless', 'yet']
    }
    
    words = text.lower().split()
    
    for relationship_type, connectors in temporal_connectors.items():
        for connector in connectors:
            if connector in words:
                relationships.append({
                    'type': relationship_type,
                    'connector': connector,
                    'context': extract_context_around_word(text, connector)
                })
    
    return relationships

def extract_context_around_word(text, word, window=3):
    """Extract context around a specific word"""
    words = text.lower().split()
    context_words = []
    
    for i, w in enumerate(words):
        if word in w:
            start = max(0, i - window)
            end = min(len(words), i + window + 1)
            context_words.extend(words[start:end])
    
    return ' '.join(context_words[:10])

def calculate_temporal_confidence(time_related_dreams):
    """Calculate overall confidence in temporal analysis"""
    if not time_related_dreams:
        return 0
    
    total_confidence = sum(dream['confidence'] for dream in time_related_dreams)
    return total_confidence / len(time_related_dreams)

def generate_temporal_insights(past_dreams, present_dreams, future_dreams, temporal_relationships):
    """Generate insights about temporal patterns in dreams"""
    insights = []
    
    total_temporal_dreams = len(past_dreams) + len(present_dreams) + len(future_dreams)
    
    if total_temporal_dreams == 0:
        return ["Your dreams don't show strong temporal patterns. This suggests you're focused on the present moment."]
    
    # Analyze temporal distribution
    if len(past_dreams) > len(future_dreams) and len(past_dreams) > len(present_dreams):
        insights.append("Your dreams frequently reference the past, suggesting you're processing memories or reflecting on previous experiences.")
    elif len(future_dreams) > len(past_dreams) and len(future_dreams) > len(present_dreams):
        insights.append("Your dreams often look toward the future, indicating forward-thinking and goal-oriented mindset.")
    elif len(present_dreams) > len(past_dreams) and len(present_dreams) > len(future_dreams):
        insights.append("Your dreams focus on the present moment, showing mindfulness and current awareness.")
    
    # Analyze temporal relationships
    if temporal_relationships:
        relationship_types = [rel['type'] for rel in temporal_relationships]
        relationship_counts = Counter(relationship_types)
        
        if relationship_counts.get('sequence', 0) > 2:
            insights.append("Your dreams show strong sequential patterns, indicating structured thinking and logical progression.")
        if relationship_counts.get('cause_effect', 0) > 1:
            insights.append("Your dreams demonstrate cause-and-effect thinking, showing analytical processing of events.")
        if relationship_counts.get('simultaneous', 0) > 1:
            insights.append("Your dreams involve simultaneous events, suggesting multitasking or complex mental processing.")
    
    # Overall temporal awareness
    if total_temporal_dreams > len(past_dreams) + len(present_dreams) + len(future_dreams) * 0.3:
        insights.append("You have strong temporal awareness in your dreams, indicating good time perception and planning abilities.")
    
    return insights

def calculate_emotional_volatility(emotions):
    """Calculate emotional volatility based on emotion changes over time"""
    if len(emotions) < 2:
        return 0
    
    # Count emotion transitions
    transitions = 0
    for i in range(1, len(emotions)):
        if emotions[i] != emotions[i-1]:
            transitions += 1
    
    # Calculate volatility as ratio of transitions to total possible transitions
    volatility = transitions / (len(emotions) - 1)
    return volatility

def analyze_emotional_patterns_advanced(emotions):
    """Analyze emotional patterns with advanced pattern recognition"""
    if len(emotions) < 3:
        return {'consistency': 0, 'trends': []}
    
    # Analyze for patterns
    patterns = []
    trends = []
    
    # Look for recurring patterns
    for i in range(len(emotions) - 2):
        pattern = emotions[i:i+3]
        patterns.append(tuple(pattern))
    
    # Count pattern occurrences
    pattern_counts = Counter(patterns)
    
    # Calculate consistency (how often patterns repeat)
    consistency = len([count for count in pattern_counts.values() if count > 1]) / len(pattern_counts) if pattern_counts else 0
    
    # Analyze trends (increasing/decreasing emotional intensity)
    emotion_intensity_map = {
        'neutral': 0, 'peace': 1, 'love': 2, 'joy': 3, 'surprise': 2,
        'sadness': -2, 'anger': -3, 'fear': -3, 'disgust': -2, 'negative': -2, 'positive': 2
    }
    
    intensities = [emotion_intensity_map.get(emotion, 0) for emotion in emotions]
    
    # Calculate trend direction
    if len(intensities) >= 3:
        recent_avg = sum(intensities[-3:]) / 3
        earlier_avg = sum(intensities[:3]) / 3
        
        if recent_avg > earlier_avg + 0.5:
            trends.append('increasing_positive')
        elif recent_avg < earlier_avg - 0.5:
            trends.append('increasing_negative')
        else:
            trends.append('stable')
    
    return {
        'consistency': consistency,
        'trends': trends,
        'pattern_counts': dict(pattern_counts.most_common(5))
    }

def determine_emotional_stability_level(diversity, volatility, consistency):
    """Determine emotional stability level based on multiple factors"""
    # Calculate composite stability score
    stability_score = (
        diversity * 0.3 +      # Higher diversity = more stable
        (1 - volatility) * 0.4 +  # Lower volatility = more stable
        consistency * 0.3       # Higher consistency = more stable
    )
    
    if stability_score > 0.7:
        return "emotionally_balanced"
    elif stability_score > 0.4:
        return "moderately_stable"
    elif stability_score > 0.2:
        return "emotionally_focused"
    else:
        return "emotionally_volatile"

def generate_emotional_stability_insights(diversity, volatility, pattern_analysis, emotion_counts):
    """Generate insights about emotional stability patterns"""
    insights = []
    
    # Diversity insights
    if diversity > 0.6:
        insights.append("You experience a wide range of emotions in your dreams, indicating emotional richness and adaptability.")
    elif diversity < 0.3:
        insights.append("Your dreams show focused emotional patterns, suggesting you're processing specific emotional themes.")
    
    # Volatility insights
    if volatility > 0.7:
        insights.append("Your dreams show high emotional variability, indicating active emotional processing and responsiveness.")
    elif volatility < 0.3:
        insights.append("Your dreams demonstrate emotional consistency, suggesting stable emotional patterns.")
    
    # Pattern insights
    if pattern_analysis['consistency'] > 0.5:
        insights.append("Your dreams show recurring emotional patterns, indicating consistent emotional themes.")
    
    # Trend insights
    if 'increasing_positive' in pattern_analysis['trends']:
        insights.append("Your recent dreams show increasingly positive emotional trends, suggesting emotional growth.")
    elif 'increasing_negative' in pattern_analysis['trends']:
        insights.append("Your recent dreams show increasing negative emotional trends, which may indicate stress or challenges.")
    
    # Dominant emotion insights
    if emotion_counts:
        dominant_emotion, count = emotion_counts.most_common(1)[0]
        total_emotions = sum(emotion_counts.values())
        dominance_ratio = count / total_emotions
        
        if dominance_ratio > 0.5:
            insights.append(f"'{dominant_emotion}' dominates your dream emotions ({int(dominance_ratio*100)}%), indicating this is a key emotional theme.")
    
    return insights

def calculate_emotional_intensity(dream_text: str, dream_emotions: list) -> float:
    """Calculate emotional intensity based on emotional word density and strength.
    
    Args:
        dream_text: The dream content text
        dream_emotions: List of detected emotions for this dream
    
    Returns:
        Float between 0.0 and 1.0 representing emotional intensity
    """
    if not dream_text or not dream_emotions:
        return 0.0
    
    # Define emotional word strength weights
    emotion_strength_weights = {
        'fear': 0.9, 'terror': 1.0, 'panic': 1.0, 'horror': 1.0,
        'joy': 0.8, 'ecstatic': 1.0, 'euphoric': 1.0, 'blissful': 1.0,
        'sadness': 0.7, 'grief': 1.0, 'despair': 1.0, 'heartbroken': 1.0,
        'anger': 0.8, 'rage': 1.0, 'furious': 1.0, 'livid': 1.0,
        'peace': 0.6, 'serene': 0.8, 'tranquil': 0.8, 'harmonious': 0.8,
        'love': 0.8, 'passionate': 1.0, 'devoted': 0.9, 'cherished': 0.9,
        'surprise': 0.7, 'shocked': 0.9, 'astonished': 0.9, 'stunned': 0.9,
        'disgust': 0.8, 'repulsed': 1.0, 'horrified': 1.0, 'appalled': 0.9,
        'positive': 0.6, 'negative': 0.7, 'neutral': 0.1
    }
    
    # Count emotional words and their strength
    words = dream_text.lower().split()
    total_words = len(words)
    
    if total_words == 0:
        return 0.0
    
    emotional_word_count = 0
    total_emotional_strength = 0.0
    
    # Check each word against emotional strength weights
    for word in words:
        # Clean word (remove punctuation)
        clean_word = re.sub(r'[^\w]', '', word)
        if clean_word in emotion_strength_weights:
            emotional_word_count += 1
            total_emotional_strength += emotion_strength_weights[clean_word]
    
    # Calculate intensity based on:
    # 1. Density of emotional words (emotional_words / total_words)
    # 2. Average strength of emotional words
    # 3. Number of different emotions detected
    
    if emotional_word_count == 0:
        return 0.0
    
    # Base intensity from emotional word density and strength
    density_factor = min(emotional_word_count / total_words * 10, 1.0)  # Scale up density
    strength_factor = total_emotional_strength / emotional_word_count if emotional_word_count > 0 else 0
    
    # Bonus for multiple emotions (emotional complexity)
    emotion_diversity_bonus = min(len(set(dream_emotions)) * 0.1, 0.3)
    
    # Calculate final intensity
    intensity = (density_factor * 0.4 + strength_factor * 0.4 + emotion_diversity_bonus)
    
    # Ensure intensity is between 0.0 and 1.0
    return min(max(intensity, 0.0), 1.0)

# Premium decorator is now imported from premium module

@dream_analysis_bp.route('/advanced/<phone_number>', methods=['GET'])
@cross_origin(supports_credentials=True)
@require_cognito_auth
@require_premium
def get_advanced_analysis(phone_number):
    """Get advanced dream analysis including archetypes, patterns, and insights"""
    try:
        if not S3_BUCKET_NAME:
            return jsonify({"error": "S3 bucket not configured"}), 500

        # Get all dreams for the user
        response = s3_client.list_objects_v2(
            Bucket=S3_BUCKET_NAME,
            Prefix=f'{phone_number}/'
        )

        if 'Contents' not in response:
            return jsonify({"error": "No dreams found"}), 404

        # Filter dream files and get their content
        dream_contents = []
        for obj in response['Contents']:
            key = obj['Key']
            if not key.endswith('metadata') and not key.endswith('themes.txt'):
                try:
                    dream_response = s3_client.get_object(
                        Bucket=S3_BUCKET_NAME,
                        Key=key
                    )
                    dream_data = json.loads(dream_response['Body'].read().decode('utf-8'))
                    dream_contents.append(dream_data)
                except Exception as e:
                    print(f"Error reading dream {key}: {e}")
                    continue

        if not dream_contents:
            return jsonify({"error": "No valid dreams found"}), 404

        # Perform advanced analysis
        analysis = perform_advanced_analysis(dream_contents)

        return jsonify(analysis), 200

    except Exception as e:
        return jsonify({"error": f"Failed to perform advanced analysis: {str(e)}"}), 500

@dream_analysis_bp.route('/archetypes/<phone_number>', methods=['GET'])
@cross_origin(supports_credentials=True)
@require_cognito_auth
@require_premium
def get_dream_archetypes(phone_number):
    """Get dream archetype analysis for a user"""
    try:
        if not S3_BUCKET_NAME:
            return jsonify({"error": "S3 bucket not configured"}), 500

        # Get recent dreams for archetype analysis
        response = s3_client.list_objects_v2(
            Bucket=S3_BUCKET_NAME,
            Prefix=f'{phone_number}/'
        )

        if 'Contents' not in response:
            return jsonify({"error": "No dreams found"}), 404

        # Get the 10 most recent dreams
        dream_keys = []
        for obj in response['Contents']:
            key = obj['Key']
            if not key.endswith('metadata') and not key.endswith('themes.txt'):
                dream_keys.append({
                    'key': key,
                    'lastModified': obj['LastModified']
                })

        dream_keys.sort(key=lambda x: x['lastModified'], reverse=True)
        recent_dreams = dream_keys[:10]

        # Analyze archetypes in recent dreams
        archetype_analysis = analyze_dream_archetypes(recent_dreams, phone_number)

        return jsonify(archetype_analysis), 200

    except Exception as e:
        return jsonify({"error": f"Failed to analyze archetypes: {str(e)}"}), 500

@dream_analysis_bp.route('/patterns/<phone_number>', methods=['GET'])
@cross_origin(supports_credentials=True)
@require_cognito_auth
@require_premium
def get_dream_patterns(phone_number):
    """Get psychological pattern analysis for a user"""
    try:
        if not S3_BUCKET_NAME:
            return jsonify({"error": "S3 bucket not configured"}), 500

        # Get all dreams for pattern analysis
        response = s3_client.list_objects_v2(
            Bucket=S3_BUCKET_NAME,
            Prefix=f'{phone_number}/'
        )

        if 'Contents' not in response:
            return jsonify({"error": "No dreams found"}), 404

        # Get dream contents for pattern analysis
        dream_contents = []
        for obj in response['Contents']:
            key = obj['Key']
            if not key.endswith('metadata') and not key.endswith('themes.txt'):
                try:
                    dream_response = s3_client.get_object(
                        Bucket=S3_BUCKET_NAME,
                        Key=key
                    )
                    dream_data = json.loads(dream_response['Body'].read().decode('utf-8'))
                    dream_contents.append(dream_data)
                except Exception as e:
                    continue

        if not dream_contents:
            return jsonify({"error": "No valid dreams found"}), 404

        # Analyze psychological patterns
        pattern_analysis = analyze_psychological_patterns(dream_contents)

        return jsonify(pattern_analysis), 200

    except Exception as e:
        return jsonify({"error": f"Failed to analyze patterns: {str(e)}"}), 500

@dream_analysis_bp.route('/premium-status/<phone_number>', methods=['GET'])
@cross_origin(supports_credentials=True)
def get_premium_status(phone_number):
    """Get premium status for a user (public endpoint)"""
    try:
        premium_status = check_premium_access(phone_number)
        return jsonify(premium_status), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get premium status: {str(e)}"}), 500

def perform_advanced_analysis(dreams):
    """Perform comprehensive dream analysis"""
    analysis = {
        'total_dreams': len(dreams),
        'analysis_date': datetime.utcnow().isoformat(),
        'archetype_analysis': analyze_archetypes_in_dreams(dreams),
        'emotional_patterns': analyze_emotional_patterns(dreams),
        'temporal_patterns': analyze_temporal_patterns(dreams),
        'symbol_evolution': analyze_symbol_evolution(dreams),
        'personal_insights': generate_personal_insights(dreams),
        'recommendations': generate_recommendations(dreams)
    }

    return analysis

def analyze_archetypes_in_dreams(dreams):
    """Analyze dream archetypes across all dreams using keyword-based detection"""
    archetype_counts = Counter()
    archetype_details = {}

    for dream in dreams:
        dream_text = dream.get('dreamContent', '').lower()
        dream_summary = dream.get('summary', '').lower()
        combined_text = f"{dream_text} {dream_summary}"
        
        for archetype, info in DREAM_ARCHETYPES.items():
            # Check if any keywords for this archetype appear in the dream
            keywords = info.get('keywords', [archetype])  # Fallback to archetype name if no keywords
            if any(keyword in combined_text for keyword in keywords):
                archetype_counts[archetype] += 1
                if archetype not in archetype_details:
                    archetype_details[archetype] = {
                        'count': 0,
                        'meaning': info['meaning'],
                        'positive_aspects': info['positive'],
                        'negative_aspects': info['negative'],
                        'appearances': []
                    }
                archetype_details[archetype]['count'] += 1
                archetype_details[archetype]['appearances'].append({
                    'date': dream.get('createdAt', 'Unknown'),
                    'context': dream.get('summary', dream_text)[:100] + '...'
                })

    return {
        'total_archetypes_found': len(archetype_details),
        'most_common_archetypes': archetype_counts.most_common(5),
        'archetype_details': archetype_details
    }

def analyze_emotional_patterns(dreams):
    """Analyze emotional patterns in dreams"""
    emotions = []
    intensity_levels = []

    for dream in dreams:
        # Extract emotional content from dream text
        dream_text = dream.get('dreamContent', '').lower()

        # Enhanced emotion detection with more comprehensive word lists
        emotional_words = {
            'fear': ['afraid', 'scared', 'terrified', 'fear', 'panic', 'anxiety', 'worried', 'nervous', 'dread', 'frightened', 'alarmed', 'apprehensive'],
            'joy': ['happy', 'joy', 'excited', 'elated', 'ecstatic', 'cheerful', 'delighted', 'thrilled', 'euphoric', 'blissful', 'jubilant', 'gleeful'],
            'sadness': ['sad', 'depressed', 'melancholy', 'grief', 'sorrow', 'mourning', 'dejected', 'downcast', 'blue', 'gloomy', 'despondent', 'heartbroken'],
            'anger': ['angry', 'furious', 'rage', 'irritated', 'mad', 'enraged', 'livid', 'outraged', 'fuming', 'incensed', 'wrathful', 'hostile'],
            'peace': ['calm', 'peaceful', 'serene', 'tranquil', 'relaxed', 'content', 'satisfied', 'at ease', 'composed', 'placid', 'untroubled', 'harmonious'],
            'love': ['love', 'loving', 'affectionate', 'caring', 'tender', 'romantic', 'passionate', 'devoted', 'adoring', 'fond', 'cherished', 'beloved'],
            'surprise': ['surprised', 'shocked', 'amazed', 'astonished', 'startled', 'bewildered', 'stunned', 'astounded', 'flabbergasted', 'dumbfounded'],
            'disgust': ['disgusted', 'repulsed', 'revolted', 'sickened', 'nauseated', 'appalled', 'horrified', 'repugnant', 'abhorrent', 'loathsome']
        }

        dream_emotions = []
        for emotion, words in emotional_words.items():
            if any(word in dream_text for word in words):
                dream_emotions.append(emotion)

        # If no specific emotions found, try broader sentiment analysis
        if not dream_emotions:
            # Expanded negative sentiment words
            negative_words = [
                'bad', 'terrible', 'awful', 'horrible', 'nightmare', 'scary', 'frightening',
                'worried', 'anxious', 'stressed', 'troubled', 'disturbed', 'upset', 'concerned',
                'difficult', 'hard', 'challenging', 'struggling', 'fighting', 'conflict',
                'dark', 'cold', 'lonely', 'lost', 'confused', 'overwhelmed', 'trapped',
                'hurt', 'pain', 'suffering', 'agony', 'torment', 'misery', 'despair',
                'angry', 'frustrated', 'annoyed', 'irritated', 'mad', 'furious', 'rage',
                'sad', 'depressed', 'gloomy', 'melancholy', 'sorrow', 'grief', 'mourning',
                'disappointed', 'discouraged', 'hopeless', 'helpless', 'powerless'
            ]
            
            # Expanded positive sentiment words
            positive_words = [
                'good', 'great', 'wonderful', 'amazing', 'beautiful', 'fantastic', 'excellent',
                'happy', 'joyful', 'cheerful', 'delighted', 'pleased', 'content', 'satisfied',
                'peaceful', 'calm', 'serene', 'tranquil', 'relaxed', 'comfortable', 'safe',
                'bright', 'warm', 'sunny', 'light', 'clear', 'free', 'liberated',
                'successful', 'achieving', 'winning', 'victorious', 'triumphant', 'accomplished',
                'loved', 'cared', 'cherished', 'valued', 'appreciated', 'accepted', 'welcomed',
                'excited', 'thrilled', 'enthusiastic', 'energetic', 'vibrant', 'alive', 'inspired',
                'hopeful', 'optimistic', 'confident', 'strong', 'powerful', 'capable', 'able'
            ]
            
            # Count sentiment words
            negative_count = sum(1 for word in negative_words if word in dream_text)
            positive_count = sum(1 for word in positive_words if word in dream_text)
            
            # Determine emotion based on sentiment word counts
            if negative_count > positive_count and negative_count > 0:
                dream_emotions.append('negative')
            elif positive_count > negative_count and positive_count > 0:
                dream_emotions.append('positive')
            elif negative_count > 0 or positive_count > 0:
                # If both are present, choose the stronger one
                dream_emotions.append('positive' if positive_count >= negative_count else 'negative')
            else:
                # Only default to neutral if absolutely no emotional indicators found
                dream_emotions.append('neutral')

        emotions.extend(dream_emotions)

        # Calculate emotional intensity based on emotional word density and strength
        intensity = calculate_emotional_intensity(dream_text, dream_emotions)
        intensity_levels.append(intensity)

    emotion_counts = Counter(emotions)

    return {
        'dominant_emotions': emotion_counts.most_common(3),
        'emotional_intensity_trend': {
            'average_intensity': sum(intensity_levels) / len(intensity_levels) if intensity_levels else 0,
            'intensity_range': {
                'min': min(intensity_levels) if intensity_levels else 0,
                'max': max(intensity_levels) if intensity_levels else 0
            }
        },
        'emotional_stability': analyze_emotional_stability(emotions)
    }

def analyze_temporal_patterns(dreams):
    """Analyze temporal patterns in dreams with sophisticated NLP and context understanding"""
    time_related_dreams = []
    past_dreams = []
    future_dreams = []
    present_dreams = []
    temporal_relationships = []
    temporal_insights = []
    
    # Enhanced temporal keyword detection with context analysis
    temporal_patterns = {
        'past': {
            'explicit': ['yesterday', 'childhood', 'old', 'remember', 'memory', 'ago', 'before', 'earlier', 'previously', 'once', 'used to', 'was', 'were'],
            'implicit': ['former', 'ex', 'previous', 'last', 'past', 'ancient', 'historical', 'retro', 'vintage', 'nostalgic'],
            'context': ['reminiscing', 'recalling', 'revisiting', 'looking back', 'in the past', 'back then']
        },
        'future': {
            'explicit': ['tomorrow', 'next', 'will', 'going to', 'plan', 'soon', 'later', 'eventually', 'someday', 'shall', 'gonna'],
            'implicit': ['upcoming', 'forthcoming', 'prospective', 'potential', 'anticipated', 'expected', 'predicted'],
            'context': ['planning', 'preparing', 'anticipating', 'looking forward', 'in the future', 'ahead']
        },
        'present': {
            'explicit': ['now', 'today', 'current', 'happening', 'currently', 'right now', 'at this moment', 'presently'],
            'implicit': ['ongoing', 'active', 'live', 'real-time', 'immediate', 'instant', 'contemporary'],
            'context': ['happening now', 'taking place', 'in progress', 'at present', 'currently']
        }
    }
    
    for dream in dreams:
        dream_text = dream.get('dreamContent', '').lower()
        dream_summary = dream.get('summary', '').lower()
        combined_text = f"{dream_text} {dream_summary}"
        
        # Analyze temporal content with sophisticated detection
        temporal_analysis = analyze_temporal_content(combined_text, temporal_patterns)
        
        if temporal_analysis['has_temporal_content']:
            primary_time_period = temporal_analysis['primary_time_period']
            confidence = temporal_analysis['confidence']
            temporal_keywords_found = temporal_analysis['keywords_found']
            
            time_related_dreams.append({
                'date': dream.get('createdAt', 'Unknown'),
                'time_period': primary_time_period,
                'confidence': confidence,
                'keywords_found': temporal_keywords_found,
                'content': dream.get('summary', '')[:100] + '...',
                'temporal_context': temporal_analysis['context']
            })
            
            # Categorize dreams
            if primary_time_period == 'past':
                past_dreams.append(dream)
            elif primary_time_period == 'future':
                future_dreams.append(dream)
            elif primary_time_period == 'present':
                present_dreams.append(dream)
            
            # Analyze temporal relationships
            relationships = analyze_temporal_relationships(combined_text)
            temporal_relationships.extend(relationships)
    
    # Generate temporal insights
    temporal_insights = generate_temporal_insights(past_dreams, present_dreams, future_dreams, temporal_relationships)
    
    return {
        'time_related_dreams_count': len(time_related_dreams),
        'temporal_distribution': {
            'past': len(past_dreams),
            'present': len(present_dreams),
            'future': len(future_dreams)
        },
        'temporal_confidence': calculate_temporal_confidence(time_related_dreams),
        'temporal_relationships': temporal_relationships[:10],
        'temporal_insights': temporal_insights,
        'time_related_dreams': time_related_dreams[:10]
    }

def analyze_symbol_evolution(dreams):
    """Analyze how dream symbols evolve over time with sophisticated extraction and analysis"""
    # Sort dreams by date
    sorted_dreams = sorted(dreams, key=lambda x: x.get('createdAt', ''))
    
    # Extract symbols dynamically from all dreams
    all_symbols = extract_dream_symbols(sorted_dreams)
    
    # Analyze symbol evolution patterns
    symbol_evolution = {}
    symbol_frequency_tracking = {}
    symbol_context_analysis = {}
    
    for dream in sorted_dreams:
        dream_text = dream.get('dreamContent', '').lower()
        dream_summary = dream.get('summary', '').lower()
        date = dream.get('createdAt', 'Unknown')
        combined_text = f"{dream_text} {dream_summary}"
        
        # Extract symbols present in this dream
        dream_symbols = extract_symbols_from_text(combined_text, all_symbols)
        
        for symbol in dream_symbols:
            if symbol not in symbol_evolution:
                symbol_evolution[symbol] = []
                symbol_frequency_tracking[symbol] = []
                symbol_context_analysis[symbol] = []
            
            # Track symbol appearance
            symbol_evolution[symbol].append({
                'date': date,
                'context': dream.get('summary', '')[:100] + '...',
                'evolution_stage': len(symbol_evolution[symbol]) + 1,
                'dream_length': len(dream_text.split()),
                'symbol_frequency': dream_symbols.count(symbol)
            })
            
            # Track frequency over time
            symbol_frequency_tracking[symbol].append({
                'date': date,
                'frequency': dream_symbols.count(symbol),
                'relative_frequency': dream_symbols.count(symbol) / len(dream_text.split()) if dream_text else 0
            })
            
            # Analyze context around symbol
            context = extract_symbol_context(combined_text, symbol)
            symbol_context_analysis[symbol].append({
                'date': date,
                'context_words': context,
                'emotional_context': analyze_symbol_emotional_context(context)
            })
    
    # Calculate evolution metrics for each symbol
    evolution_metrics = {}
    for symbol, appearances in symbol_evolution.items():
        if len(appearances) > 1:  # Only analyze symbols that appear multiple times
            evolution_metrics[symbol] = calculate_symbol_evolution_metrics(
                symbol, appearances, symbol_frequency_tracking[symbol], symbol_context_analysis[symbol]
            )
    
    return {
        'symbols_tracked': len(symbol_evolution),
        'symbol_evolution': symbol_evolution,
        'most_evolving_symbols': sorted(
            evolution_metrics.items(),
            key=lambda x: x[1]['evolution_score'],
            reverse=True
        )[:10],
        'symbol_frequency_trends': symbol_frequency_tracking,
        'symbol_context_evolution': symbol_context_analysis,
        'evolution_insights': generate_symbol_evolution_insights(evolution_metrics)
    }

def analyze_emotional_stability(emotions):
    """Analyze emotional stability based on dream emotions with sophisticated volatility and pattern analysis"""
    if not emotions:
        return {
            'stability_level': "insufficient_data",
            'volatility_score': 0,
            'diversity_score': 0,
            'pattern_consistency': 0,
            'emotional_trends': [],
            'stability_insights': ["Insufficient emotional data for analysis. Continue journaling to build emotional patterns."]
        }

    emotion_counts = Counter(emotions)
    total_emotions = len(emotions)
    
    # Calculate emotional diversity
    diversity = len(emotion_counts) / total_emotions if total_emotions > 0 else 0
    
    # Calculate emotional volatility (how much emotions change)
    volatility = calculate_emotional_volatility(emotions)
    
    # Analyze emotional patterns and trends
    pattern_analysis = analyze_emotional_patterns_advanced(emotions)
    
    # Determine stability level based on multiple factors
    stability_level = determine_emotional_stability_level(diversity, volatility, pattern_analysis['consistency'])
    
    # Generate insights
    insights = generate_emotional_stability_insights(diversity, volatility, pattern_analysis, emotion_counts)
    
    return {
        'stability_level': stability_level,
        'volatility_score': volatility,
        'diversity_score': diversity,
        'pattern_consistency': pattern_analysis['consistency'],
        'emotional_trends': pattern_analysis['trends'],
        'dominant_emotions': emotion_counts.most_common(3),
        'stability_insights': insights
    }

def generate_personal_insights(dreams):
    """Generate personalized insights based on dream analysis"""
    insights = []

    # Analyze dream frequency
    if len(dreams) > 20:
        insights.append("You have a rich dream life with many recorded experiences, suggesting strong self-awareness and introspection.")
    elif len(dreams) > 10:
        insights.append("Your dream journal shows consistent engagement with your inner world, indicating good self-reflection habits.")
    else:
        insights.append("You're beginning your dream journey. Regular recording will reveal fascinating patterns over time.")

    # Analyze dream themes (filter out stopwords/punctuation)
    themes: list[str] = []
    for dream in dreams:
        summary_text = dream.get('summary', '')
        themes.extend(extract_meaningful_words(summary_text))

    theme_counts = Counter(themes)
    common_themes = [theme for theme, count in theme_counts.most_common(10) if count > 1]

    if common_themes:
        insights.append(
            f"Recurring themes in your dreams include: {', '.join(common_themes[:5])}. These may indicate areas of your life that need attention."
        )

    # Analyze dream intensity
    total_content_length = sum(len(dream.get('dreamContent', '')) for dream in dreams)
    avg_length = total_content_length / len(dreams) if dreams else 0

    if avg_length > 500:
        insights.append("Your dreams are detailed and vivid, suggesting strong imagination and emotional depth.")
    elif avg_length > 200:
        insights.append("Your dreams show good detail, indicating active engagement with your subconscious mind.")

    return insights

def generate_recommendations(dreams):
    """Generate personalized recommendations based on dream analysis"""
    recommendations = []

    # Based on dream frequency
    if len(dreams) < 10:
        recommendations.append("Try to record your dreams more frequently to build a comprehensive understanding of your patterns.")

    # Based on emotional patterns
    emotions = []
    for dream in dreams:
        dream_text = dream.get('dreamContent', '').lower()
        
        # Enhanced emotion detection
        negative_words = ['fear', 'anxiety', 'stress', 'worried', 'scared', 'terrified', 'angry', 'sad', 'depressed', 'frustrated', 'hurt', 'pain', 'struggling', 'difficult', 'hard', 'bad', 'terrible', 'awful', 'nightmare']
        positive_words = ['joy', 'peace', 'happiness', 'happy', 'calm', 'serene', 'content', 'satisfied', 'good', 'great', 'wonderful', 'amazing', 'beautiful', 'successful', 'achieving', 'loved', 'caring', 'safe', 'comfortable']
        
        negative_count = sum(1 for word in negative_words if word in dream_text)
        positive_count = sum(1 for word in positive_words if word in dream_text)
        
        if negative_count > positive_count and negative_count > 0:
            emotions.append('negative')
        elif positive_count > negative_count and positive_count > 0:
            emotions.append('positive')
        elif negative_count > 0 or positive_count > 0:
            emotions.append('positive' if positive_count >= negative_count else 'negative')
        else:
            emotions.append('neutral')

    if emotions.count('negative') > emotions.count('positive'):
        recommendations.append("Consider incorporating stress-reduction techniques like meditation or journaling into your daily routine.")

    # Based on archetype analysis
    archetype_counts = Counter()
    for dream in dreams:
        dream_text = dream.get('dreamContent', '').lower()
        for archetype in DREAM_ARCHETYPES:
            if archetype in dream_text:
                archetype_counts[archetype] += 1

    if 'water' in archetype_counts and archetype_counts['water'] > 2:
        recommendations.append("Water appears frequently in your dreams. Consider exploring your emotional landscape through therapy or creative expression.")

    if 'flying' in archetype_counts and archetype_counts['flying'] > 1:
        recommendations.append("Flying dreams suggest a desire for freedom. Reflect on what limitations you'd like to overcome in your waking life.")

    return recommendations

def analyze_dream_archetypes(dream_keys, phone_number):
    """Analyze archetypes in specific dreams"""
    archetype_analysis = {
        'archetypes_found': [],
        'archetype_details': {},
        'recommendations': []
    }

    for dream_key in dream_keys[:5]:  # Analyze last 5 dreams
        try:
            dream_response = s3_client.get_object(
                Bucket=S3_BUCKET_NAME,
                Key=dream_key['key']
            )
            dream_data = json.loads(dream_response['Body'].read().decode('utf-8'))

            dream_text = dream_data.get('dreamContent', '').lower()
            dream_summary = dream_data.get('summary', '').lower()
            combined_text = f"{dream_text} {dream_summary}"

            for archetype, info in DREAM_ARCHETYPES.items():
                keywords = info.get('keywords', [archetype])  # Fallback to archetype name if no keywords
                if any(keyword in combined_text for keyword in keywords):
                    if archetype not in archetype_analysis['archetypes_found']:
                        archetype_analysis['archetypes_found'].append(archetype)

                    if archetype not in archetype_analysis['archetype_details']:
                        archetype_analysis['archetype_details'][archetype] = {
                            'meaning': info['meaning'],
                            'positive_aspects': info['positive'],
                            'negative_aspects': info['negative'],
                            'appearances': []
                        }

                    archetype_analysis['archetype_details'][archetype]['appearances'].append({
                        'date': dream_data.get('createdAt', 'Unknown'),
                        'context': dream_data.get('summary', dream_text)[:100] + '...'
                    })
        except Exception as e:
            continue

    # Generate recommendations based on found archetypes
    for archetype in archetype_analysis['archetypes_found']:
        if archetype == 'water':
            archetype_analysis['recommendations'].append("Water dreams suggest emotional processing. Consider journaling about your feelings.")
        elif archetype == 'flying':
            archetype_analysis['recommendations'].append("Flying dreams indicate freedom and transcendence. Reflect on what you want to achieve.")
        elif archetype == 'falling':
            archetype_analysis['recommendations'].append("Falling dreams may indicate anxiety. Practice grounding techniques like deep breathing.")
        elif archetype == 'chase':
            archetype_analysis['recommendations'].append("Chase dreams often reflect avoidance or pursuit. Consider what you're running from or toward.")
        elif archetype == 'house':
            archetype_analysis['recommendations'].append("House dreams represent your inner self. Reflect on your personal growth and stability.")
        elif archetype == 'death':
            archetype_analysis['recommendations'].append("Death dreams symbolize transformation. Embrace change and new beginnings.")
        elif archetype == 'teeth':
            archetype_analysis['recommendations'].append("Teeth dreams relate to communication and confidence. Consider your self-expression.")
        elif archetype == 'naked':
            archetype_analysis['recommendations'].append("Naked dreams suggest vulnerability and authenticity. Embrace your true self.")

    return archetype_analysis

def analyze_psychological_patterns(dreams):
    """Analyze psychological patterns in dreams"""
    pattern_analysis = {
        'recurring_themes': {},
        'emotional_patterns': {},
        'symbol_patterns': {},
        'insights': []
    }

    # Analyze recurring themes
    all_themes: list[str] = []
    for dream in dreams:
        if 'summary' in dream:
            all_themes.extend(extract_meaningful_words(dream['summary']))

    theme_counts = Counter(all_themes)
    recurring_themes = {theme: count for theme, count in theme_counts.items() if count > 1}

    pattern_analysis['recurring_themes'] = {
        'count': len(recurring_themes),
        'themes': dict(sorted(recurring_themes.items(), key=lambda x: x[1], reverse=True)[:10])
    }

    # Analyze emotional patterns using comprehensive emotion detection
    emotions = []
    for dream in dreams:
        dream_text = dream.get('dreamContent', '').lower()
        
        # Comprehensive emotion detection
        emotional_words = {
            'fear': ['afraid', 'scared', 'terrified', 'fear', 'panic', 'anxiety', 'worried', 'nervous', 'dread'],
            'joy': ['happy', 'joy', 'excited', 'elated', 'ecstatic', 'cheerful', 'delighted', 'thrilled', 'euphoric'],
            'sadness': ['sad', 'depressed', 'melancholy', 'grief', 'sorrow', 'mourning', 'dejected', 'downcast', 'blue'],
            'anger': ['angry', 'furious', 'rage', 'irritated', 'mad', 'enraged', 'livid', 'outraged', 'fuming'],
            'peace': ['calm', 'peaceful', 'serene', 'tranquil', 'relaxed', 'content', 'satisfied', 'at ease', 'composed'],
            'love': ['love', 'loving', 'affectionate', 'caring', 'tender', 'romantic', 'passionate', 'devoted'],
            'surprise': ['surprised', 'shocked', 'amazed', 'astonished', 'startled', 'bewildered', 'stunned'],
            'disgust': ['disgusted', 'repulsed', 'revolted', 'sickened', 'nauseated', 'appalled', 'horrified']
        }
        
        dream_emotions = []
        for emotion, words in emotional_words.items():
            if any(word in dream_text for word in words):
                dream_emotions.append(emotion)
        
        # If no specific emotions found, try broader sentiment analysis
        if not dream_emotions:
            # Expanded negative sentiment words
            negative_words = [
                'bad', 'terrible', 'awful', 'horrible', 'nightmare', 'scary', 'frightening',
                'worried', 'anxious', 'stressed', 'troubled', 'disturbed', 'upset', 'concerned',
                'difficult', 'hard', 'challenging', 'struggling', 'fighting', 'conflict',
                'dark', 'cold', 'lonely', 'lost', 'confused', 'overwhelmed', 'trapped',
                'hurt', 'pain', 'suffering', 'agony', 'torment', 'misery', 'despair',
                'angry', 'frustrated', 'annoyed', 'irritated', 'mad', 'furious', 'rage',
                'sad', 'depressed', 'gloomy', 'melancholy', 'sorrow', 'grief', 'mourning',
                'disappointed', 'discouraged', 'hopeless', 'helpless', 'powerless'
            ]
            
            # Expanded positive sentiment words
            positive_words = [
                'good', 'great', 'wonderful', 'amazing', 'beautiful', 'fantastic', 'excellent',
                'happy', 'joyful', 'cheerful', 'delighted', 'pleased', 'content', 'satisfied',
                'peaceful', 'calm', 'serene', 'tranquil', 'relaxed', 'comfortable', 'safe',
                'bright', 'warm', 'sunny', 'light', 'clear', 'free', 'liberated',
                'successful', 'achieving', 'winning', 'victorious', 'triumphant', 'accomplished',
                'loved', 'cared', 'cherished', 'valued', 'appreciated', 'accepted', 'welcomed',
                'excited', 'thrilled', 'enthusiastic', 'energetic', 'vibrant', 'alive', 'inspired',
                'hopeful', 'optimistic', 'confident', 'strong', 'powerful', 'capable', 'able'
            ]
            
            # Count sentiment words
            negative_count = sum(1 for word in negative_words if word in dream_text)
            positive_count = sum(1 for word in positive_words if word in dream_text)
            
            # Determine emotion based on sentiment word counts
            if negative_count > positive_count and negative_count > 0:
                dream_emotions.append('negative')
            elif positive_count > negative_count and positive_count > 0:
                dream_emotions.append('positive')
            elif negative_count > 0 or positive_count > 0:
                # If both are present, choose the stronger one
                dream_emotions.append('positive' if positive_count >= negative_count else 'negative')
            else:
                # Only default to neutral if absolutely no emotional indicators found
                dream_emotions.append('neutral')
        
        emotions.extend(dream_emotions)

    emotion_counts = Counter(emotions)
    pattern_analysis['emotional_patterns'] = {
        'distribution': dict(emotion_counts),
        'dominant_emotion': emotion_counts.most_common(1)[0][0] if emotion_counts else 'neutral'
    }

    # Generate insights
    if pattern_analysis['recurring_themes']['count'] > 5:
        pattern_analysis['insights'].append("You have many recurring themes, suggesting deep engagement with specific life areas.")

    # Enhanced emotional insights
    if emotion_counts:
        dominant_emotion = emotion_counts.most_common(1)[0][0]
        total_emotions = sum(emotion_counts.values())
        
        if dominant_emotion == 'fear':
            pattern_analysis['insights'].append("Fear appears frequently in your dreams. This may indicate anxiety or unresolved concerns in your waking life.")
        elif dominant_emotion == 'joy':
            pattern_analysis['insights'].append("Joy and happiness dominate your dreams, suggesting a positive emotional state and optimistic outlook.")
        elif dominant_emotion == 'sadness':
            pattern_analysis['insights'].append("Sadness appears often in your dreams. Consider exploring these feelings and their connection to your waking life.")
        elif dominant_emotion == 'anger':
            pattern_analysis['insights'].append("Anger is prominent in your dreams. This may reflect frustration or unresolved conflicts.")
        elif dominant_emotion == 'peace':
            pattern_analysis['insights'].append("Your dreams show a peaceful emotional landscape, indicating emotional balance and tranquility.")
        elif dominant_emotion == 'love':
            pattern_analysis['insights'].append("Love and affection feature prominently in your dreams, reflecting strong emotional connections.")
        
        # Check for emotional diversity
        emotion_diversity = len(emotion_counts) / total_emotions if total_emotions > 0 else 0
        if emotion_diversity > 0.6:
            pattern_analysis['insights'].append("Your dreams show rich emotional diversity, indicating a complex and nuanced inner life.")
        elif emotion_diversity < 0.3:
            pattern_analysis['insights'].append("Your dreams show focused emotional patterns, suggesting specific areas of emotional processing.")

    return pattern_analysis
