from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import Profile, Board, List, Card, Label, Comment, ChecklistItem, ActivityLog


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']


class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Profile
        fields = ['id', 'user', 'role', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=Profile.ROLE_CHOICES, write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name', 'role']

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Las contraseñas no coinciden."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        role = validated_data.pop('role')
        password = validated_data.pop('password')
        
        user = User.objects.create_user(password=password, **validated_data)
        Profile.objects.create(user=user, role=role)
        return user


class LabelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Label
        fields = ['id', 'board', 'name', 'color', 'created_at']
        read_only_fields = ['id', 'created_at']


class BoardBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Board
        fields = ['id', 'name', 'color']


class ListBasicSerializer(serializers.ModelSerializer):
    board = BoardBasicSerializer(read_only=True)

    class Meta:
        model = List
        fields = ['id', 'title', 'position', 'board']


class ChecklistItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChecklistItem
        fields = ['id', 'text', 'is_completed', 'position', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    
    class Meta:
        model = Comment
        fields = ['id', 'card', 'author', 'content', 'created_at', 'updated_at']
        read_only_fields = ['id', 'author', 'created_at', 'updated_at']


class CardSerializer(serializers.ModelSerializer):
    assigned_to = UserSerializer(read_only=True)
    assigned_to_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='assigned_to',
        write_only=True,
        required=False,
        allow_null=True
    )
    labels = LabelSerializer(many=True, read_only=True)
    label_ids = serializers.PrimaryKeyRelatedField(
        queryset=Label.objects.all(),
        source='labels',
        many=True,
        write_only=True,
        required=False
    )
    comments = CommentSerializer(many=True, read_only=True)
    checklist_items = ChecklistItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Card
        fields = [
            'id', 'list', 'title', 'description', 'assigned_to', 'assigned_to_id',
            'due_date', 'position', 'labels', 'label_ids', 'comments',
            'checklist_items', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def update(self, instance, validated_data):
        # Extraer el campo list si está presente
        list_value = validated_data.pop('list', None)
        
        # Llamar al método update del padre para actualizar los demás campos
        updated_instance = super().update(instance, validated_data)
        
        # Si se proporcionó un nuevo valor para list, actualizarlo explícitamente
        if list_value is not None:
            # Obtener el ID de la lista (puede ser un objeto List o un ID)
            if hasattr(list_value, 'id'):
                list_id = list_value.id
            elif isinstance(list_value, int):
                list_id = list_value
            else:
                list_id = list_value
            
            # Actualizar el campo list_id directamente
            updated_instance.list_id = list_id
            # Guardar solo los campos list y updated_at para eficiencia
            updated_instance.save(update_fields=['list_id', 'updated_at'])
        
        return updated_instance

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.list_id:
            data['list'] = ListBasicSerializer(instance.list).data
        else:
            data['list'] = None
        return data


class ListSerializer(serializers.ModelSerializer):
    cards = CardSerializer(many=True, read_only=True)
    
    class Meta:
        model = List
        fields = ['id', 'board', 'title', 'position', 'cards', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class BoardSerializer(serializers.ModelSerializer):
    teacher = UserSerializer(read_only=True)
    lists = ListSerializer(many=True, read_only=True)
    labels = LabelSerializer(many=True, read_only=True)
    students = UserSerializer(many=True, read_only=True)
    
    class Meta:
        model = Board
        fields = ['id', 'name', 'description', 'teacher', 'students', 'color', 'lists', 'labels', 'created_at', 'updated_at']
        read_only_fields = ['id', 'teacher', 'created_at', 'updated_at']


class ActivityLogSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    board_name = serializers.CharField(source='board.name', read_only=True)
    
    class Meta:
        model = ActivityLog
        fields = ['id', 'board', 'board_name', 'user', 'activity_type', 'description', 'metadata', 'created_at']
        read_only_fields = ['id', 'board_name', 'user', 'created_at']





