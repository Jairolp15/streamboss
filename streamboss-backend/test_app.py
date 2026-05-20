import httpx
import sys

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:8000/api/v1"

def test_flow():
    print("==================================================")
    print("   🚀 INICIANDO PRUEBAS DE INTEGRACIÓN STREAMBOSS")
    print("==================================================\n")

    client = httpx.Client(timeout=10.0)

    # 1. Test Login
    print("[1/8] Probando Autenticación JWT...")
    try:
        login_res = client.post(
            f"{BASE_URL}/auth/login",
            data={"username": "admin@streamboss.com", "password": "Admin1234!"}
        )
        if login_res.status_code != 200:
            print(f"❌ Error de login (Status: {login_res.status_code}): {login_res.text}")
            sys.exit(1)
        
        token = login_res.json()["access_token"]
        client.headers.update({"Authorization": f"Bearer {token}"})
        print("  ✔ Login correcto. JWT Token recibido y configurado.\n")
    except Exception as e:
        print(f"❌ Error al conectar con el backend: {e}")
        sys.exit(1)

    # 2. Get Platforms
    print("[2/8] Consultando Catálogo de Plataformas...")
    plat_res = client.get(f"{BASE_URL}/platforms/")
    if plat_res.status_code != 200:
        print(f"❌ Error al obtener plataformas: {plat_res.text}")
        sys.exit(1)
    
    platforms = plat_res.json()
    print(f"  ✔ Catálogo obtenido. Total plataformas: {len(platforms)}")
    for p in platforms:
        print(f"    - {p['name']} (Hex: {p['color_hex']})")
    print()

    # Find Netflix for our testing
    netflix = next((p for p in platforms if p["name"] == "Netflix"), None)
    if not netflix:
        netflix = platforms[0]

    # 3. Create Master Account
    print("[3/8] Creando Cuenta Maestra de prueba...")
    from datetime import date, timedelta
    today = date.today()
    expiry = today + timedelta(days=30)
    
    acc_data = {
        "platform_id": netflix["id"],
        "email": "test-netflix@streamboss.com",
        "password_encrypted": "ClaveSecreta123",
        "purchase_date": str(today),
        "expiry_date": str(expiry),
        "total_profiles": 5,
        "notes": "Cuenta de prueba automatizada"
    }
    
    acc_res = client.post(f"{BASE_URL}/master-accounts/", json=acc_data)
    if acc_res.status_code != 201:
        print(f"❌ Error al crear cuenta maestra: {acc_res.text}")
        sys.exit(1)
    
    account = acc_res.json()
    print(f"  ✔ Cuenta Maestra creada exitosamente:")
    print(f"    - ID: {account['id']}")
    print(f"    - Email: {account['email']}")
    print(f"    - Perfiles autogenerados: {len(account['profiles'])}")
    print(f"    - Estado slots: {account['available_count']} disponibles, {account['occupied_count']} ocupados\n")

    # Find the first available profile
    profile = account["profiles"][0]

    # 4. Create Client
    print("[4/8] Creando Cliente de prueba...")
    client_data = {
        "full_name": "Juan Perez Test",
        "phone_whatsapp": "+584121112233",
        "device_type": "tv"
    }
    cli_res = client.post(f"{BASE_URL}/clients/", json=client_data)
    if cli_res.status_code != 201:
        print(f"❌ Error al crear cliente: {cli_res.text}")
        sys.exit(1)
    
    cli = cli_res.json()
    print(f"  ✔ Cliente creado exitosamente:")
    print(f"    - ID: {cli['id']}")
    print(f"    - Nombre: {cli['full_name']}")
    print(f"    - WhatsApp: {cli['phone_whatsapp']}\n")

    # 5. Create Subscription (Ending in exactly 3 days to trigger alerts)
    print("[5/8] Asignando Perfil a Cliente (Creando Suscripción)...")
    sub_end = today + timedelta(days=3)
    sub_data = {
        "client_id": cli["id"],
        "profile_id": profile["id"],
        "start_date": str(today),
        "end_date": str(sub_end)
    }
    sub_res = client.post(f"{BASE_URL}/subscriptions/", json=sub_data)
    if sub_res.status_code != 201:
        print(f"❌ Error al crear suscripción: {sub_res.text}")
        sys.exit(1)
    
    sub = sub_res.json()
    print(f"  ✔ Suscripción creada y Perfil #{profile['profile_number']} asignado:")
    print(f"    - ID Suscripción: {sub['id']}")
    print(f"    - Vence en: {sub['end_date']} ({sub['days_remaining']} días restantes)\n")

    # 6. Verify alert checker (Expiring subscriptions)
    print("[6/8] Probando Filtro de Vencimientos Próximos (≤3 días)...")
    exp_res = client.get(f"{BASE_URL}/subscriptions/expiring")
    if exp_res.status_code != 200:
        print(f"❌ Error al consultar vencimientos: {exp_res.text}")
        sys.exit(1)
    
    exp_list = exp_res.json()
    found = any(s["id"] == sub["id"] for s in exp_list)
    if found:
        print(f"  ✔ Alerta CORRECTA. La suscripción de prueba figura en la lista de alertas.\n")
    else:
        print("  ❌ Alerta fallida. No se detectó la suscripción por vencer.\n")
        sys.exit(1)

    # 7. WhatsApp dynamic link generation
    print("[7/8] Probando generación de link de renovación WhatsApp...")
    wa_res = client.get(f"{BASE_URL}/subscriptions/{sub['id']}/whatsapp")
    if wa_res.status_code != 200:
        print(f"❌ Error al generar link WhatsApp: {wa_res.text}")
        sys.exit(1)
    
    wa_data = wa_res.json()
    print(f"  ✔ Link generado exitosamente:")
    print(f"    - Enlace: {wa_data['wa_link']}")
    print(f"    - Mensaje pre-cargado: \"{wa_data['message']}\"\n")

    # 8. Clean up (Cancel subscription / delete account)
    print("[8/8] Limpiando datos de prueba de la base de datos...")
    cancel_res = client.patch(f"{BASE_URL}/subscriptions/{sub['id']}/cancel")
    if cancel_res.status_code != 200:
        print(f"❌ Error al cancelar suscripción: {cancel_res.text}")
    else:
        print("  ✔ Perfil liberado y suscripción cancelada.")

    del_res = client.delete(f"{BASE_URL}/master-accounts/{account['id']}")
    if del_res.status_code != 204:
        print(f"❌ Error al eliminar cuenta maestra: {del_res.text}")
    else:
        print("  ✔ Cuenta Maestra y perfiles eliminados de la base de datos.")

    print("\n==================================================")
    print("   🎉 TODAS LAS PRUEBAS COMPLETADAS CON ÉXITO")
    print("   EL SISTEMA ESTÁ 100% FUNCIONAL Y CONFIGURADO")
    print("==================================================")

if __name__ == "__main__":
    test_flow()
