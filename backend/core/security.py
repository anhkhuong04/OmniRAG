import hashlib
import secrets

# Prefix makes keys identifiable in logs/error messages without exposing the secret
API_KEY_PREFIX = "omni_"


def generate_api_key() -> str:
    """Generates a secure, random API key.

    Returns:
        A URL-safe string of format `omni_<44 random chars>`.
        The full string is the raw key shown to the user exactly once.
    """
    return f"{API_KEY_PREFIX}{secrets.token_urlsafe(32)}"


def hash_api_key(api_key: str) -> str:
    """Hashes an API key using SHA-256 for safe storage in the database.

    The raw key is NEVER stored — only its hash is persisted.

    Args:
        api_key: The raw API key string to hash.

    Returns:
        Hex-encoded SHA-256 digest of the key.
    """
    return hashlib.sha256(api_key.encode()).hexdigest()
