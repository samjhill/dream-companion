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

dream_analysis_bp = Blueprint('dream_analysis_bp', __name__)

# Initialize S3 client
s3_client = boto3.client('s3')
S3_BUCKET_NAME = os.getenv('S3_BUCKET_NAME')

# Dream archetypes and their meanings
DREAM_ARCHETYPES = {
    'water': {
        'meaning': 'Emotions, subconscious, purification, change',
        'positive': 'Emotional healing, spiritual growth, renewal',
        'negative': 'Emotional overwhelm, feeling lost, fear of change'
    },
    'flying': {
        'meaning': 'Freedom, transcendence, spiritual elevation, escape',
        'positive': 'Achievement, breaking limitations, spiritual awakening',
        'negative': 'Avoiding problems, unrealistic expectations, escapism'
    },
    'falling': {
        'meaning': 'Loss of control, fear, anxiety, letting go',
        'positive': 'Surrendering to change, releasing control, transformation',
        'negative': 'Fear of failure, loss of security, anxiety'
    },
    'chase': {
        'meaning': 'Avoiding problems, running from fears, pursuit of goals',
        'positive': 'Facing challenges, determination, goal pursuit',
        'negative': 'Avoidance, fear, unresolved issues'
    },
    'house': {
        'meaning': 'Self, mind, personality, life structure',
        'positive': 'Self-discovery, personal growth, stability',
        'negative': 'Identity crisis, instability, feeling lost'
    },
    'death': {
        'meaning': 'Transformation, change, ending of old patterns',
        'positive': 'Personal growth, new beginnings, transformation',
        'negative': 'Fear of change, loss, anxiety about endings'
    },
    'teeth': {
        'meaning': 'Communication, power, confidence, appearance',
        'positive': 'Clear communication, confidence, self-expression',
        'negative': 'Communication issues, loss of power, insecurity'
    },
    'naked': {
        'meaning': 'Vulnerability, authenticity, exposure, truth',
        'positive': 'Being authentic, revealing true self, honesty',
        'negative': 'Feeling exposed, vulnerability, shame'
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

# Premium decorator is now imported from premium module

@dream_analysis_bp.route('/advanced/<phone_number>', methods=['GET'])
@cross_origin(supports_credentials=True)
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
    """Analyze dream archetypes across all dreams"""
    archetype_counts = Counter()
    archetype_details = {}

    for dream in dreams:
        dream_text = dream.get('dreamContent', '').lower()
        for archetype, info in DREAM_ARCHETYPES.items():
            if archetype in dream_text:
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
                    'context': dream.get('summary', '')[:100] + '...'
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

        # Simple emotion detection (in a real implementation, you'd use NLP)
        emotional_words = {
            'fear': ['afraid', 'scared', 'terrified', 'fear', 'panic'],
            'joy': ['happy', 'joy', 'excited', 'elated', 'ecstatic'],
            'sadness': ['sad', 'depressed', 'melancholy', 'grief', 'sorrow'],
            'anger': ['angry', 'furious', 'rage', 'irritated', 'mad'],
            'peace': ['calm', 'peaceful', 'serene', 'tranquil', 'relaxed']
        }

        dream_emotions = []
        for emotion, words in emotional_words.items():
            if any(word in dream_text for word in words):
                dream_emotions.append(emotion)

        emotions.extend(dream_emotions)

        # Estimate emotional intensity based on dream content length and keywords
        intensity = len(dream_text.split()) / 100  # Simple heuristic
        intensity_levels.append(min(intensity, 1.0))

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
    """Analyze temporal patterns in dreams"""
    time_related_dreams = []
    past_dreams = []
    future_dreams = []
    present_dreams = []

    time_keywords = {
        'past': ['yesterday', 'childhood', 'old', 'remember', 'memory'],
        'future': ['tomorrow', 'next', 'will', 'going to', 'plan'],
        'present': ['now', 'today', 'current', 'happening']
    }

    for dream in dreams:
        dream_text = dream.get('dreamContent', '').lower()

        for time_period, keywords in time_keywords.items():
            if any(keyword in dream_text for keyword in keywords):
                time_related_dreams.append({
                    'date': dream.get('createdAt', 'Unknown'),
                    'time_period': time_period,
                    'content': dream.get('summary', '')[:100] + '...'
                })

                if time_period == 'past':
                    past_dreams.append(dream)
                elif time_period == 'future':
                    future_dreams.append(dream)
                elif time_period == 'present':
                    present_dreams.append(dream)

    return {
        'time_related_dreams_count': len(time_related_dreams),
        'temporal_distribution': {
            'past': len(past_dreams),
            'present': len(present_dreams),
            'future': len(future_dreams)
        },
        'time_related_dreams': time_related_dreams[:10]  # Limit to 10 most recent
    }

def analyze_symbol_evolution(dreams):
    """Analyze how dream symbols evolve over time"""
    # Sort dreams by date
    sorted_dreams = sorted(dreams, key=lambda x: x.get('createdAt', ''))

    symbol_evolution = {}

    for dream in sorted_dreams:
        dream_text = dream.get('dreamContent', '').lower()
        date = dream.get('createdAt', 'Unknown')

        # Track common symbols over time
        common_symbols = ['water', 'house', 'car', 'tree', 'animal', 'person', 'door', 'window']

        for symbol in common_symbols:
            if symbol in dream_text:
                if symbol not in symbol_evolution:
                    symbol_evolution[symbol] = []

                symbol_evolution[symbol].append({
                    'date': date,
                    'context': dream.get('summary', '')[:100] + '...',
                    'evolution_stage': len(symbol_evolution[symbol]) + 1
                })

    return {
        'symbols_tracked': len(symbol_evolution),
        'symbol_evolution': symbol_evolution,
        'most_evolving_symbols': sorted(
            symbol_evolution.items(),
            key=lambda x: len(x[1]),
            reverse=True
        )[:5]
    }

def analyze_emotional_stability(emotions):
    """Analyze emotional stability based on dream emotions"""
    if not emotions:
        return "insufficient_data"

    emotion_counts = Counter(emotions)
    total_emotions = len(emotions)

    # Calculate emotional diversity
    diversity = len(emotion_counts) / total_emotions if total_emotions > 0 else 0

    if diversity > 0.6:
        return "emotionally_balanced"
    elif diversity > 0.3:
        return "moderately_stable"
    else:
        return "emotionally_focused"

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
        if any(word in dream_text for word in ['fear', 'anxiety', 'stress']):
            emotions.append('negative')
        elif any(word in dream_text for word in ['joy', 'peace', 'happiness']):
            emotions.append('positive')

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

            for archetype, info in DREAM_ARCHETYPES.items():
                if archetype in dream_text:
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
                        'context': dream_data.get('summary', '')[:100] + '...'
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

    # Analyze emotional patterns
    emotions = []
    for dream in dreams:
        dream_text = dream.get('dreamContent', '').lower()
        if any(word in dream_text for word in ['fear', 'anxiety', 'stress', 'worry']):
            emotions.append('negative')
        elif any(word in dream_text for word in ['joy', 'happiness', 'peace', 'excitement']):
            emotions.append('positive')
        else:
            emotions.append('neutral')

    emotion_counts = Counter(emotions)
    pattern_analysis['emotional_patterns'] = {
        'distribution': dict(emotion_counts),
        'dominant_emotion': emotion_counts.most_common(1)[0][0] if emotion_counts else 'neutral'
    }

    # Generate insights
    if pattern_analysis['recurring_themes']['count'] > 5:
        pattern_analysis['insights'].append("You have many recurring themes, suggesting deep engagement with specific life areas.")

    if emotion_counts['negative'] > emotion_counts['positive']:
        pattern_analysis['insights'].append("Your dreams show more negative emotions. Consider stress management techniques.")

    return pattern_analysis
