from django.core.management.base import BaseCommand
from attendance_core.seed_helper import run_seed_data


class Command(BaseCommand):
    help = "Seeds database with initial classes, students, and attendance records."

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Seeding database..."))
        run_seed_data()
        self.stdout.write(self.style.SUCCESS("Database seeded successfully!"))
