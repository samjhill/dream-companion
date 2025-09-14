from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
import boto3
import os
import json
import uuid
from datetime import datetime, timedelta
from functools import wraps
from .auth import require_cognito_auth, get_cognito_user_info
from .premium import require_premium

memories_bp = Blueprint('memories_bp', __name__)

# Initialize DynamoDB client for memory management
dynamodb = boto3.resource('dynamodb')
memories_table_name = os.getenv('MEMORIES_TABLE_NAME', 'dream-companion-memories')

def get_memories_table():
    """Get or create the memories table"""
    try:
        table = dynamodb.Table(memories_table_name)
        table.load()
        return table
    except:
        # Create table if it doesn't exist
        table = dynamodb.create_table(
            TableName=memories_table_name,
            KeySchema=[
                {
                    'AttributeName': 'user_id',
                    'KeyType': 'HASH'
                }
            ],
            AttributeDefinitions=[
                {
                    'AttributeName': 'user_id',
                    'AttributeType': 'S'
                }
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        table.wait_until_exists()
        return table

def get_default_user_memories(user_id):
    """Get default user memories structure"""
    return {
        'user_id': user_id,
        'traits': {},
        'dream_patterns': {
            'symbols': {},
            'themes': {},
            'emotions': {}
        },
        'personal_context': {
            'life_events': [],
            'goals': []
        },
        'memories': [],
        'created_at': datetime.utcnow().isoformat(),
        'last_updated': datetime.utcnow().isoformat()
    }

@memories_bp.route('/user/<user_id>', methods=['GET'])
@cross_origin(supports_credentials=True)
@require_cognito_auth
@require_premium
def get_user_memories(user_id):
    """Get user memories"""
    try:
        table = get_memories_table()
        response = table.get_item(Key={'user_id': user_id})

        if 'Item' not in response:
            # Create default memories for new user
            default_memories = get_default_user_memories(user_id)
            table.put_item(Item=default_memories)
            return jsonify(default_memories), 200

        return jsonify(response['Item']), 200

    except Exception as e:
        return jsonify({"error": f"Failed to get user memories: {str(e)}"}), 500

@memories_bp.route('/user/<user_id>/summary', methods=['GET'])
@cross_origin(supports_credentials=True)
@require_cognito_auth
@require_premium
def get_user_memory_summary(user_id):
    """Get user memory summary"""
    try:
        table = get_memories_table()
        response = table.get_item(Key={'user_id': user_id})

        if 'Item' not in response:
            return jsonify({"summary": "No memory data available yet."}), 200

        memories = response['Item']
        summary = f"User has {len(memories.get('traits', {}))} traits, {len(memories.get('memories', []))} memories, and {len(memories.get('personal_context', {}).get('life_events', [])) + len(memories.get('personal_context', {}).get('goals', []))} context items."

        return jsonify({"summary": summary}), 200

    except Exception as e:
        return jsonify({"error": f"Failed to get memory summary: {str(e)}"}), 500

@memories_bp.route('/user/<user_id>/trait', methods=['POST'])
@cross_origin(supports_credentials=True)
@require_cognito_auth
@require_premium
def add_trait(user_id):
    """Add or update a user trait"""
    try:
        data = request.get_json()
        trait_type = data.get('trait_type')
        trait_value = data.get('trait_value')
        confidence = data.get('confidence', 0.5)

        if not trait_type or not trait_value:
            return jsonify({"error": "trait_type and trait_value are required"}), 400

        table = get_memories_table()
        
        # Get existing memories
        response = table.get_item(Key={'user_id': user_id})
        if 'Item' not in response:
            memories = get_default_user_memories(user_id)
        else:
            memories = response['Item']

        # Update trait
        memories['traits'][trait_type] = {
            'value': trait_value,
            'confidence': confidence,
            'updated_at': datetime.utcnow().isoformat()
        }
        memories['last_updated'] = datetime.utcnow().isoformat()

        # Save back to DynamoDB
        table.put_item(Item=memories)

        return jsonify({"success": True, "message": "Trait added successfully"}), 200

    except Exception as e:
        return jsonify({"error": f"Failed to add trait: {str(e)}"}), 500

@memories_bp.route('/user/<user_id>/memory', methods=['POST'])
@cross_origin(supports_credentials=True)
@require_cognito_auth
@require_premium
def add_memory(user_id):
    """Add a new memory entry"""
    try:
        data = request.get_json()
        content = data.get('content')
        memory_type = data.get('memory_type')
        importance = data.get('importance', 'medium')
        tags = data.get('tags', [])

        if not content or not memory_type:
            return jsonify({"error": "content and memory_type are required"}), 400

        table = get_memories_table()
        
        # Get existing memories
        response = table.get_item(Key={'user_id': user_id})
        if 'Item' not in response:
            memories = get_default_user_memories(user_id)
        else:
            memories = response['Item']

        # Add new memory
        new_memory = {
            'id': str(uuid.uuid4()),
            'content': content,
            'type': memory_type,
            'importance': importance,
            'tags': tags,
            'created_at': datetime.utcnow().isoformat()
        }
        
        memories['memories'].append(new_memory)
        memories['last_updated'] = datetime.utcnow().isoformat()

        # Save back to DynamoDB
        table.put_item(Item=memories)

        return jsonify({"success": True, "message": "Memory added successfully"}), 200

    except Exception as e:
        return jsonify({"error": f"Failed to add memory: {str(e)}"}), 500

@memories_bp.route('/user/<user_id>/context', methods=['POST'])
@cross_origin(supports_credentials=True)
@require_cognito_auth
@require_premium
def add_context(user_id):
    """Add personal context information"""
    try:
        data = request.get_json()
        context_type = data.get('context_type')
        context_value = data.get('context_value')
        importance = data.get('importance', 'medium')
        source = data.get('source', 'user')

        if not context_type or not context_value:
            return jsonify({"error": "context_type and context_value are required"}), 400

        table = get_memories_table()
        
        # Get existing memories
        response = table.get_item(Key={'user_id': user_id})
        if 'Item' not in response:
            memories = get_default_user_memories(user_id)
        else:
            memories = response['Item']

        # Add new context item
        new_context = {
            'id': str(uuid.uuid4()),
            'value': context_value,
            'importance': importance,
            'source': source,
            'created_at': datetime.utcnow().isoformat()
        }
        
        if context_type == 'life_event':
            memories['personal_context']['life_events'].append(new_context)
        elif context_type == 'goal':
            memories['personal_context']['goals'].append(new_context)
        else:
            return jsonify({"error": "Invalid context_type. Must be 'life_event' or 'goal'"}), 400

        memories['last_updated'] = datetime.utcnow().isoformat()

        # Save back to DynamoDB
        table.put_item(Item=memories)

        return jsonify({"success": True, "message": "Context added successfully"}), 200

    except Exception as e:
        return jsonify({"error": f"Failed to add context: {str(e)}"}), 500

@memories_bp.route('/user/<user_id>/cleanup', methods=['POST'])
@cross_origin(supports_credentials=True)
@require_cognito_auth
@require_premium
def cleanup_memories(user_id):
    """Clean up old, low-importance memories"""
    try:
        data = request.get_json()
        days_to_keep = data.get('days_to_keep', 30)

        table = get_memories_table()
        
        # Get existing memories
        response = table.get_item(Key={'user_id': user_id})
        if 'Item' not in response:
            return jsonify({"success": True, "message": "No memories to cleanup"}), 200

        memories = response['Item']
        cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)
        
        # Clean up old, low-importance memories
        original_count = len(memories['memories'])
        memories['memories'] = [
            memory for memory in memories['memories']
            if (memory['importance'] == 'high' or 
                datetime.fromisoformat(memory['created_at'].replace('Z', '+00:00')) > cutoff_date)
        ]
        
        cleaned_count = original_count - len(memories['memories'])
        memories['last_updated'] = datetime.utcnow().isoformat()

        # Save back to DynamoDB
        table.put_item(Item=memories)

        return jsonify({
            "success": True, 
            "message": f"Cleaned up {cleaned_count} old memories"
        }), 200

    except Exception as e:
        return jsonify({"error": f"Failed to cleanup memories: {str(e)}"}), 500

@memories_bp.route('/user/<user_id>/memory/<memory_id>', methods=['PUT'])
@cross_origin(supports_credentials=True)
@require_cognito_auth
@require_premium
def update_memory(user_id, memory_id):
    """Update a memory item"""
    try:
        data = request.get_json()
        
        table = get_memories_table()
        response = table.get_item(Key={'user_id': user_id})
        
        if 'Item' not in response:
            return jsonify({"error": "User memories not found"}), 404

        memories = response['Item']
        
        # Find and update memory
        for i, memory in enumerate(memories['memories']):
            if memory['id'] == memory_id:
                memories['memories'][i].update(data)
                memories['memories'][i]['updated_at'] = datetime.utcnow().isoformat()
                memories['last_updated'] = datetime.utcnow().isoformat()
                
                table.put_item(Item=memories)
                return jsonify({"success": True, "message": "Memory updated successfully"}), 200
        
        return jsonify({"error": "Memory not found"}), 404

    except Exception as e:
        return jsonify({"error": f"Failed to update memory: {str(e)}"}), 500

@memories_bp.route('/user/<user_id>/memory/<memory_id>', methods=['DELETE'])
@cross_origin(supports_credentials=True)
@require_cognito_auth
@require_premium
def delete_memory(user_id, memory_id):
    """Delete a memory item"""
    try:
        table = get_memories_table()
        response = table.get_item(Key={'user_id': user_id})
        
        if 'Item' not in response:
            return jsonify({"error": "User memories not found"}), 404

        memories = response['Item']
        
        # Find and remove memory
        original_count = len(memories['memories'])
        memories['memories'] = [memory for memory in memories['memories'] if memory['id'] != memory_id]
        
        if len(memories['memories']) == original_count:
            return jsonify({"error": "Memory not found"}), 404
            
        memories['last_updated'] = datetime.utcnow().isoformat()
        table.put_item(Item=memories)

        return jsonify({"success": True, "message": "Memory deleted successfully"}), 200

    except Exception as e:
        return jsonify({"error": f"Failed to delete memory: {str(e)}"}), 500

@memories_bp.route('/user/<user_id>/trait/<trait_type>', methods=['PUT'])
@cross_origin(supports_credentials=True)
@require_cognito_auth
@require_premium
def update_trait(user_id, trait_type):
    """Update a trait"""
    try:
        data = request.get_json()
        
        table = get_memories_table()
        response = table.get_item(Key={'user_id': user_id})
        
        if 'Item' not in response:
            return jsonify({"error": "User memories not found"}), 404

        memories = response['Item']
        
        if trait_type not in memories['traits']:
            return jsonify({"error": "Trait not found"}), 404

        # Update trait
        memories['traits'][trait_type].update(data)
        memories['traits'][trait_type]['updated_at'] = datetime.utcnow().isoformat()
        memories['last_updated'] = datetime.utcnow().isoformat()
        
        table.put_item(Item=memories)

        return jsonify({"success": True, "message": "Trait updated successfully"}), 200

    except Exception as e:
        return jsonify({"error": f"Failed to update trait: {str(e)}"}), 500

@memories_bp.route('/user/<user_id>/trait/<trait_type>', methods=['DELETE'])
@cross_origin(supports_credentials=True)
@require_cognito_auth
@require_premium
def delete_trait(user_id, trait_type):
    """Delete a trait"""
    try:
        table = get_memories_table()
        response = table.get_item(Key={'user_id': user_id})
        
        if 'Item' not in response:
            return jsonify({"error": "User memories not found"}), 404

        memories = response['Item']
        
        if trait_type not in memories['traits']:
            return jsonify({"error": "Trait not found"}), 404

        del memories['traits'][trait_type]
        memories['last_updated'] = datetime.utcnow().isoformat()
        
        table.put_item(Item=memories)

        return jsonify({"success": True, "message": "Trait deleted successfully"}), 200

    except Exception as e:
        return jsonify({"error": f"Failed to delete trait: {str(e)}"}), 500

@memories_bp.route('/user/<user_id>/context/<context_id>', methods=['PUT'])
@cross_origin(supports_credentials=True)
@require_cognito_auth
@require_premium
def update_context(user_id, context_id):
    """Update personal context"""
    try:
        data = request.get_json()
        
        table = get_memories_table()
        response = table.get_item(Key={'user_id': user_id})
        
        if 'Item' not in response:
            return jsonify({"error": "User memories not found"}), 404

        memories = response['Item']
        
        # Find and update context in life_events
        for i, event in enumerate(memories['personal_context']['life_events']):
            if event['id'] == context_id:
                memories['personal_context']['life_events'][i].update(data)
                memories['personal_context']['life_events'][i]['updated_at'] = datetime.utcnow().isoformat()
                memories['last_updated'] = datetime.utcnow().isoformat()
                
                table.put_item(Item=memories)
                return jsonify({"success": True, "message": "Context updated successfully"}), 200
        
        # Find and update context in goals
        for i, goal in enumerate(memories['personal_context']['goals']):
            if goal['id'] == context_id:
                memories['personal_context']['goals'][i].update(data)
                memories['personal_context']['goals'][i]['updated_at'] = datetime.utcnow().isoformat()
                memories['last_updated'] = datetime.utcnow().isoformat()
                
                table.put_item(Item=memories)
                return jsonify({"success": True, "message": "Context updated successfully"}), 200
        
        return jsonify({"error": "Context not found"}), 404

    except Exception as e:
        return jsonify({"error": f"Failed to update context: {str(e)}"}), 500

@memories_bp.route('/user/<user_id>/context/<context_id>', methods=['DELETE'])
@cross_origin(supports_credentials=True)
@require_cognito_auth
@require_premium
def delete_context(user_id, context_id):
    """Delete personal context"""
    try:
        table = get_memories_table()
        response = table.get_item(Key={'user_id': user_id})
        
        if 'Item' not in response:
            return jsonify({"error": "User memories not found"}), 404

        memories = response['Item']
        
        # Find and remove from life_events
        original_count = len(memories['personal_context']['life_events'])
        memories['personal_context']['life_events'] = [
            event for event in memories['personal_context']['life_events'] 
            if event['id'] != context_id
        ]
        
        if len(memories['personal_context']['life_events']) < original_count:
            memories['last_updated'] = datetime.utcnow().isoformat()
            table.put_item(Item=memories)
            return jsonify({"success": True, "message": "Context deleted successfully"}), 200
        
        # Find and remove from goals
        original_count = len(memories['personal_context']['goals'])
        memories['personal_context']['goals'] = [
            goal for goal in memories['personal_context']['goals'] 
            if goal['id'] != context_id
        ]
        
        if len(memories['personal_context']['goals']) < original_count:
            memories['last_updated'] = datetime.utcnow().isoformat()
            table.put_item(Item=memories)
            return jsonify({"success": True, "message": "Context deleted successfully"}), 200
        
        return jsonify({"error": "Context not found"}), 404

    except Exception as e:
        return jsonify({"error": f"Failed to delete context: {str(e)}"}), 500
