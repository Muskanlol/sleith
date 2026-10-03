from datetime import timedelta

from django.utils import timezone
from rest_framework.test import APITestCase

from accounts.models import CustomUser
from academy.models import (
    AcademyApplication,
    AcademyFee,
    Assessment,
    Attendance,
    Batch,
    BatchStudent,
    Course,
    PracticalEvaluationCriteria,
)


PASSWORD = "TestPass!2026"


class AcademyFlowTests(APITestCase):

    def setUp(self):
        today = timezone.now().date()
        self.admin = CustomUser.objects.create_user(
            email="admin@test.local",
            password=PASSWORD,
            full_name="Admin",
            role="ADMIN",
            is_email_verified=True,
        )
        self.trainer = CustomUser.objects.create_user(
            email="trainer@test.local",
            password=PASSWORD,
            full_name="Trainer",
            role="TRAINER",
            is_email_verified=True,
        )
        self.customer = CustomUser.objects.create_user(
            email="student@test.local",
            password=PASSWORD,
            full_name="Student",
            role="CUSTOMER",
            is_email_verified=True,
        )
        self.stranger = CustomUser.objects.create_user(
            email="other@test.local",
            password=PASSWORD,
            full_name="Other",
            role="CUSTOMER",
            is_email_verified=True,
        )
        self.course = Course.objects.create(
            name="Test Course",
            description="Flow test",
            duration_months=3,
            fee=15000,
            is_active=True,
        )
        self.batch = Batch.objects.create(
            course=self.course,
            name="Test Batch",
            start_date=today - timedelta(days=7),
            end_date=today + timedelta(days=60),
            capacity=10,
            trainer=self.trainer,
            status=Batch.Status.ACTIVE,
            is_active=True,
        )
        self.criteria = PracticalEvaluationCriteria.objects.create(
            name="Technique",
            max_marks=100,
        )

    def _login(self, email):
        res = self.client.post(
            "/api/auth/login/",
            {"email": email, "password": PASSWORD},
            format="json",
        )
        self.assertEqual(res.status_code, 200, res.data)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")
        return res.data

    def test_full_academy_flow_and_customer_reads(self):
        today = timezone.now().date()

        self._login(self.customer.email)
        apply = self.client.post(
            "/api/academy/apply/",
            {"course": self.course.id, "notes": "Weekday mornings. I want to learn."},
            format="json",
        )
        self.assertEqual(apply.status_code, 201, apply.data)
        app_id = apply.data["id"]
        self.assertEqual(apply.data["status"], "PENDING")

        dup = self.client.post(
            "/api/academy/apply/",
            {"course": self.course.id, "notes": "again"},
            format="json",
        )
        self.assertEqual(dup.status_code, 403)

        self._login(self.admin.email)
        approve = self.client.post(
            f"/api/admin/academy/applications/{app_id}/approve/",
            {"batch_id": self.batch.id},
            format="json",
        )
        self.assertEqual(approve.status_code, 200, approve.data)
        self.assertTrue(
            BatchStudent.objects.filter(
                student=self.customer, batch=self.batch
            ).exists()
        )
        fees = AcademyFee.objects.filter(student=self.customer, batch=self.batch)
        self.assertEqual(fees.count(), 1)
        fee = fees.get()
        self.assertEqual(fee.status, AcademyFee.Status.PENDING)

        paid = self.client.post(f"/api/admin/academy/fees/{fee.id}/mark-paid/")
        self.assertEqual(paid.status_code, 200, paid.data)
        fee.refresh_from_db()
        self.assertEqual(fee.status, AcademyFee.Status.PAID)

        self._login(self.trainer.email)
        session = self.client.post(
            f"/api/admin/academy/batches/{self.batch.id}/sessions/",
            {
                "title": "Intro session",
                "date": str(today),
                "start_time": "10:00:00",
                "end_time": "12:00:00",
            },
            format="json",
        )
        self.assertEqual(session.status_code, 201, session.data)
        session_id = session.data["id"]

        attendance = self.client.post(
            f"/api/admin/academy/sessions/{session_id}/attendance/",
            {
                "records": [
                    {"student": str(self.customer.id), "status": "PRESENT"}
                ]
            },
            format="json",
        )
        self.assertEqual(attendance.status_code, 200, attendance.data)
        self.assertTrue(
            Attendance.objects.filter(
                session_id=session_id,
                student=self.customer,
                status="PRESENT",
            ).exists()
        )

        assessment = self.client.post(
            "/api/admin/academy/assessments/",
            {
                "batch": self.batch.id,
                "title": "Theory 1",
                "assessment_type": Assessment.Type.THEORY,
                "max_marks": 100,
                "passing_marks": 40,
                "date": str(today),
            },
            format="json",
        )
        self.assertEqual(assessment.status_code, 201, assessment.data)
        assessment_id = assessment.data["id"]

        result = self.client.post(
            f"/api/admin/academy/assessments/{assessment_id}/results/",
            {
                "assessment": assessment_id,
                "student": str(self.customer.id),
                "marks_obtained": 82,
            },
            format="json",
        )
        self.assertEqual(result.status_code, 201, result.data)
        self.assertTrue(result.data["is_passed"])

        practical = self.client.post(
            "/api/admin/academy/practical/",
            {
                "student": str(self.customer.id),
                "batch": self.batch.id,
                "title": "Gel application",
                "date": str(today),
                "notes": "Studio practical",
            },
            format="json",
        )
        self.assertEqual(practical.status_code, 201, practical.data)
        practical_id = practical.data["id"]

        evaluation = self.client.post(
            f"/api/admin/academy/practical/{practical_id}/evaluate/",
            {
                "feedback": "Strong technique",
                "scores": [
                    {"criteria_id": self.criteria.id, "marks": 90},
                ],
            },
            format="json",
        )
        self.assertEqual(evaluation.status_code, 201, evaluation.data)

        self._login(self.admin.email)
        cert = self.client.post(
            "/api/admin/academy/certificates/create/",
            {
                "student": str(self.customer.id),
                "course": self.course.id,
                "batch": self.batch.id,
            },
            format="json",
        )
        self.assertEqual(cert.status_code, 201, cert.data)
        cert_id = cert.data["id"]
        self.assertEqual(cert.data["status"], "DRAFT")

        issued = self.client.post(
            f"/api/admin/academy/certificates/{cert_id}/issue/"
        )
        self.assertEqual(issued.status_code, 200, issued.data)
        self.assertEqual(issued.data["status"], "ISSUED")

        self._login(self.customer.email)
        enrollments = self.client.get("/api/academy/my-enrollments/")
        self.assertEqual(enrollments.status_code, 200)
        self.assertEqual(len(enrollments.data), 1)
        self.assertEqual(enrollments.data[0]["course_id"], self.course.id)

        my_fees = self.client.get("/api/academy/my-fees/")
        self.assertEqual(my_fees.status_code, 200)
        self.assertEqual(my_fees.data[0]["status"], "PAID")

        my_att = self.client.get("/api/academy/my-attendance/")
        self.assertEqual(my_att.status_code, 200)
        self.assertEqual(my_att.data[0]["status"], "PRESENT")

        my_results = self.client.get("/api/academy/my-results/")
        self.assertEqual(my_results.status_code, 200)
        self.assertEqual(my_results.data[0]["marks_obtained"], 82)
        self.assertTrue(my_results.data[0]["is_passed"])

        my_certs = self.client.get("/api/academy/my-certificates/")
        self.assertEqual(my_certs.status_code, 200)
        self.assertEqual(len(my_certs.data), 1)
        self.assertEqual(my_certs.data[0]["status"], "ISSUED")
        self.assertNotEqual(my_certs.data[0]["status"], "DRAFT")

        my_practicals = self.client.get("/api/academy/my-practicals/")
        self.assertEqual(my_practicals.status_code, 200)
        self.assertEqual(len(my_practicals.data), 1)
        self.assertTrue(my_practicals.data[0]["evaluation"]["is_passed"])

        self._login(self.stranger.email)
        other_apps = self.client.get("/api/academy/my-applications/")
        self.assertEqual(other_apps.status_code, 200)
        self.assertEqual(other_apps.data, [])
        other_certs = self.client.get("/api/academy/my-certificates/")
        self.assertEqual(other_certs.status_code, 200)
        self.assertEqual(other_certs.data, [])

    def test_trainer_cannot_mark_fee_paid_or_issue_certificate(self):
        BatchStudent.objects.create(student=self.customer, batch=self.batch)
        fee = AcademyFee.objects.create(
            student=self.customer,
            batch=self.batch,
            amount=self.course.fee,
            due_date=timezone.now().date(),
            status=AcademyFee.Status.PENDING,
        )
        self._login(self.trainer.email)
        paid = self.client.post(f"/api/admin/academy/fees/{fee.id}/mark-paid/")
        self.assertEqual(paid.status_code, 403)

        cert = self.client.post(
            "/api/admin/academy/certificates/create/",
            {
                "student": str(self.customer.id),
                "course": self.course.id,
                "batch": self.batch.id,
            },
            format="json",
        )
        self.assertEqual(cert.status_code, 403)

    def test_customer_cannot_approve_own_application(self):
        self._login(self.customer.email)
        apply = self.client.post(
            "/api/academy/apply/",
            {"course": self.course.id, "notes": "please approve me now"},
            format="json",
        )
        app_id = apply.data["id"]
        approve = self.client.post(
            f"/api/admin/academy/applications/{app_id}/approve/",
            {"batch_id": self.batch.id},
            format="json",
        )
        self.assertEqual(approve.status_code, 403)

    def test_awaiting_response_blocks_duplicate_apply(self):
        app = AcademyApplication.objects.create(
            student=self.customer,
            course=self.course,
            status=AcademyApplication.Status.AWAITING_RESPONSE,
            notes="waiting",
        )
        self._login(self.customer.email)
        dup = self.client.post(
            "/api/academy/apply/",
            {"course": self.course.id, "notes": "second try"},
            format="json",
        )
        self.assertEqual(dup.status_code, 403)
        self.assertEqual(
            AcademyApplication.objects.filter(
                student=self.customer, course=self.course
            ).count(),
            1,
        )
        self.assertEqual(app.status, AcademyApplication.Status.AWAITING_RESPONSE)

    def test_cannot_enter_marks_before_assessment_or_practical_date(self):
        BatchStudent.objects.create(student=self.customer, batch=self.batch)
        future = timezone.now().date() + timedelta(days=10)

        self._login(self.trainer.email)
        assessment = self.client.post(
            "/api/admin/academy/assessments/",
            {
                "batch": self.batch.id,
                "title": "Future theory",
                "assessment_type": Assessment.Type.THEORY,
                "max_marks": 100,
                "passing_marks": 40,
                "date": str(future),
            },
            format="json",
        )
        self.assertEqual(assessment.status_code, 201, assessment.data)

        result = self.client.post(
            f"/api/admin/academy/assessments/{assessment.data['id']}/results/",
            {
                "assessment": assessment.data["id"],
                "student": str(self.customer.id),
                "marks_obtained": 82,
            },
            format="json",
        )
        self.assertEqual(result.status_code, 400, result.data)

        practical = self.client.post(
            "/api/admin/academy/practical/",
            {
                "student": str(self.customer.id),
                "batch": self.batch.id,
                "title": "Future gel",
                "date": str(future),
                "notes": "Scheduled practical",
            },
            format="json",
        )
        self.assertEqual(practical.status_code, 201, practical.data)

        evaluation = self.client.post(
            f"/api/admin/academy/practical/{practical.data['id']}/evaluate/",
            {
                "feedback": "Too early",
                "scores": [
                    {"criteria_id": self.criteria.id, "marks": 90},
                ],
            },
            format="json",
        )
        self.assertEqual(evaluation.status_code, 400, evaluation.data)

    def test_public_course_list_is_open(self):
        res = self.client.get("/api/academy/courses/")
        self.assertEqual(res.status_code, 200)
        ids = [row["id"] for row in res.data]
        self.assertIn(self.course.id, ids)
