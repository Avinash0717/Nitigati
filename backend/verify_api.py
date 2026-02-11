import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/providers/"

def test_create_provider():
    payload = {
        "onboarding_type": "manual",
        "name": "John Doe",
        "age": 30,
        "gender": "male",
        "location": "New York",
        "phone_number": "+1-234-567-890",
        "email": "janedoe@example.com",
        "password": "securepassword123"
    }
    response = requests.post(BASE_URL, json=payload)
    print(f"POST {BASE_URL}")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.json().get('uuid')

def test_get_provider(provider_uuid):
    url = f"{BASE_URL}{provider_uuid}/"
    response = requests.get(url)
    print(f"\nGET {url}")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

if __name__ == "__main__":
    try:
        new_uuid = test_create_provider()
        if new_uuid:
            test_get_provider(new_uuid)
    except Exception as e:
        print(f"Error during verification: {e}")
        print("Make sure the Django server is running at http://127.0.0.1:8000")
