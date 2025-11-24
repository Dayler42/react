from rest_framework import permissions


class IsTeacherOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and hasattr(request.user, 'profile') and request.user.profile.role == 'teacher'


class IsBoardTeacher(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'teacher'):
            return obj.teacher == request.user
        if hasattr(obj, 'board'):
            return obj.board.teacher == request.user
        if hasattr(obj, 'list'):
            return obj.list.board.teacher == request.user
        if hasattr(obj, 'card'):
            return obj.card.list.board.teacher == request.user
        return False


class IsAssignedStudentOrTeacher(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if hasattr(request.user, 'profile'):
            if request.user.profile.role == 'teacher':
                return obj.list.board.teacher == request.user
            elif request.user.profile.role == 'student':
                return obj.assigned_to == request.user
        return False






