import { type ItemType } from "@/types/common";
import { User } from "next-auth";

type Role = "USER" | "ADMIN" | "BLOCKED";

type PermissionType =
  | "VIEW"
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "UPDATE:OWN"
  | "DELETE:OWN";

type ResourceType = "ITEM" | "CATEGORY";

type ResourceDataTypeMap = {
  ITEM: {
    "UPDATE:OWN": ItemType;
    "DELETE:OWN": ItemType;
  };
  CATEGORY: undefined;
};

type GetResourceData<
  T extends ResourceType,
  P extends PermissionType,
> = P extends keyof ResourceDataTypeMap[T]
  ? ResourceDataTypeMap[T][P]
  : undefined;

type ResourceChecker<T extends ResourceType, P extends PermissionType> = (
  user: User,
  resource: GetResourceData<T, P>
) => boolean;

type ResourcePermissions<T extends ResourceType> = {
  [K in PermissionType]?: boolean | ResourceChecker<T, K>;
};

type Permission = {
  [R in Role]: {
    [T in ResourceType]?: ResourcePermissions<T>;
  };
};

const ItemOWNChecker = <P extends keyof ResourceDataTypeMap["ITEM"]>(
  user: User,
  resource: ResourceDataTypeMap["ITEM"][P]
): boolean => {
  if (!user || !resource) return false;
  return user.id === resource.userId;
};

const permissions: Permission = {
  USER: {
    ITEM: {
      VIEW: true,
      CREATE: true,
      UPDATE: false,
      DELETE: false,
      "UPDATE:OWN": ItemOWNChecker,
      "DELETE:OWN": ItemOWNChecker,
    },
    CATEGORY: {
      VIEW: true,
      CREATE: true,
      UPDATE: false,
      DELETE: false,
    },
  },
  ADMIN: {
    ITEM: {
      VIEW: true,
      CREATE: true,
      UPDATE: true,
      DELETE: true,
    },
    CATEGORY: {
      VIEW: true,
      CREATE: true,
      UPDATE: true,
      DELETE: true,
    },
  },
  BLOCKED: {},
};

function hasPermission<T extends ResourceType, P extends PermissionType>(
  user: User,
  resource: T,
  permission: P,
  ...args: GetResourceData<T, P> extends undefined
    ? []
    : [resourceData: GetResourceData<T, P>]
): boolean {
  if (!user?.role) return false;

  const rolePermissions = permissions[user.role as Role];
  if (!rolePermissions?.[resource]) return false;

  const resourcePermissions = rolePermissions[resource];
  if (!resourcePermissions) return false;

  const permissionCheck = resourcePermissions[permission];
  if (!permissionCheck) return false;

  if (typeof permissionCheck === "function") {
    const resourceData = args[0];
    if (resourceData === undefined) return false;
    return permissionCheck(user, resourceData);
  }

  return true;
}

export { hasPermission };
export type { PermissionType, ResourceDataTypeMap, ResourceType, Role };
