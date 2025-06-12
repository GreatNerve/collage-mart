import { ValidRoles } from "@/constant/common";
import {
  type CategoryType,
  type ItemType,
  type RoleType,
} from "@/types/common";
import { User } from "next-auth";

type Role = RoleType;

type PermissionType =
  | "VIEW"
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "VIEW:OWN"
  | "UPDATE:OWN"
  | "DELETE:OWN";

type ResourceType = "ITEM" | "CATEGORY";

type ResourceDataTypeMap = {
  ITEM: {
    "UPDATE:OWN": ItemType;
    "DELETE:OWN": ItemType;
    "VIEW:OWN": ItemType;
  };
  CATEGORY: {
    "VIEW:OWN": CategoryType;
    "UPDATE:OWN": CategoryType;
    "DELETE:OWN": CategoryType;
  };
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

export const ValidPermissions: PermissionType[] = [
  "VIEW",
  "CREATE",
  "UPDATE",
  "DELETE",
  "VIEW:OWN",
  "UPDATE:OWN",
  "DELETE:OWN",
];

export const ValidResources: ResourceType[] = ["ITEM", "CATEGORY"];

const ItemOWNChecker = <P extends keyof ResourceDataTypeMap["ITEM"]>(
  user: User,
  resource: ResourceDataTypeMap["ITEM"][P]
): boolean => {
  if (!user || !resource) return false;
  if (!resource.userId || !user.id) return false;
  return user.id === resource.userId;
};

const CategoryOWNChecker = <P extends keyof ResourceDataTypeMap["CATEGORY"]>(
  user: User,
  resource: ResourceDataTypeMap["CATEGORY"][P]
): boolean => {
  if (!user || !resource) return false;

  if (!resource.userId || !user.id) return false;
  return user.id === resource.userId;
};

const permissions: Permission = {
  USER: {
    ITEM: {
      VIEW: true,
      CREATE: true,
      "VIEW:OWN": ItemOWNChecker,
      "UPDATE:OWN": ItemOWNChecker,
      "DELETE:OWN": ItemOWNChecker,
    },
    CATEGORY: {
      VIEW: true,
      CREATE: false,
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
      "VIEW:OWN": ItemOWNChecker,
      "UPDATE:OWN": ItemOWNChecker,
      "DELETE:OWN": ItemOWNChecker,
    },
    CATEGORY: {
      VIEW: true,
      CREATE: true,
      UPDATE: true,
      DELETE: true,
      "VIEW:OWN": CategoryOWNChecker,
      "UPDATE:OWN": CategoryOWNChecker,
      "DELETE:OWN": CategoryOWNChecker,
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

  if (!Object.values(ValidRoles).includes(user.role as Role)) return false;
  if (!ValidResources.includes(resource)) return false;
  if (!ValidPermissions.includes(permission)) return false;

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
