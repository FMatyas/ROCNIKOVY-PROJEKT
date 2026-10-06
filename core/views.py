from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from .models import Vehicle, Refueling
from .forms import VehicleForm, RefuelingForm

@login_required
def dashboard(request):
    vehicles = Vehicle.objects.filter(user=request.user)
    selected_vehicle = vehicles.first()
    
    refuelings = []
    avg_consumption = 0
    total_cost = 0
    dates = []
    consumptions = []

    if selected_vehicle:
        refuelings_qs = Refueling.objects.filter(vehicle=selected_vehicle).order_by('date')
        
        for r in refuelings_qs:
            dates.append(r.date.strftime("%d.%m.%Y"))
            consumptions.append(float(r.calculated_consumption) if r.calculated_consumption else 0.0)

        all_consumptions = [c for c in consumptions if c > 0]
        if all_consumptions:
            avg_consumption = round(sum(all_consumptions) / len(all_consumptions), 2)
        
        total_cost = sum(r.price_total for r in refuelings_qs)
        refuelings = refuelings_qs.reverse()[:5]

    context = {
        'vehicles': vehicles,
        'selected_vehicle': selected_vehicle,
        'refuelings': refuelings,
        'avg_consumption': avg_consumption,
        'total_cost': total_cost,
        'chart_dates': dates,
        'chart_consumptions': consumptions,
    }
    return render(request, 'core/dashboard.html', context)

@login_required
def add_vehicle(request):
    if request.method == 'POST':
        form = VehicleForm(request.POST)
        if form.is_valid():
            vehicle = form.save(commit=False)
            vehicle.user = request.user
            vehicle.save()
            return redirect('dashboard')
    else:
        form = VehicleForm()
    return render(request, 'core/add_vehicle.html', {'form': form})

@login_required
def add_refueling(request, vehicle_id):
    vehicle = get_object_or_404(Vehicle, id=vehicle_id, user=request.user)
    
    if request.method == 'POST':
        form = RefuelingForm(request.POST)
        if form.is_valid():
            refueling = form.save(commit=False)
            refueling.vehicle = vehicle
            
            # Výpočet spotřeby od minulého tankování
            last_refueling = Refueling.objects.filter(vehicle=vehicle, odometer__lt=refueling.odometer).order_by('-odometer').first()
            if last_refueling:
                distance = refueling.odometer - last_refueling.odometer
                if distance > 0:
                    refueling.calculated_consumption = (refueling.liters / distance) * 100

            refueling.save()
            return redirect('dashboard')
    else:
        form = RefuelingForm()

    return render(request, 'core/add_refueling.html', {'form': form, 'vehicle': vehicle})