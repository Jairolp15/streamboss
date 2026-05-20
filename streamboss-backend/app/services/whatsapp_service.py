from urllib.parse import quote


def generate_whatsapp_link(
    client_name: str,
    platform_name: str,
    days_remaining: int,
    client_phone: str,
    master_email: str = None,
    master_password: str = None,
    profile_number: str = None,
    profile_pin: str = None,
    is_new_assignment: bool = False,
    device_type: str = None,
) -> dict:
    if is_new_assignment:
        if device_type == "tv" and platform_name.lower() in ["netflix", "disney+", "prime video"]:
            message = (
                f"*Acceso de Streaming - StreamMaster_ve*\n\n"
                f"Hola {client_name}, tu cuenta de {platform_name} esta lista para ser vinculada.\n\n"
                f"Como seleccionaste 'TV' como dispositivo, por favor abre la aplicacion en tu televisor, "
                f"selecciona 'Iniciar Sesion' y envianos por aqui el codigo que aparece en pantalla para "
                f"autorizar tu acceso.\n\n"
                f"*Perfil Asignado:* Perfil #{profile_number}\n"
                f"*PIN del Perfil:* {profile_pin or 'Sin PIN'}\n"
                f"*Vence en:* {days_remaining} dias\n\n"
                f"Quedamos a la espera de tu codigo."
            )
        else:
            message = (
                f"*Acceso de Streaming - StreamMaster_ve*\n\n"
                f"Hola {client_name}, aqui tienes los datos de acceso para tu cuenta:\n\n"
                f"*Plataforma:* {platform_name}\n"
                f"*Usuario/Correo:* {master_email}\n"
                f"*Contrasena:* {master_password}\n"
                f"*Perfil:* Perfil #{profile_number}\n"
                f"*PIN:* {profile_pin or 'Sin PIN'}\n"
                f"*Vence en:* {days_remaining} dias\n\n"
                f"¡Que disfrutes tu pantalla!"
            )
    else:
        day_word = "dia" if days_remaining == 1 else "dias"
        message = (
            f"Hola {client_name},\n\n"
            f"Te informamos que tu suscripcion de *{platform_name}* "
            f"vence en *{days_remaining} {day_word}*.\n\n"
            f"Para renovar y continuar disfrutando sin interrupciones, "
            f"comunicate con nosotros. ¡Estamos aqui para ayudarte!\n\n"
            f"_StreamMaster_ve - Tu plataforma de confianza_"
        )

    clean_phone = (
        client_phone.replace("+", "").replace(" ", "").replace("-", "")
    )
    wa_link = f"https://wa.me/{clean_phone}?text={quote(message)}"
    return {"phone": client_phone, "message": message, "wa_link": wa_link}
