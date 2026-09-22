from datetime import date, timedelta
from django.contrib.auth import get_user_model
from .models import SchoolClass, Student, Attendance, SchoolSettings


def run_seed_data():
    User = get_user_model()

    # 1. Ensure Superuser exists
    if not User.objects.filter(username="admin").exists():
        User.objects.create_superuser("admin", "admin@school.local", "admin1234")
        print("Created superuser: admin / admin1234")

    # 2. Settings
    settings = SchoolSettings.get_settings()
    settings.school_name = "AttendTrack Academy"
    settings.academic_session = "2026/2027"
    settings.term = "First Term"
    settings.save()

    # 3. Classes
    classes_data = [
        {"name": "Grade 10 - Blue", "teacher": "Mr. David Adebayo"},
        {"name": "Grade 10 - Gold", "teacher": "Mrs. Sarah Jenkins"},
        {"name": "Grade 11 - Science", "teacher": "Dr. Michael Chen"},
        {"name": "Grade 12 - Honors", "teacher": "Ms. Elena Rostova"},
    ]

    class_objs = {}
    for c_info in classes_data:
        obj, _ = SchoolClass.objects.get_or_create(
            name=c_info["name"],
            defaults={"teacher": c_info["teacher"]}
        )
        class_objs[c_info["name"]] = obj

    # 4. Students
    students_data = [
        {"student_id": "STU-101", "name": "Alexander Wright", "gender": "Male", "class": "Grade 10 - Blue"},
        {"student_id": "STU-102", "name": "Amara Okafor", "gender": "Female", "class": "Grade 10 - Blue"},
        {"student_id": "STU-103", "name": "Benjamin Hayes", "gender": "Male", "class": "Grade 10 - Blue"},
        {"student_id": "STU-104", "name": "Chloe Tanaka", "gender": "Female", "class": "Grade 10 - Gold"},
        {"student_id": "STU-105", "name": "Daniel Martinez", "gender": "Male", "class": "Grade 10 - Gold"},
        {"student_id": "STU-106", "name": "Fatima Al-Mansoor", "gender": "Female", "class": "Grade 11 - Science"},
        {"student_id": "STU-107", "name": "Gabriel Morales", "gender": "Male", "class": "Grade 11 - Science"},
        {"student_id": "STU-108", "name": "Hannah Zimmer", "gender": "Female", "class": "Grade 12 - Honors"},
    ]

    student_objs = []
    for s_info in students_data:
        school_cls = class_objs.get(s_info["class"])
        student, _ = Student.objects.update_or_create(
            student_id=s_info["student_id"],
            defaults={
                "name": s_info["name"],
                "gender": s_info["gender"],
                "school_class": school_cls,
            }
        )
        student_objs.append(student)

    # 5. Attendance (Today + past 4 weekdays)
    today = date.today()
    dates = []
    for i in range(5):
        d = today - timedelta(days=i)
        # Skip Sunday (6) and Saturday (5) if desired, or keep simple
        if d.weekday() < 5 or i == 0:
            dates.append(d)

    for d in dates:
        for idx, student in enumerate(student_objs):
            # Deterministic variation for realistic stats
            if (idx + d.day) % 7 == 0:
                status_val = "Absent"
            elif (idx + d.day) % 11 == 0:
                status_val = "Late"
            elif (idx + d.day) % 13 == 0:
                status_val = "Excused"
            else:
                status_val = "Present"

            Attendance.objects.update_or_create(
                student=student,
                date=d,
                defaults={
                    "school_class": student.school_class,
                    "status": status_val,
                }
            )

    print(f"Seeding completed successfully! {len(class_objs)} classes, {len(student_objs)} students.")
