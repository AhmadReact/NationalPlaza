import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithInterceptor } from "@/lib/store/baseQuery";
import { normalizePermissions, type Permission } from "@/lib/rbac";

export type Role = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isDefault: boolean;
  permissions: Permission[];
  userCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateRoleInput = {
  name: string;
  slug?: string;
  description?: string;
  permissions: Permission[];
};

export type UpdateRoleInput = {
  id: string;
  name?: string;
  slug?: string;
  description?: string | null;
  permissions?: Permission[];
};

export type ApiListResponse<T> = {
  success: boolean;
  message: string;
  data: T[];
  errors: unknown;
  meta: unknown;
};

export type ApiMutationResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  errors: unknown;
  meta: unknown;
};

function normalizeRole(role: Role): Role {
  return {
    ...role,
    permissions: normalizePermissions(role.permissions),
  };
}

export const roleApi = createApi({
  reducerPath: "roleApi",
  baseQuery: baseQueryWithInterceptor,
  tagTypes: ["Role", "PermissionCatalog"],
  endpoints: (builder) => ({
    getPermissions: builder.query<ApiMutationResponse<Permission[]>, void>({
      query: () => ({
        url: "/permissions",
        method: "GET",
      }),
      transformResponse: (response: ApiMutationResponse<Permission[]>) => ({
        ...response,
        data: normalizePermissions(response.data),
      }),
      providesTags: ["PermissionCatalog"],
    }),
    getRoles: builder.query<ApiListResponse<Role>, void>({
      query: () => ({
        url: "/roles",
        method: "GET",
      }),
      transformResponse: (response: ApiListResponse<Role>) => ({
        ...response,
        data: (response.data ?? []).map(normalizeRole),
      }),
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map(({ id }) => ({ type: "Role" as const, id })),
              { type: "Role", id: "LIST" },
            ]
          : [{ type: "Role", id: "LIST" }],
    }),
    getRoleById: builder.query<ApiMutationResponse<Role>, string>({
      query: (id) => ({
        url: `/roles/${encodeURIComponent(id)}`,
        method: "GET",
      }),
      transformResponse: (response: ApiMutationResponse<Role>) => ({
        ...response,
        data: normalizeRole(response.data),
      }),
      providesTags: (_result, _error, id) => [{ type: "Role", id }],
    }),
    createRole: builder.mutation<ApiMutationResponse<Role>, CreateRoleInput>({
      query: (body) => ({
        url: "/roles",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Role", id: "LIST" }],
    }),
    updateRole: builder.mutation<ApiMutationResponse<Role>, UpdateRoleInput>({
      query: ({ id, ...body }) => ({
        url: `/roles/${encodeURIComponent(id)}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Role", id },
        { type: "Role", id: "LIST" },
      ],
    }),
    deleteRole: builder.mutation<ApiMutationResponse<null>, string>({
      query: (id) => ({
        url: `/roles/${encodeURIComponent(id)}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Role", id },
        { type: "Role", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetPermissionsQuery,
  useGetRolesQuery,
  useGetRoleByIdQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
} = roleApi;
