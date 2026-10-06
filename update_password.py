#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from utils.hash_password import hash_password

async def update_password():
    client = AsyncIOMotorClient('mongodb://localhost:27017/ehr_nlp_system')
    db = client['ehr_nlp_system']
    
    # Update the user password
    new_hash = hash_password('password123')
    result = await db.users.update_one(
        {'email': 'doctor@example.com'},
        {'$set': {'hashed_password': new_hash}}
    )
    print(f'Updated {result.modified_count} user(s)')
    
    # Check the user
    user = await db.users.find_one({'email': 'doctor@example.com'})
    print(f'User found: {user is not None}')
    if user:
        print(f'Username: {user["username"]}')
        print(f'Email: {user["email"]}')
    
    client.close()

if __name__ == "__main__":
    asyncio.run(update_password())
