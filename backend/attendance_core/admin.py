from django.contrib import admin
from .models import SchoolClass, Student, Attendance, SchoolSettings


@admin.register(SchoolClass)
class SchoolClassAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "teacher", "student_count", "created_at")
    search_fields = ("name", "teacher")
    ordering = ("name",)

    def student_count(self, obj):
        return obj.students.count()
    student_count.short_description = "Enrolled Students"


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ("id", "student_id", "name", "school_class", "gender", "created_at")
    search_fields = ("student_id", "name")
    list_filter = ("school_class", "gender", "created_at")
    ordering = ("name",)


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ("id", "date", "student", "school_class", "status", "created_at")
    search_fields = ("student__name", "student__student_id", "school_class__name")
    list_filter = ("status", "school_class", "date")
    date_hierarchy = "date"
    ordering = ("-date", "student__name")


@admin.register(SchoolSettings)
class SchoolSettingsAdmin(admin.ModelAdmin):
    list_display = ("school_name", "academic_session", "term", "updated_at")

    def has_add_permission(self, request):
        # Prevent adding more than one settings row
        return not SchoolSettings.objects.exists()
