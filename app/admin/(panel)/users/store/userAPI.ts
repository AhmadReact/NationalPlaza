import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithInterceptor } from "@/lib/store/baseQuery";
import {
  normalizePermissions,
  type Permission,
  type UserStatus,
} from "@/lib/rbac";

export type AdminUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatar: string | null;
  role: string;
  roleId: string;
  roleName: string;
  rolePermissions: Permission[];
  extraPermissions: Permission[];
  permissions: Permission[];
  status: UserStatus | string;
  isEmailVerified: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UserListParams = {
  page?: number;
  limit?: number;
  search?: string;
  roleId?: string;
  role?: string;
  status?: UserStatus | "";
};

export type CreateUserInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  avatar?: string;
  roleId?: string;
  status?: UserStatus;
  extraPermissions?: Permission[];
};

export type UpdateUserInput = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  phone?: string | null;
  avatar?: string | null;
  roleId?: string;
  status?: UserStatus;
  extraPermissions?: Permission[];
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type ApiListResponse<T> = {
  success: boolean;
  message: string;
  data: T[];
  errors: unknown;
  meta: PaginationMeta;
};

export type ApiMutationResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  errors: unknown;
  meta: unknown;
};

function toQueryString(params: UserListParams): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function normalizeUser(user: AdminUser): AdminUser {
  return {
    ...user,
    rolePermissions: normalizePermissions(user.rolePermissions),
    extraPermissions: normalizePermissions(user.extraPermissions),
    permissions: normalizePermissions(user.permissions),
  };
}

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: baseQueryWithInterceptor,
  tagTypes: ["User"],
  endpoints: (builder) => ({
    getUsers: builder.query<ApiListResponse<AdminUser>, UserListParams | void>({
      query: (params) => ({
        url: `/users${toQueryString({
          page: params?.page ?? 1,
          limit: params?.limit ?? 20,
          search: params?.search,
          roleId: params?.roleId,
          role: params?.role,
          status: params?.status,
        })}`,
        method: "GET",
      }),
      transformResponse: (response: ApiListResponse<AdminUser>) => ({
        ...response,
        data: (response.data ?? []).map(normalizeUser),
      }),
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map(({ id }) => ({ type: "User" as const, id })),
              { type: "User", id: "LIST" },
            ]
          : [{ type: "User", id: "LIST" }],
    }),
    getUserById: builder.query<ApiMutationResponse<AdminUser>, string>({
      query: (id) => ({
        url: `/users/${encodeURIComponent(id)}`,
        method: "GET",
      }),
      transformResponse: (response: ApiMutationResponse<AdminUser>) => ({
        ...response,
        data: normalizeUser(response.data),
      }),
      providesTags: (_result, _error, id) => [{ type: "User", id }],
    }),
    createUser: builder.mutation<ApiMutationResponse<AdminUser>, CreateUserInput>({
      query: (body) => ({
        url: "/users",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "User", id: "LIST" }],
    }),
    updateUser: builder.mutation<ApiMutationResponse<AdminUser>, UpdateUserInput>({
      query: ({ id, ...body }) => ({
        url: `/users/${encodeURIComponent(id)}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "User", id },
        { type: "User", id: "LIST" },
      ],
    }),
    setUserExtraPermissions: builder.mutation<
      ApiMutationResponse<AdminUser>,
      { id: string; permissions: Permission[] }
    >({
      query: ({ id, permissions }) => ({
        url: `/users/${encodeURIComponent(id)}/extra-permissions`,
        method: "PUT",
        body: { permissions },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "User", id },
        { type: "User", id: "LIST" },
      ],
    }),
    deleteUser: builder.mutation<ApiMutationResponse<null>, string>({
      query: (id) => ({
        url: `/users/${encodeURIComponent(id)}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "User", id },
        { type: "User", id: "LIST" },
      ],
    }),
    restoreUser: builder.mutation<ApiMutationResponse<AdminUser>, string>({
      query: (id) => ({
        url: `/users/${encodeURIComponent(id)}/restore`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "User", id },
        { type: "User", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useLazyGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useSetUserExtraPermissionsMutation,
  useDeleteUserMutation,
  useRestoreUserMutation,
} = userApi;
