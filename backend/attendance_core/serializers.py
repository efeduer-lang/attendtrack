from rest_framework import serializers
from .models import SchoolClass, Student, Attendance, SchoolSettings


class SchoolClassSerializer(serializers.ModelSerializer):
    studentCount = serializers.SerializerMethodField()
    createdAt = serializers.SerializerMethodField()
    id = serializers.SerializerMethodField()

    class Meta:
        model = SchoolClass
        fields = ["id", "name", "teacher", "studentCount", "createdAt"]

    def get_id(self, obj):
        return str(obj.id)

    def get_studentCount(self, obj):
        return obj.students.count()

    def get_createdAt(self, obj):
        return obj.created_at.isoformat() if obj.created_at else None


class StudentSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    studentId = serializers.CharField(source="student_id")
    classId = serializers.SerializerMethodField()
    className = serializers.SerializerMethodField()
    createdAt = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = ["id", "studentId", "name", "classId", "className", "gender", "createdAt"]

    def get_id(self, obj):
        return str(obj.id)

    def get_classId(self, obj):
        return str(obj.school_class_id)

    def get_className(self, obj):
        return obj.school_class.name if obj.school_class else "Unassigned"

    def get_createdAt(self, obj):
        return obj.created_at.isoformat() if obj.created_at else None


class AttendanceRecordSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    studentId = serializers.SerializerMethodField()
    studentCode = serializers.SerializerMethodField()
    studentName = serializers.SerializerMethodField()
    classId = serializers.SerializerMethodField()
    className = serializers.SerializerMethodField()
    date = serializers.SerializerMethodField()
    createdAt = serializers.SerializerMethodField()

    class Meta:
        model = Attendance
        fields = [
            "id",
            "studentId",
            "studentCode",
            "studentName",
            "classId",
            "className",
            "date",
            "status",
            "createdAt",
        ]

    def get_id(self, obj):
        return str(obj.id)

    def get_studentId(self, obj):
        return str(obj.student_id)

    def get_studentCode(self, obj):
        return obj.student.student_id if obj.student else ""

    def get_studentName(self, obj):
        return obj.student.name if obj.student else ""

    def get_classId(self, obj):
        return str(obj.school_class_id)

    def get_className(self, obj):
        return obj.school_class.name if obj.school_class else ""

    def get_date(self, obj):
        return obj.date.strftime("%Y-%m-%d") if obj.date else ""

    def get_createdAt(self, obj):
        return obj.created_at.isoformat() if obj.created_at else None


class SchoolSettingsSerializer(serializers.ModelSerializer):
    schoolName = serializers.CharField(source="school_name")
    academicSession = serializers.CharField(source="academic_session")
    term = serializers.CharField()
    updatedAt = serializers.SerializerMethodField()

    class Meta:
        model = SchoolSettings
        fields = ["schoolName", "academicSession", "term", "updatedAt"]

    def get_updatedAt(self, obj):
        return obj.updated_at.isoformat() if obj.updated_at else None
