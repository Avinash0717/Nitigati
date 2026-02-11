import csv
import os
import uuid
from django.utils import timezone
from django.conf import settings
from django.contrib.auth.hashers import make_password

# Path to the CSV file
CSV_FILE_PATH = os.path.join(settings.BASE_DIR, 'api', 'data', 'provider', 'onBoardingData.csv')
CUSTOMER_CSV_FILE_PATH = os.path.join(settings.BASE_DIR, 'api', 'data', 'customer', 'onBoardingData.csv')

def initialize_csv():
    """Initializes the CSV file with headers if it doesn't exist."""
    os.makedirs(os.path.dirname(CSV_FILE_PATH), exist_ok=True)
    if not os.path.exists(CSV_FILE_PATH):
        with open(CSV_FILE_PATH, mode='w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow([
                'uuid', 'onboarding_type', 'name', 'age', 'gender', 
                'location', 'phone_number', 'email', 'password', 'created_at',
                'profile_picture', 'legal_id_front', 'legal_id_back', 'images_uploaded'
            ])

def save_provider_to_csv(data):
    """Appends a new provider row safely."""
    initialize_csv()
    with open(CSV_FILE_PATH, mode='a', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([
            data.get('uuid'),
            data.get('onboarding_type'),
            data.get('name'),
            data.get('age'),
            data.get('gender'),
            data.get('location'),
            data.get('phone_number'),
            data.get('email'),
            data.get('password'),
            data.get('created_at'),
            data.get('profile_picture', ''),
            data.get('legal_id_front', ''),
            data.get('legal_id_back', ''),
            data.get('images_uploaded', False)
        ])

def get_provider_from_csv(provider_uuid):
    """Searches provider by UUID."""
    initialize_csv()
    with open(CSV_FILE_PATH, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row['uuid'] == str(provider_uuid):
                return row
    return None

def provider_exists(email):
    """Prevents duplicate email registration."""
    initialize_csv()
    with open(CSV_FILE_PATH, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row['email'] == email:
                return True
    return False

def update_provider_images_in_csv(provider_uuid, profile_pic_val, id_front_val, id_back_val):
    """Updates an existing provider row with image placeholders."""
    initialize_csv()
    rows = []
    updated = False
    
    with open(CSV_FILE_PATH, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        for row in reader:
            if row['uuid'] == str(provider_uuid):
                row['profile_picture'] = profile_pic_val
                row['legal_id_front'] = id_front_val
                row['legal_id_back'] = id_back_val
                row['images_uploaded'] = 'True'
                updated = True
            rows.append(row)
            
    if updated:
        with open(CSV_FILE_PATH, mode='w', newline='', encoding='utf-8') as f:
            if fieldnames:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(rows)
    return updated

def initialize_customer_csv():
    """Initializes the Customer CSV file with headers if it doesn't exist."""
    print(f"Initializing CSV at: {CUSTOMER_CSV_FILE_PATH}")
    os.makedirs(os.path.dirname(CUSTOMER_CSV_FILE_PATH), exist_ok=True)
    if not os.path.exists(CUSTOMER_CSV_FILE_PATH):
        print("CSV does not exist, creating with headers...")
        with open(CUSTOMER_CSV_FILE_PATH, mode='w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow([
                'uuid', 'username', 'email', 'password', 'phone_number', 'created_at', 'profile_picture'
            ])
        print("CSV created successfully.")
    else:
        print("CSV already exists.")

def save_customer_to_csv(data):
    """Appends a new customer row safely."""
    initialize_customer_csv()
    with open(CUSTOMER_CSV_FILE_PATH, mode='a', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([
            data.get('uuid'),
            data.get('username'),
            data.get('email'),
            data.get('password'),  # Already hashed
            data.get('phone_number'),
            data.get('created_at'),
            data.get('profile_picture', 'profilePic')
        ])

def customer_exists(email):
    """Prevents duplicate email registration for customers."""
    initialize_customer_csv()
    if not os.path.exists(CUSTOMER_CSV_FILE_PATH):
        return False
    with open(CUSTOMER_CSV_FILE_PATH, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row['email'] == email:
                return True
    return False
