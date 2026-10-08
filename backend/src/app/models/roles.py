from enum import Enum


class UserRole(str, Enum):
    """User roles for Scope Sense.

    Additional roles can be added later as needed. Using a typed enum
    ensures consistent usage throughout the codebase instead of
    random strings.
    """

    FREELANCER = "freelancer"
    CLIENT = "client"
    ADMIN = "admin"

    @property
    def display_name(self) -> str:
        return self.value.capitalize()

    @classmethod
    def from_string(cls, value: str) -> "UserRole":
        """Convert a string to a UserRole, case-insensitively."""
        if not isinstance(value, str):
            raise ValueError(f"Invalid role value: {value!r}")
        normalized = value.strip().lower()
        for member in cls:
            if member.value == normalized:
                return member
        raise ValueError(f"Unknown role: {value!r}")

    @classmethod
    def allowed_values(cls) -> list[str]:
        return [member.value for member in cls]