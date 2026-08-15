import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithInterceptor } from "@/lib/store/baseQuery";
import { normalizeAuthUser, type AuthUser, type Permission } from "@/lib/rbac";

export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  errors: unknown;
  meta: unknown;
};

export type AuthRbac = {
  role: string;
  roleId: string;
  permissions: Permission[];
};

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQueryWithInterceptor,
  tagTypes: ["AuthMe"],
  endpoints: (builder) => ({
    getMe: builder.query<ApiEnvelope<AuthUser>, void>({
      query: () => ({
        url: "/auth/me",
        method: "GET",
      }),
      extraOptions: { skipErrorToast: true },
      transformResponse: (response: ApiEnvelope<AuthUser | null>) => ({
        ...response,
        data: normalizeAuthUser(response.data) as AuthUser,
      }),
      providesTags: ["AuthMe"],
    }),
    getRbac: builder.query<ApiEnvelope<AuthRbac>, void>({
      query: () => ({
        url: "/auth/rbac",
        method: "GET",
      }),
      extraOptions: { skipErrorToast: true },
      providesTags: ["AuthMe"],
    }),
  }),
});

export const { useGetMeQuery, useLazyGetMeQuery, useGetRbacQuery } = authApi;
