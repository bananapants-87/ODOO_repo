from rest_framework import serializers
from .models import Driver, DriverViolation, DriverTraining


class DriverViolationSerializer(serializers.ModelSerializer):
    class Meta:
        model = DriverViolation
        fields = '__all__'


class DriverTrainingSerializer(serializers.ModelSerializer):
    is_valid = serializers.SerializerMethodField()

    class Meta:
        model = DriverTraining
        fields = '__all__'

    def get_is_valid(self, obj):
        return obj.is_valid()


class DriverSerializer(serializers.ModelSerializer):
    violations = DriverViolationSerializer(many=True, read_only=True)
    trainings = DriverTrainingSerializer(many=True, read_only=True)
    is_available = serializers.SerializerMethodField()
    is_license_valid = serializers.SerializerMethodField()
    age = serializers.SerializerMethodField()

    class Meta:
        model = Driver
        fields = [
            'id', 'name', 'email', 'phone_number', 'date_of_birth', 'address',
            'city', 'postal_code', 'nationality', 'license_number', 'license_class',
            'license_issue_date', 'license_expiry_date', 'license_status',
            'employment_date', 'status', 'hourly_rate', 'medical_cert_expiry',
            'training_cert_expiry', 'background_check_date', 'background_check_status',
            'is_available', 'is_license_valid', 'age',
            'violations', 'trainings', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_is_available(self, obj):
        return obj.is_available()

    def get_is_license_valid(self, obj):
        return obj.is_license_valid()

    def get_age(self, obj):
        return obj.get_age()


class DriverListSerializer(serializers.ModelSerializer):
    is_available = serializers.SerializerMethodField()
    is_license_valid = serializers.SerializerMethodField()

    class Meta:
        model = Driver
        fields = [
            'id', 'name', 'email', 'phone_number', 'license_number',
            'license_status', 'status', 'is_available', 'is_license_valid', 'created_at'
        ]

    def get_is_available(self, obj):
        return obj.is_available()

    def get_is_license_valid(self, obj):
        return obj.is_license_valid()
