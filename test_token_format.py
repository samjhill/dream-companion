#!/usr/bin/env python3
"""
Test script to verify JWT token format and validation
"""

import requests
import json

def test_token_format():
    """Test different token formats to see what the backend expects"""
    
    # Test with different token formats
    test_cases = [
        {
            'name': 'Empty token',
            'token': '',
            'expected_status': 401
        },
        {
            'name': 'Invalid format',
            'token': 'invalid-token',
            'expected_status': 401
        },
        {
            'name': 'Bearer prefix only',
            'token': 'Bearer',
            'expected_status': 401
        },
        {
            'name': 'JWT-like format (invalid)',
            'token': 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.EkN-DOsnsuRjRO6BxXemmJDm3HbxrbRzXglbN2S4sOkopdU4IsDxTI8jO19W_A4K8ZPJijNLis4EZsHeY559a4DFOd50_OqgH58ERTq8y0Vf3_2HXiF97Eg4rKMyG5jGr1N7i5Ins3Ao-pzvsJ1_ZN7qw5_VcW2Jfsg3lk1jT0am511L7H3HxVz0t6f1Sdo5erpmsLd9gPjxJ0lpf_UT7p4UtMls3o2eFOvXhzB5BnW6tucY-UcNC7hEN2cJk7s7wJlkZDM1o2W8VQz0TtdKxup00up4_8Lb9Zg1TUsCGc-7r4Y0NK1cAEDT8_1Vgno-mY7n3dG7JoW95iDZeu0M7sbfDlXhJ0w',
            'expected_status': 401
        }
    ]
    
    base_url = 'https://jj1rq9vx9l.execute-api.us-east-1.amazonaws.com/Prod'
    phone_number = '16464578206'
    
    print("🧪 Testing JWT Token Format Validation")
    print("=" * 50)
    
    for test_case in test_cases:
        print(f"\n🔍 Testing: {test_case['name']}")
        
        headers = {
            'Authorization': f"Bearer {test_case['token']}",
            'Origin': 'https://clarasdreamguide.com'
        }
        
        try:
            response = requests.get(
                f"{base_url}/api/themes/{phone_number}",
                headers=headers,
                timeout=10
            )
            
            print(f"   Status: {response.status_code}")
            print(f"   Response: {response.text[:100]}...")
            
            if response.status_code == test_case['expected_status']:
                print("   ✅ Expected result")
            else:
                print(f"   ❌ Unexpected result (expected {test_case['expected_status']})")
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    print("\n" + "=" * 50)
    print("✅ Token format testing completed")

if __name__ == "__main__":
    test_token_format()
