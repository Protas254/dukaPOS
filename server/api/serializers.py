from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Tenant, UserProfile, BusinessSettings, Branch, Product, Customer, Supplier, Shift, Sale,
    Expense, EmployeeRating, EmployeeSchedule, Promotion, MpesaPayment,
    ShiftAudit, CashFlow, PurchaseOrder, VaultDocument, ReceiptFeedback,
    Subscription, ReceiptersEngine, ReceiptersVaultHub
)

User = get_user_model()


class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = '__all__'


class UserProfileSerializer(serializers.ModelSerializer):
    tenant = TenantSerializer(read_only=True)

    class Meta:
        model = UserProfile
        fields = '__all__'


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name', 'is_staff', 'is_superuser']

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    # Custom mapping to match frontend's role structure
    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['full_name'] = f"{instance.first_name} {instance.last_name}".strip() or instance.username
        profile = getattr(instance, 'profile', None)
        if profile:
            rep['role'] = profile.role or ('admin' if (instance.is_superuser or instance.is_staff) else 'user')
            if profile.tenant:
                rep['tenant'] = TenantSerializer(profile.tenant).data
                rep['tenant_id'] = profile.tenant.id
            else:
                rep['tenant'] = None
                rep['tenant_id'] = None
        else:
            rep['role'] = 'admin' if (instance.is_superuser or instance.is_staff) else 'user'
            rep['tenant'] = None
            rep['tenant_id'] = None

        # Convert numeric ID to match string pattern 'u_{id}'
        rep['id'] = f"u_{instance.id}"
        return rep


class BusinessSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessSettings
        fields = '__all__'


class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = '__all__'



class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'

    def validate_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Price cannot be negative.")
        return value

    def validate_cost_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Cost price cannot be negative.")
        return value

    def validate_stock_quantity(self, value):
        if value < 0:
            raise serializers.ValidationError("Stock quantity cannot be negative.")
        return value

    def validate_sku(self, value):
        if not value or value.strip() == "":
            return None
        return value

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['id'] = f"p_{instance.id}"
        rep['is_low_stock'] = instance.stock_quantity <= instance.low_stock_threshold
        return rep


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['id'] = f"c_{instance.id}"
        return rep


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['id'] = f"s_{instance.id}"
        return rep


class ShiftSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shift
        fields = '__all__'

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['id'] = f"shift_{instance.id}"
        return rep


class SaleSerializer(serializers.ModelSerializer):
    created_date = serializers.SerializerMethodField()

    class Meta:
        model = Sale
        fields = '__all__'

    def get_created_date(self, obj):
        return obj.created_at

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['id'] = f"sale_{instance.id}"
        # Ensure created_date is included (ISO string like created_at)
        rep['created_date'] = instance.created_at.isoformat() if instance.created_at else None
        return rep


class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['id'] = f"exp_{instance.id}"
        return rep


class EmployeeRatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeRating
        fields = '__all__'

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['id'] = f"er_{instance.id}"
        return rep


class EmployeeScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeSchedule
        fields = '__all__'


class PromotionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Promotion
        fields = '__all__'


class MpesaPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = MpesaPayment
        fields = '__all__'


class ShiftAuditSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShiftAudit
        fields = '__all__'


class CashFlowSerializer(serializers.ModelSerializer):
    class Meta:
        model = CashFlow
        fields = '__all__'


class PurchaseOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseOrder
        fields = '__all__'

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['id'] = f"po_{instance.id}"
        return rep


class VaultDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = VaultDocument
        fields = '__all__'

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['id'] = f"vd_{instance.id}"
        return rep


class ReceiptFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReceiptFeedback
        fields = '__all__'

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['id'] = f"rf_{instance.id}"
        return rep


class SubscriptionSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)

    class Meta:
        model = Subscription
        fields = '__all__'

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['id'] = f"sub_{instance.id}"
        return rep


class ReceiptersEngineSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReceiptersEngine
        fields = '__all__'


class ReceiptersVaultHubSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReceiptersVaultHub
        fields = '__all__'
