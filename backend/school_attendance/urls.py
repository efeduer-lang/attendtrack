"""
URL configuration for school_attendance project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


def api_root_view(request):
    return JsonResponse({
        "system": "School Attendance System API",
        "status": "online",
        "endpoints": {
            "admin": "/admin/",
            "classes": "/api/classes/",
            "students": "/api/students/",
            "attendance": "/api/attendance/",
            "dashboard": "/api/dashboard/",
            "reports": "/api/reports/",
            "settings": "/api/settings/",
            "demo": "/api/demo/",
        },
    })


urlpatterns = [
    path('', api_root_view, name='root'),
    path('admin/', admin.site.urls),
    path('api/', include('attendance_core.urls')),
]

