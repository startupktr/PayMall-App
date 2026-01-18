from accounts.models import UserRole


def has_role(user, role) -> bool:
    if not user or not user.is_authenticated:
        return False

    return user.roles.filter(role=role).exists()



def is_customer(user) -> bool:
    return has_role(user, UserRole.Role.CUSTOMER)


def is_mall_admin(user) -> bool:
    return has_role(user, UserRole.Role.MALL_ADMIN)


def is_master_admin(user) -> bool:
    return has_role(user, UserRole.Role.MASTER_ADMIN)

