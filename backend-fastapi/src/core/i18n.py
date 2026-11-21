import json
from pathlib import Path
from typing import Any, Dict
from src.core.config import settings

_CATALOGS: Dict[str, Dict[str, Any]] = {}

# Carga de catálogos de traducción en el arranque
def _load_catalogs() -> None:
    locales_dir = Path(__file__).resolve().parent.parent.parent / "locales"
    for locale in settings.SUPPORTED_LOCALES:
        file_path = locales_dir / f"{locale}.json"
        if file_path.exists():
            with open(file_path, "r", encoding="utf-8") as f:
                _CATALOGS[locale] = json.load(f)
        else:
            _CATALOGS[locale] = {}


_load_catalogs()


def translate(key: str, locale: str = "es", **kwargs: Any) -> str:
    """
    Resuelve una clave de traducción con notación de punto (ej: 'errors.license_expired').
    Aplica interpolación segura de parámetros con **kwargs.
    Si la clave no existe en el idioma solicitado, hace fallback al idioma base ('es').
    """
    target_locale = locale if locale in settings.SUPPORTED_LOCALES else settings.DEFAULT_LOCALE
    catalog = _CATALOGS.get(target_locale, {})
    
    parts = key.split(".")
    curr: Any = catalog
    for p in parts:
        if isinstance(curr, dict) and p in curr:
            curr = curr[p]
        else:
            curr = None
            break
            
    # Fallback al español si no se encontró en el idioma pedido
    if curr is None and target_locale != settings.DEFAULT_LOCALE:
        fallback_cat = _CATALOGS.get(settings.DEFAULT_LOCALE, {})
        curr = fallback_cat
        for p in parts:
            if isinstance(curr, dict) and p in curr:
                curr = curr[p]
            else:
                curr = key
                break

    if not isinstance(curr, str):
        return key

    try:
        return curr.format(**kwargs)
    except Exception:
        return curr


def get_translated_message(key: str, locale: str = "es", **kwargs: Any) -> str:
    """Alias oficial requerido por AGENTS.MD."""
    return translate(key=key, locale=locale, **kwargs)

