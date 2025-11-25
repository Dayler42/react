from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from .views import (
    UserViewSet, ProfileViewSet, RegisterViewSet,
    BoardViewSet, ListViewSet, CardViewSet, LabelViewSet,
    CommentViewSet, ChecklistItemViewSet, ActivityLogViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'profiles', ProfileViewSet, basename='profile')
router.register(r'register', RegisterViewSet, basename='register')
router.register(r'boards', BoardViewSet, basename='board')
router.register(r'lists', ListViewSet, basename='list')
router.register(r'cards', CardViewSet, basename='card')
router.register(r'labels', LabelViewSet, basename='label')
router.register(r'comments', CommentViewSet, basename='comment')
router.register(r'checklist-items', ChecklistItemViewSet, basename='checklistitem')
router.register(r'activity-logs', ActivityLogViewSet, basename='activitylog')

urlpatterns = [
    path('', include(router.urls)),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

urlpatterns += [
    path("schema/", SpectacularAPIView.as_view(), name="api_schema"),
    path("docs/", SpectacularSwaggerView.as_view(url_name="api_schema"), name="api_docs"),
]





