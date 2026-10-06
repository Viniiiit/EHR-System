#!/usr/bin/env python3
"""
Demo Data Script for EHR NLP System
This script creates sample clinical notes for testing the NLP pipeline
"""

import asyncio
import json
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

# Sample clinical notes
SAMPLE_NOTES = [
    {
        "title": "Chest Pain Evaluation",
        "patient_id": "P001",
        "note_text": """
CHIEF COMPLAINT: Chest pain for 2 days

HISTORY OF PRESENT ILLNESS: 
Patient is a 45-year-old male who presents with chest pain that started 2 days ago. 
The pain is described as sharp, located in the center of the chest, and worsens with deep inspiration. 
Patient denies shortness of breath, nausea, or diaphoresis. No radiation to arms or jaw.

PAST MEDICAL HISTORY:
- Type 2 diabetes mellitus, diagnosed 5 years ago
- Hypertension, diagnosed 3 years ago
- Hyperlipidemia

MEDICATIONS:
- Metformin 500mg twice daily
- Lisinopril 10mg daily
- Atorvastatin 20mg daily

ALLERGIES: NKDA

SOCIAL HISTORY: 
Non-smoker, occasional alcohol use, works as office manager

PHYSICAL EXAMINATION:
Vital signs: BP 140/90, HR 78, RR 16, Temp 98.6F, O2 sat 98% on room air
General: Well-appearing male in no acute distress
Cardiovascular: Regular rate and rhythm, no murmurs, rubs, or gallops
Lungs: Clear to auscultation bilaterally
Abdomen: Soft, non-tender, non-distended

ASSESSMENT AND PLAN:
1. Chest pain - likely musculoskeletal given sharp nature and positional changes
   - Continue current medications
   - Follow up in 1 week if symptoms persist
   - Consider EKG if symptoms worsen

2. Hypertension - well controlled on current regimen
   - Continue lisinopril 10mg daily

3. Diabetes - HbA1c last checked 3 months ago was 7.2%
   - Continue metformin 500mg twice daily
   - Recheck HbA1c in 3 months
        """,
        "note_type": "clinical_note"
    },
    {
        "title": "Diabetes Follow-up Visit",
        "patient_id": "P002",
        "note_text": """
CHIEF COMPLAINT: Routine diabetes follow-up

HISTORY OF PRESENT ILLNESS:
Patient returns for routine diabetes follow-up. Reports good adherence to metformin 1000mg twice daily. 
Blood glucose levels have been well controlled with readings mostly in the 120-140 range. 
No episodes of hypoglycemia reported. Patient denies polyuria, polydipsia, or polyphagia.

PAST MEDICAL HISTORY:
- Type 2 diabetes mellitus, diagnosed 8 years ago
- Diabetic neuropathy, mild
- Obesity (BMI 32)

MEDICATIONS:
- Metformin 1000mg twice daily
- Gabapentin 300mg three times daily for neuropathy

LABORATORY RESULTS:
- HbA1c: 6.8% (improved from 7.5% 3 months ago)
- Fasting glucose: 125 mg/dL
- Creatinine: 1.0 mg/dL
- eGFR: >60 mL/min/1.73m²

PHYSICAL EXAMINATION:
Vital signs: BP 128/82, HR 72, RR 14, Temp 98.4F
General: Obese male in no acute distress
Cardiovascular: Regular rate and rhythm, no murmurs
Lungs: Clear to auscultation
Extremities: No edema, pulses intact
Neurological: Mild decreased sensation in feet bilaterally

ASSESSMENT AND PLAN:
1. Type 2 diabetes mellitus - well controlled
   - Continue metformin 1000mg twice daily
   - Excellent HbA1c improvement
   - Continue current diet and exercise regimen
   - Recheck HbA1c in 3 months

2. Diabetic neuropathy - stable
   - Continue gabapentin 300mg three times daily
   - Patient reports good symptom control

3. Obesity - BMI 32
   - Continue current weight management plan
   - Encourage continued exercise
        """,
        "note_type": "clinical_note"
    },
    {
        "title": "Hypertension Management",
        "patient_id": "P003",
        "note_text": """
CHIEF COMPLAINT: Blood pressure management

HISTORY OF PRESENT ILLNESS:
Patient presents for blood pressure management. Reports taking amlodipine 5mg daily as prescribed. 
Home blood pressure readings average 135/85. Patient denies chest pain, shortness of breath, or headaches. 
No dizziness or syncope episodes.

PAST MEDICAL HISTORY:
- Essential hypertension, diagnosed 2 years ago
- Family history of hypertension (mother)

MEDICATIONS:
- Amlodipine 5mg daily

SOCIAL HISTORY:
- Non-smoker
- No alcohol use
- Sedentary lifestyle
- Diet high in sodium

PHYSICAL EXAMINATION:
Vital signs: BP 138/88, HR 76, RR 16, Temp 98.2F
General: Well-appearing female in no acute distress
Cardiovascular: Regular rate and rhythm, no murmurs
Lungs: Clear to auscultation
Abdomen: Soft, non-tender

ASSESSMENT AND PLAN:
1. Essential hypertension - suboptimally controlled
   - Increase amlodipine to 10mg daily
   - Emphasize low sodium diet
   - Encourage regular exercise
   - Home blood pressure monitoring
   - Follow up in 4 weeks

Patient counseled on lifestyle modifications including DASH diet and regular aerobic exercise.
        """,
        "note_type": "clinical_note"
    },
    {
        "title": "Respiratory Infection",
        "patient_id": "P004",
        "note_text": """
CHIEF COMPLAINT: Cough and congestion for 5 days

HISTORY OF PRESENT ILLNESS:
Patient presents with cough and nasal congestion for 5 days. Cough is productive with yellow sputum. 
Reports mild fever (100.2F) and fatigue. Denies chest pain, shortness of breath, or wheezing. 
No recent travel or sick contacts.

PAST MEDICAL HISTORY:
- Seasonal allergies
- No chronic respiratory conditions

MEDICATIONS:
- Loratadine 10mg daily (seasonal allergies)

ALLERGIES: Penicillin

PHYSICAL EXAMINATION:
Vital signs: BP 120/78, HR 88, RR 18, Temp 100.2F
General: Mildly ill-appearing female
HEENT: Nasal congestion, mild pharyngeal erythema
Lungs: Clear to auscultation, no wheezes or rales
Cardiovascular: Regular rate and rhythm

ASSESSMENT AND PLAN:
1. Upper respiratory tract infection - likely viral
   - Symptomatic treatment with rest and fluids
   - Over-the-counter cough suppressant
   - Follow up if symptoms worsen or persist >10 days
   - Return if fever >101F or difficulty breathing

2. Seasonal allergies - stable
   - Continue loratadine 10mg daily
        """,
        "note_type": "clinical_note"
    },
    {
        "title": "Annual Physical Examination",
        "patient_id": "P005",
        "note_text": """
CHIEF COMPLAINT: Annual physical examination

HISTORY OF PRESENT ILLNESS:
Patient presents for annual physical examination. Reports feeling well overall. 
No acute concerns or symptoms. Maintains regular exercise routine and healthy diet.

PAST MEDICAL HISTORY:
- No significant medical history
- No hospitalizations
- No surgeries

MEDICATIONS: None

ALLERGIES: NKDA

SOCIAL HISTORY:
- Non-smoker
- Occasional alcohol use (1-2 drinks per week)
- Regular exercise (3-4 times per week)
- Healthy diet

FAMILY HISTORY:
- Father: hypertension (age 65)
- Mother: diabetes (age 60)
- No other significant family history

PHYSICAL EXAMINATION:
Vital signs: BP 118/76, HR 68, RR 14, Temp 98.6F, BMI 24.5
General: Well-appearing male in no acute distress
HEENT: Normal
Cardiovascular: Regular rate and rhythm, no murmurs
Lungs: Clear to auscultation
Abdomen: Soft, non-tender, non-distended
Extremities: No edema, pulses intact
Neurological: Normal

SCREENING TESTS ORDERED:
- Complete blood count
- Comprehensive metabolic panel
- Lipid panel
- HbA1c
- TSH

ASSESSMENT AND PLAN:
1. Annual physical examination - normal findings
   - Continue current healthy lifestyle
   - Maintain regular exercise routine
   - Continue healthy diet
   - Return for annual physical in 1 year
   - Follow up on lab results when available

Patient counseled on maintaining healthy lifestyle and importance of regular preventive care.
        """,
        "note_type": "clinical_note"
    }
]

async def create_demo_data():
    """Create demo data in MongoDB"""
    try:
        # Connect to MongoDB
        mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017/ehr_nlp_system")
        client = AsyncIOMotorClient(mongodb_url)
        
        # Get database
        database_name = mongodb_url.split('/')[-1] if '/' in mongodb_url else "ehr_nlp_system"
        db = client[database_name]
        
        print(f"📊 Creating demo data in database: {database_name}")
        
        # Create demo user
        demo_user = {
            "username": "demo_doctor",
            "email": "doctor@example.com",
            "full_name": "Dr. Jane Smith",
            "role": "doctor",
            "hashed_password": "$2b$12$Eni.RgO00gj1Vo6NgYkbc.R9Bc34Z0NdUu2dgC5akU0CgUMFOs0Ve",  # password123
            "is_active": True,
            "created_at": datetime.utcnow(),
            "last_login": None
        }
        
        # Insert demo user
        users_collection = db.users
        existing_user = await users_collection.find_one({"email": demo_user["email"]})
        if not existing_user:
            await users_collection.insert_one(demo_user)
            print("✅ Demo user created: doctor@example.com / password123")
        else:
            print("ℹ️  Demo user already exists")
        
        # Get user ID
        user = await users_collection.find_one({"email": demo_user["email"]})
        user_id = user["_id"]
        
        # Create demo notes
        notes_collection = db.notes
        created_notes = []
        
        for note_data in SAMPLE_NOTES:
            note_doc = {
                "title": note_data["title"],
                "patient_id": note_data["patient_id"],
                "note_text": note_data["note_text"].strip(),
                "note_type": note_data["note_type"],
                "user_id": user_id,
                "entities": [],
                "sections": [],
                "summary": "",
                "processing_metadata": {
                    "clinical_bert_entities_count": 0,
                    "medspacy_entities_count": 0,
                    "total_entities": 0,
                    "sections_detected": 0,
                    "processing_time_seconds": None
                },
                "is_processed": False,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "processed_at": None
            }
            
            result = await notes_collection.insert_one(note_doc)
            created_notes.append(str(result.inserted_id))
            print(f"✅ Created note: {note_data['title']}")
        
        print(f"\n🎉 Demo data created successfully!")
        print(f"📝 Created {len(created_notes)} sample notes")
        print(f"👤 Demo user: doctor@example.com / password123")
        print(f"\n🔗 You can now:")
        print(f"   • Login with the demo credentials")
        print(f"   • Process the sample notes using the NLP pipeline")
        print(f"   • Explore the extracted entities and summaries")
        
        # Close connection
        client.close()
        
    except Exception as e:
        print(f"❌ Error creating demo data: {e}")
        raise e

if __name__ == "__main__":
    print("🏥 EHR NLP System - Demo Data Creator")
    print("=====================================")
    asyncio.run(create_demo_data())
