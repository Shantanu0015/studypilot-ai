def generate_timetable(subjects, total_hours):
    if not subjects or total_hours <= 0:
        return []

    difficulty_weights = {'easy': 1, 'medium': 2, 'hard': 3}
    total_weight = sum([difficulty_weights.get(s['difficulty'].lower(), 1) for s in subjects])

    total_minutes = total_hours * 60
    study_minutes = total_minutes * 0.9 # Set aside ~10% for short breaks 

    timetable = []

    for s in subjects:
        weight = difficulty_weights.get(s['difficulty'].lower(), 1)
        allocated_mins = (weight / total_weight) * study_minutes
        
        timetable.append({
            "subject": s['name'],
            "allocated_minutes": round(allocated_mins),
            "difficulty": s['difficulty']
        })

    return timetable
