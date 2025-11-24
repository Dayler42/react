from django.contrib import admin
from .models import Profile, Board, List, Card, Label, Comment, ChecklistItem, ActivityLog


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'created_at']
    list_filter = ['role']


@admin.register(Board)
class BoardAdmin(admin.ModelAdmin):
    list_display = ['name', 'teacher', 'created_at']
    list_filter = ['teacher', 'created_at']


@admin.register(List)
class ListAdmin(admin.ModelAdmin):
    list_display = ['title', 'board', 'position']
    list_filter = ['board']


@admin.register(Card)
class CardAdmin(admin.ModelAdmin):
    list_display = ['title', 'list', 'assigned_to', 'due_date']
    list_filter = ['list__board', 'assigned_to', 'due_date']


@admin.register(Label)
class LabelAdmin(admin.ModelAdmin):
    list_display = ['name', 'board', 'color']


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['card', 'author', 'created_at']
    list_filter = ['created_at']


@admin.register(ChecklistItem)
class ChecklistItemAdmin(admin.ModelAdmin):
    list_display = ['text', 'card', 'is_completed']
    list_filter = ['is_completed']


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ['board', 'user', 'activity_type', 'created_at']
    list_filter = ['activity_type', 'created_at']






