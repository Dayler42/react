from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import ValidationError, PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth.models import User
from django.db.models import Q
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes
from .models import Profile, Board, List, Card, Label, Comment, ChecklistItem, ActivityLog
from .serializers import (
    UserSerializer, ProfileSerializer, RegisterSerializer,
    BoardSerializer, ListSerializer, CardSerializer, LabelSerializer,
    CommentSerializer, ChecklistItemSerializer, ActivityLogSerializer
)
from .permissions import IsTeacherOrReadOnly, IsBoardTeacher, IsAssignedStudentOrTeacher


@extend_schema_view(
    list=extend_schema(
        summary="Listar usuarios",
        description="Obtiene una lista de todos los usuarios del sistema. Permite búsqueda por username, email, first_name, last_name.",
    ),
    retrieve=extend_schema(
        summary="Obtener usuario",
        description="Obtiene los detalles de un usuario específico por su ID.",
    ),
)
class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name']
    
    @extend_schema(
        summary="Obtener estudiantes",
        description="Obtiene una lista de todos los usuarios que tienen rol de estudiante.",
        responses={200: UserSerializer(many=True)},
    )
    @action(detail=False, methods=['get'])
    def students(self, request):
        """Obtener todos los usuarios que son estudiantes"""
        students = User.objects.filter(profile__role='student')
        serializer = self.get_serializer(students, many=True)
        return Response(serializer.data)


@extend_schema_view(
    list=extend_schema(
        summary="Listar perfiles",
        description="Obtiene una lista de todos los perfiles de usuario.",
    ),
    retrieve=extend_schema(
        summary="Obtener perfil",
        description="Obtiene los detalles de un perfil específico por su ID.",
    ),
)
class ProfileViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        summary="Obtener mi perfil",
        description="Obtiene el perfil del usuario autenticado actualmente.",
        responses={200: ProfileSerializer},
    )
    @action(detail=False, methods=['get'])
    def me(self, request):
        profile = request.user.profile
        serializer = self.get_serializer(profile)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Obtener estudiantes",
        description="Obtiene una lista de todos los perfiles con rol de estudiante, incluyendo información del usuario.",
        responses={200: ProfileSerializer(many=True)},
    )
    @action(detail=False, methods=['get'])
    def students(self, request):
        """Obtener todos los estudiantes"""
        students = Profile.objects.filter(role='student').select_related('user')
        serializer = self.get_serializer(students, many=True)
        return Response(serializer.data)


@extend_schema_view(
    create=extend_schema(
        summary="Registrar nuevo usuario",
        description="Crea un nuevo usuario en el sistema. El usuario puede ser docente o estudiante según el rol especificado.",
        examples=[
            OpenApiExample(
                "Registro de docente",
                value={
                    "username": "docente1",
                    "email": "docente1@example.com",
                    "password": "password123",
                    "password_confirm": "password123",
                    "first_name": "Juan",
                    "last_name": "Pérez",
                    "role": "teacher"
                },
                request_only=True,
            ),
            OpenApiExample(
                "Registro de estudiante",
                value={
                    "username": "estudiante1",
                    "email": "estudiante1@example.com",
                    "password": "password123",
                    "password_confirm": "password123",
                    "first_name": "María",
                    "last_name": "González",
                    "role": "student"
                },
                request_only=True,
            ),
        ],
    ),
)
class RegisterViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    http_method_names = ['post']


class BoardViewSet(viewsets.ModelViewSet):
    serializer_class = BoardSerializer
    permission_classes = [IsAuthenticated, IsTeacherOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        queryset = Board.objects.all()
        if hasattr(user, 'profile'):
            if user.profile.role == 'teacher':
                # Docentes ven sus propios tableros
                return queryset.filter(teacher=user)
            if user.profile.role == 'student':
                # Estudiantes ven tableros donde son miembros o tienen tareas asignadas
                return queryset.filter(
                    Q(students=user) | Q(lists__cards__assigned_to=user)
                ).distinct()
        return queryset

    def perform_create(self, serializer):
        board = serializer.save(teacher=self.request.user)
        default_lists = [
            ('pendiente', 'Pendiente'),
            ('progreso', 'En Progreso'),
            ('completada', 'Completada'),
        ]
        for idx, (status, title) in enumerate(default_lists):
            List.objects.create(
                board=board,
                title=title,
                position=idx
            )
        ActivityLog.objects.create(
            board=board,
            user=self.request.user,
            activity_type='board_created',
            description=f"Tablero '{board.name}' creado"
        )

    def perform_update(self, serializer):
        serializer.save()
        ActivityLog.objects.create(
            board=serializer.instance,
            user=self.request.user,
            activity_type='board_updated',
            description=f"Tablero '{serializer.instance.name}' actualizado"
        )

    @extend_schema(
        summary="Agregar estudiante al tablero",
        description="Agrega un estudiante a un tablero específico. Solo el docente propietario puede agregar estudiantes.",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'user_id': {'type': 'integer', 'description': 'ID del usuario estudiante a agregar'}
                },
                'required': ['user_id']
            }
        },
        responses={200: BoardSerializer, 400: OpenApiTypes.OBJECT, 404: OpenApiTypes.OBJECT},
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsBoardTeacher])
    def add_student(self, request, pk=None):
        board = self.get_object()
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'user_id requerido'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            student = User.objects.get(id=user_id, profile__role='student')
        except User.DoesNotExist:
            return Response({'error': 'Estudiante no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        board.students.add(student)
        serializer = self.get_serializer(board)
        ActivityLog.objects.create(
            board=board,
            user=request.user,
            activity_type='estudiante_agregado',
            description=f"Estudiante '{student.username}' agregado al tablero"
        )
        return Response(serializer.data)

    @extend_schema(
        summary="Obtener historial de actividad",
        description="Obtiene el historial de actividad de un tablero. Los últimos 50 eventos se devuelven ordenados por fecha descendente.",
        responses={200: ActivityLogSerializer(many=True), 403: OpenApiTypes.OBJECT},
    )
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def activity(self, request, pk=None):
        """Obtener historial de actividad del board"""
        board = self.get_object()
        # Verificar que el usuario tiene acceso al board
        user = request.user
        if hasattr(user, 'profile'):
            if user.profile.role == 'teacher':
                if board.teacher != user:
                    return Response({'error': 'No tienes acceso a este tablero'}, status=status.HTTP_403_FORBIDDEN)
            elif user.profile.role == 'student':
                if user not in board.students.all() and not board.lists.filter(cards__assigned_to=user).exists():
                    return Response({'error': 'No tienes acceso a este tablero'}, status=status.HTTP_403_FORBIDDEN)
        
        activities = ActivityLog.objects.filter(board=board).order_by('-created_at')[:50]
        serializer = ActivityLogSerializer(activities, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Remover estudiante del tablero",
        description="Remueve un estudiante de un tablero específico. Solo el docente propietario puede remover estudiantes.",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'user_id': {'type': 'integer', 'description': 'ID del usuario estudiante a remover'}
                },
                'required': ['user_id']
            }
        },
        responses={200: BoardSerializer, 400: OpenApiTypes.OBJECT, 404: OpenApiTypes.OBJECT},
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsBoardTeacher])
    def remove_student(self, request, pk=None):
        board = self.get_object()
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'user_id requerido'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            student = User.objects.get(id=user_id, profile__role='student')
        except User.DoesNotExist:
            return Response({'error': 'Estudiante no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        board.students.remove(student)
        serializer = self.get_serializer(board)
        ActivityLog.objects.create(
            board=board,
            user=request.user,
            activity_type='estudiante_eliminado',
            description=f"Estudiante '{student.username}' removido del tablero"
        )
        return Response(serializer.data)


class ListViewSet(viewsets.ModelViewSet):
    serializer_class = ListSerializer
    permission_classes = [IsAuthenticated, IsBoardTeacher]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['board']

    def get_queryset(self):
        return List.objects.all()

    def perform_create(self, serializer):
        list_obj = serializer.save()
        ActivityLog.objects.create(
            board=list_obj.board,
            user=self.request.user,
            activity_type='list_created',
            description=f"Lista '{list_obj.title}' creada"
        )

    def perform_update(self, serializer):
        list_obj = serializer.save()
        ActivityLog.objects.create(
            board=list_obj.board,
            user=self.request.user,
            activity_type='list_updated',
            description=f"Lista '{list_obj.title}' actualizada"
        )


class CardViewSet(viewsets.ModelViewSet):
    serializer_class = CardSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['list', 'assigned_to']
    search_fields = ['title', 'description']
    ordering_fields = ['position', 'created_at', 'due_date']
    ordering = ['position', 'created_at']

    def get_queryset(self):
        user = self.request.user
        queryset = Card.objects.all()
        
        # Si es estudiante, solo mostrar las tareas asignadas a él
        if hasattr(user, 'profile') and user.profile.role == 'student':
            queryset = queryset.filter(assigned_to=user)
        # Si es docente, puede ver todas las tareas (sin filtro adicional)
        
        board_id = self.request.query_params.get('board')
        if board_id:
            queryset = queryset.filter(list__board_id=board_id)

        status_filter = self.request.query_params.get('status')
        if status_filter:
            # Usar el título de la lista para identificar el estado
            queryset = queryset.filter(list__title__icontains=status_filter)
        
        # Filtrar por próximas a vencer
        upcoming = self.request.query_params.get('upcoming', None)
        if upcoming == 'true':
            from django.utils import timezone
            from datetime import timedelta
            queryset = queryset.filter(
                due_date__isnull=False,
                due_date__gte=timezone.now(),
                due_date__lte=timezone.now() + timedelta(days=7)
            )
        
        return queryset

    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            return [IsAuthenticated(), IsBoardTeacher()]
        elif self.action in ['update', 'partial_update']:
            # Permitir que estudiantes muevan sus propias tareas y docentes muevan cualquier tarea
            return [IsAuthenticated(), IsAssignedStudentOrTeacher()]
        elif self.action in ['retrieve', 'list']:
            return [IsAuthenticated()]
        return super().get_permissions()

    def perform_create(self, serializer):
        card = serializer.save()
        ActivityLog.objects.create(
            board=card.list.board,
            user=self.request.user,
            activity_type='card_created',
            description=f"Tarjeta '{card.title}' creada",
            metadata={'card_id': card.id, 'list_id': card.list.id}
        )

    def perform_update(self, serializer):
        # Guardar la lista antigua antes de actualizar
        old_list = serializer.instance.list
        old_list_id = old_list.id if old_list else None
        
        # Guardar los cambios en la base de datos (el serializer ya maneja el campo list)
        card = serializer.save()
        
        # Recargar el objeto desde la BD para asegurar que tenemos los datos actualizados
        card.refresh_from_db()
        
        # Obtener la nueva lista (recargada desde la BD)
        new_list = card.list
        new_list_id = new_list.id if new_list else None
        
        # Verificar si la lista cambió
        if old_list_id != new_list_id:
            # Cargar el board de la nueva lista con select_related para evitar consultas adicionales
            new_list = List.objects.select_related('board').get(id=new_list_id)
            board = new_list.board
            ActivityLog.objects.create(
                board=board,
                user=self.request.user,
                activity_type='card_moved',
                description=f"Tarjeta '{card.title}' movida de '{old_list.title}' a '{new_list.title}'",
                metadata={'card_id': card.id, 'old_list_id': old_list_id, 'new_list_id': new_list_id}
            )
        else:
            # Si no cambió la lista, usar el board de la lista actual
            board = old_list.board
            ActivityLog.objects.create(
                board=board,
                user=self.request.user,
                activity_type='card_updated',
                description=f"Tarjeta '{card.title}' actualizada",
                metadata={'card_id': card.id}
            )

    def perform_destroy(self, instance):
        ActivityLog.objects.create(
            board=instance.list.board,
            user=self.request.user,
            activity_type='card_deleted',
            description=f"Tarjeta '{instance.title}' eliminada",
            metadata={'card_id': instance.id}
        )
        instance.delete()

    @extend_schema(
        summary="Asignar tarjeta a usuario",
        description="Asigna una tarjeta (tarea) a un usuario específico. Se registra la asignación en el historial de actividad.",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'user_id': {'type': 'integer', 'description': 'ID del usuario al que se asignará la tarjeta'}
                },
                'required': ['user_id']
            }
        },
        responses={200: OpenApiTypes.OBJECT, 400: OpenApiTypes.OBJECT},
    )
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        card = self.get_object()
        user_id = request.data.get('user_id')
        if user_id:
            user = User.objects.get(id=user_id)
            card.assigned_to = user
            card.save()
            ActivityLog.objects.create(
                board=card.list.board,
                user=request.user,
                activity_type='card_assigned',
                description=f"Tarjeta '{card.title}' asignada a {user.username}",
                metadata={'card_id': card.id, 'assigned_to_id': user.id}
            )
            return Response({'status': 'Tarjeta asignada'})
        return Response({'error': 'user_id requerido'}, status=status.HTTP_400_BAD_REQUEST)


class LabelViewSet(viewsets.ModelViewSet):
    serializer_class = LabelSerializer
    permission_classes = [IsAuthenticated, IsTeacherOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['board']

    def get_queryset(self):
        return Label.objects.all()

    def perform_create(self, serializer):
        board_id = self.request.data.get('board')
        if not board_id:
            raise ValidationError({'board': 'Este campo es requerido.'})
        
        try:
            board = Board.objects.get(id=board_id)
        except Board.DoesNotExist:
            raise ValidationError({'board': 'El tablero especificado no existe.'})
        
        # Verificar que el usuario sea el profesor del board
        if board.teacher != self.request.user:
            raise PermissionDenied('Solo el profesor del tablero puede crear etiquetas.')
        
        serializer.save(board=board)


class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['card']

    def get_queryset(self):
        # Optimizar consultas cargando relaciones necesarias
        return Comment.objects.select_related('author', 'card', 'card__list', 'card__list__board').all()

    def perform_create(self, serializer):
        try:
            comment = serializer.save(author=self.request.user)
            # Cargar el card con sus relaciones para evitar consultas adicionales
            card = Card.objects.select_related('list', 'list__board').get(id=comment.card.id)
            board = card.list.board
            
            ActivityLog.objects.create(
                board=board,
                user=self.request.user,
                activity_type='comment_added',
                description=f"Comentario agregado a '{card.title}'",
                metadata={'card_id': card.id, 'comment_id': comment.id}
            )
        except Exception as e:
            # Si hay error al crear el ActivityLog, no fallar la creación del comentario
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error al crear ActivityLog para comentario: {str(e)}")
            # El comentario ya se guardó, así que no re-lanzamos el error


class ChecklistItemViewSet(viewsets.ModelViewSet):
    serializer_class = ChecklistItemSerializer
    permission_classes = [IsAuthenticated, IsAssignedStudentOrTeacher]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['card']

    def get_queryset(self):
        return ChecklistItem.objects.all()

    def perform_create(self, serializer):
        item = serializer.save()
        ActivityLog.objects.create(
            board=item.card.list.board,
            user=self.request.user,
            activity_type='checklist_item_added',
            description=f"Item '{item.text}' agregado a '{item.card.title}'",
            metadata={'card_id': item.card.id, 'item_id': item.id}
        )

    def perform_update(self, serializer):
        item = serializer.save()
        if item.is_completed:
            ActivityLog.objects.create(
                board=item.card.list.board,
                user=self.request.user,
                activity_type='checklist_item_completed',
                description=f"Item '{item.text}' completado en '{item.card.title}'",
                metadata={'card_id': item.card.id, 'item_id': item.id}
            )


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['board', 'user', 'activity_type']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'profile'):
            if user.profile.role == 'teacher':
                # Docentes ven todas las actividades de sus tableros
                return ActivityLog.objects.filter(board__teacher=user).select_related('board', 'user')
            elif user.profile.role == 'student':
                # Estudiantes ven actividades de:
                # 1. Tableros donde son miembros
                # 2. Actividades relacionadas con sus tareas asignadas (cards)
                queryset = ActivityLog.objects.filter(
                    Q(board__students=user) | 
                    Q(board__lists__cards__assigned_to=user)
                ).distinct().select_related('board', 'user')
                
                return queryset
        return ActivityLog.objects.none()




