from django.db import models


class SchoolClass(models.Model):
    name = models.CharField(max_length=100, unique=True, help_text="Name of the class (e.g., Grade 10 - Blue)")
    teacher = models.CharField(max_length=150, help_text="Assigned class teacher")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "School Class"
        verbose_name_plural = "School Classes"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.teacher})"


class Student(models.Model):
    GENDER_CHOICES = [
        ("Male", "Male"),
        ("Female", "Female"),
        ("Other", "Other"),
    ]

    student_id = models.CharField(
        max_length=50,
        unique=True,
        help_text="Unique student registration ID (e.g., STU-101)"
    )
    name = models.CharField(max_length=150, help_text="Student's full name")
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default="Other")
    school_class = models.ForeignKey(
        SchoolClass,
        on_delete=models.PROTECT,
        related_name="students",
        help_text="Enrolled class"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Student"
        verbose_name_plural = "Students"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.student_id}) - {self.school_class.name}"


class Attendance(models.Model):
    STATUS_CHOICES = [
        ("Present", "Present"),
        ("Absent", "Absent"),
        ("Late", "Late"),
        ("Excused", "Excused"),
    ]

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="attendance_records"
    )
    school_class = models.ForeignKey(
        SchoolClass,
        on_delete=models.CASCADE,
        related_name="attendance_records"
    )
    date = models.DateField(help_text="Attendance date (YYYY-MM-DD)")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="Present")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Attendance Record"
        verbose_name_plural = "Attendance Records"
        unique_together = ("student", "date")
        ordering = ["-date", "student__name"]

    def __str__(self):
        return f"{self.date} | {self.student.name} | {self.status}"


class SchoolSettings(models.Model):
    school_name = models.CharField(max_length=200, default="School Attendance System")
    academic_session = models.CharField(max_length=50, default="2026/2027")
    term = models.CharField(max_length=50, default="First Term")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "School Settings"
        verbose_name_plural = "School Settings"

    def __str__(self):
        return f"{self.school_name} ({self.academic_session} - {self.term})"

    @classmethod
    def get_settings(cls):
        settings, _ = cls.objects.get_or_create(id=1)
        return settings
