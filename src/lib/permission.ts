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

type Permission = {
  [key in Role]: {
    [key in ResourceType]?: {
      [key in PermissionType]?:
        | boolean
        | ((user: User, resource?: unknown) => boolean);
    };
  };
};

const ItemOWNChecker = (user: User, resource?: unknown): boolean => {
  if (!user || !resource) return false;

  const item = resource as ItemType;
  return user.id === item.userId;
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

export const hasPermission = (
  user: User,
  resource: ResourceType,
  permission: PermissionType,
  resourceData?: unknown
): boolean => {
  if (!user || !user.role) return false;

  const rolePermissions = permissions[user.role as Role];
  if (!rolePermissions || !rolePermissions[resource]) return false;

  const resourcePermissions = rolePermissions[resource];
  if (!resourcePermissions) return false;
  const permissionCheck = resourcePermissions[permission];
  if (typeof permissionCheck === "function") {
    return permissionCheck(user, resourceData);
  }
  return !!permissionCheck;
};
