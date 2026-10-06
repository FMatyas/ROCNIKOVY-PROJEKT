from django import forms
from .models import Vehicle, Refueling

class VehicleForm(forms.ModelForm):
    class Meta:
        model = Vehicle
        fields = ['name', 'brand', 'model', 'year', 'license_plate']
        widgets = {
            'year': forms.NumberInput(attrs={'class': 'w-full p-2 border rounded-lg', 'placeholder': 'např. 2018'}),
            'name': forms.TextInput(attrs={'class': 'w-full p-2 border rounded-lg', 'placeholder': 'např. Moje Audi'}),
            'brand': forms.TextInput(attrs={'class': 'w-full p-2 border rounded-lg'}),
            'model': forms.TextInput(attrs={'class': 'w-full p-2 border rounded-lg'}),
            'license_plate': forms.TextInput(attrs={'class': 'w-full p-2 border rounded-lg'}),
        }

class RefuelingForm(forms.ModelForm):
    class Meta:
        model = Refueling
        fields = ['date', 'odometer', 'liters', 'price_total']
        widgets = {
            'date': forms.DateInput(attrs={'type': 'date', 'class': 'w-full p-2 border rounded-lg'}),
            'odometer': forms.NumberInput(attrs={'class': 'w-full p-2 border rounded-lg', 'placeholder': 'Stav tachometru v km'}),
            'liters': forms.NumberInput(attrs={'class': 'w-full p-2 border rounded-lg', 'step': '0.01', 'placeholder': 'Natankované litry'}),
            'price_total': forms.NumberInput(attrs={'class': 'w-full p-2 border rounded-lg', 'step': '0.1', 'placeholder': 'Celková cena v Kč'}),
        }