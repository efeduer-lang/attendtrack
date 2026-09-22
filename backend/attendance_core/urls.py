from django.urls import path
from .views import (
    ApiRootView,
    ClassListCreateView,
    ClassDetailView,
    StudentListCreateView,
    StudentDetailView,
    AttendanceView,
    AttendanceDetailView,
    DashboardView,
    ReportsView,
    SettingsView,
    DemoActionView,
)

urlpatterns = [
    # API Directory / Root
    path('', ApiRootView.as_view(), name='api-root'),

    # Classes
    path('classes/', ClassListCreateView.as_view(), name='class-list-create'),
    path('classes/<int:pk>/', ClassDetailView.as_view(), name='class-detail'),

    # Students
    path('students/', StudentListCreateView.as_view(), name='student-list-create'),
    path('students/<int:pk>/', StudentDetailView.as_view(), name='student-detail'),

    # Attendance
    path('attendance/', AttendanceView.as_view(), name='attendance'),
    path('attendance/<int:pk>/', AttendanceDetailView.as_view(), name='attendance-detail'),

    # Dashboard & Reports
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('reports/', ReportsView.as_view(), name='reports'),

    # Settings & Demo actions
    path('settings/', SettingsView.as_view(), name='settings'),
    path('demo/', DemoActionView.as_view(), name='demo'),
]
