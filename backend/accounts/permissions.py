from rest_framework.permissions import BasePermission, SAFE_METHODS

from .models import UserRole


class HasRole(BasePermission):
    allowed_roles = ()

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in self.allowed_roles
        )

    @classmethod
    def for_roles(cls, *roles):
        return type(
            f"HasRole_{'_'.join(roles)}",
            (cls,),
            {"allowed_roles": roles},
        )


class IsAdmin(HasRole):
    allowed_roles = (UserRole.ADMIN,)


class IsManagerOrAdmin(HasRole):
    allowed_roles = (UserRole.MANAGER, UserRole.ADMIN)


class IsStaffMember(HasRole):
    allowed_roles = (UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN)


class IsTrainer(HasRole):
    allowed_roles = (UserRole.TRAINER, UserRole.MANAGER, UserRole.ADMIN)


class IsOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        owner = getattr(obj, "user", obj)
        if owner is None:
            owner = obj
        return request.user.is_authenticated and (
            owner == request.user or request.user.role == UserRole.ADMIN
        )


class CustomerAccessPermission(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False

        if user.role not in (UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF):
            return False

        if request.method == "DELETE" and user.role == UserRole.STAFF:
            return False

        return True


class ServiceAccessPermission(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False

        if request.method in SAFE_METHODS:
            return user.role in (UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)

        return user.role in (UserRole.ADMIN, UserRole.MANAGER)


class PackageAccessPermission(BasePermission):
    def has_permission(self, request, view):
        role = getattr(request.user, 'role', None)
        if request.method in SAFE_METHODS:
            return role in ('ADMIN', 'MANAGER', 'STAFF')
        return role in ('ADMIN', 'MANAGER')


class AppointmentDetailAccessPermission(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False

        if request.method in SAFE_METHODS:
            return user.role in (UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)

        return user.role in (UserRole.ADMIN, UserRole.MANAGER)


class TrainerWriteReadOnlyOthers(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        return user.role in (UserRole.TRAINER, UserRole.MANAGER, UserRole.ADMIN)