import { createAsyncThunk } from "@reduxjs/toolkit";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { cartApi, type Cart } from "@/app/store/cartAPI";
import {
  clearGuestToken,
  getGuestToken,
  setGuestToken,
} from "@/lib/cart/guestToken";
import { getFetchErrorMessage } from "@/lib/api/errorMessage";
import { toast } from "@/lib/store/snackbarSlice";

export type AddToCartArgs = {
  productId: string;
  quantity?: number;
  silentSuccess?: boolean;
};

export type UpdateCartItemArgs = {
  productId: string;
  quantity: number;
};

export type RemoveCartItemArgs = {
  productId: string;
};

type CustomerAuthAwareState = {
  customerAuth: { accessToken: string | null };
};

function getCustomerToken(getState: () => unknown): string | null {
  return (getState() as CustomerAuthAwareState).customerAuth?.accessToken ?? null;
}

function getErrorStatus(error: unknown): number | string | undefined {
  if (error && typeof error === "object" && "status" in error) {
    return (error as FetchBaseQueryError).status;
  }
  return undefined;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return getFetchErrorMessage(
    error as { status?: number | string; data?: unknown; error?: string },
    fallback,
  );
}

type AppThunkDispatch = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (action: any): any;
};

async function ensureGuestToken(dispatch: AppThunkDispatch): Promise<string> {
  const existing = getGuestToken();
  if (existing) return existing;

  const created = await dispatch(
    cartApi.endpoints.createGuestCart.initiate(),
  ).unwrap();

  const token = created.data?.guestToken;
  if (!token) {
    throw new Error("Guest cart did not return a guestToken.");
  }

  setGuestToken(token);
  return token;
}

async function addGuestItem(
  dispatch: AppThunkDispatch,
  productId: string,
  quantity: number,
): Promise<Cart> {
  let guestToken = await ensureGuestToken(dispatch);

  let result = await dispatch(
    cartApi.endpoints.addGuestCartItem.initiate({
      guestToken,
      productId,
      quantity,
    }),
  );

  if (result.error && getErrorStatus(result.error) === 404) {
    clearGuestToken();
    guestToken = await ensureGuestToken(dispatch);
    result = await dispatch(
      cartApi.endpoints.addGuestCartItem.initiate({
        guestToken,
        productId,
        quantity,
      }),
    );
  }

  if (result.error) {
    throw new Error(getErrorMessage(result.error, "Failed to add to cart."));
  }

  return result.data!.data;
}

export const addToCart = createAsyncThunk<
  Cart,
  AddToCartArgs,
  { rejectValue: string }
>(
  "cart/addToCart",
  async (
    { productId, quantity = 1, silentSuccess = false },
    { getState, dispatch, rejectWithValue },
  ) => {
    const accessToken = getCustomerToken(getState);

    try {
      if (accessToken) {
        const result = await dispatch(
          cartApi.endpoints.addCustomerCartItem.initiate({
            productId,
            quantity,
          }),
        );

        if (!result.error && result.data?.data) {
          if (!silentSuccess) {
            dispatch(toast.success("Added to cart"));
          }
          return result.data.data;
        }

        if (getErrorStatus(result.error) !== 401) {
          const message = getErrorMessage(
            result.error,
            "Failed to add to cart.",
          );
          dispatch(toast.error(message));
          return rejectWithValue(message);
        }
      }

      const cart = await addGuestItem(dispatch, productId, quantity);
      if (!silentSuccess) {
        dispatch(toast.success("Added to cart"));
      }
      return cart;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : getErrorMessage(error, "Failed to add to cart.");
      dispatch(toast.error(message));
      return rejectWithValue(message);
    }
  },
);

export const loadCart = createAsyncThunk<
  Cart | null,
  void,
  { rejectValue: string }
>("cart/loadCart", async (_, { getState, dispatch, rejectWithValue }) => {
  const accessToken = getCustomerToken(getState);

  try {
    if (accessToken) {
      const result = await dispatch(
        cartApi.endpoints.getCustomerCart.initiate(undefined, {
          forceRefetch: true,
        }),
      );

      if (!result.error && result.data?.data) {
        return result.data.data;
      }

      if (getErrorStatus(result.error) !== 401) {
        return rejectWithValue(
          getErrorMessage(result.error, "Failed to load cart."),
        );
      }
    }

    const guestToken = getGuestToken();
    if (!guestToken) return null;

    const result = await dispatch(
      cartApi.endpoints.getGuestCart.initiate(guestToken, {
        forceRefetch: true,
      }),
    );

    if (result.error) {
      if (getErrorStatus(result.error) === 404) {
        clearGuestToken();
        return null;
      }
      return rejectWithValue(
        getErrorMessage(result.error, "Failed to load cart."),
      );
    }

    return result.data?.data ?? null;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to load cart.",
    );
  }
});

export const updateCartItem = createAsyncThunk<
  Cart,
  UpdateCartItemArgs,
  { rejectValue: string }
>(
  "cart/updateCartItem",
  async ({ productId, quantity }, { getState, dispatch, rejectWithValue }) => {
    const accessToken = getCustomerToken(getState);

    try {
      if (accessToken) {
        const result = await dispatch(
          cartApi.endpoints.updateCustomerCartItem.initiate({
            productId,
            quantity,
          }),
        );
        if (result.error) {
          const message = getErrorMessage(
            result.error,
            "Failed to update cart.",
          );
          dispatch(toast.error(message));
          return rejectWithValue(message);
        }
        return result.data!.data;
      }

      const guestToken = getGuestToken();
      if (!guestToken) {
        return rejectWithValue("No guest cart found.");
      }

      const result = await dispatch(
        cartApi.endpoints.updateGuestCartItem.initiate({
          guestToken,
          productId,
          quantity,
        }),
      );

      if (result.error && getErrorStatus(result.error) === 404) {
        clearGuestToken();
        return rejectWithValue("Guest cart expired. Please add items again.");
      }

      if (result.error) {
        const message = getErrorMessage(result.error, "Failed to update cart.");
        dispatch(toast.error(message));
        return rejectWithValue(message);
      }

      return result.data!.data;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : getErrorMessage(error, "Failed to update cart.");
      dispatch(toast.error(message));
      return rejectWithValue(message);
    }
  },
);

export const removeCartItem = createAsyncThunk<
  Cart,
  RemoveCartItemArgs,
  { rejectValue: string }
>(
  "cart/removeCartItem",
  async ({ productId }, { getState, dispatch, rejectWithValue }) => {
    const accessToken = getCustomerToken(getState);

    try {
      if (accessToken) {
        const result = await dispatch(
          cartApi.endpoints.removeCustomerCartItem.initiate(productId),
        );
        if (result.error) {
          const message = getErrorMessage(
            result.error,
            "Failed to remove item.",
          );
          dispatch(toast.error(message));
          return rejectWithValue(message);
        }
        return result.data!.data;
      }

      const guestToken = getGuestToken();
      if (!guestToken) {
        return rejectWithValue("No guest cart found.");
      }

      const result = await dispatch(
        cartApi.endpoints.removeGuestCartItem.initiate({
          guestToken,
          productId,
        }),
      );

      if (result.error) {
        const message = getErrorMessage(result.error, "Failed to remove item.");
        dispatch(toast.error(message));
        return rejectWithValue(message);
      }

      return result.data!.data;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : getErrorMessage(error, "Failed to remove item.");
      dispatch(toast.error(message));
      return rejectWithValue(message);
    }
  },
);

export const clearCart = createAsyncThunk<
  Cart | null,
  void,
  { rejectValue: string }
>("cart/clearCart", async (_, { getState, dispatch, rejectWithValue }) => {
  const accessToken = getCustomerToken(getState);

  try {
    if (accessToken) {
      const result = await dispatch(
        cartApi.endpoints.clearCustomerCart.initiate(),
      );
      if (result.error) {
        const message = getErrorMessage(result.error, "Failed to clear cart.");
        dispatch(toast.error(message));
        return rejectWithValue(message);
      }
      return result.data?.data ?? null;
    }

    const guestToken = getGuestToken();
    if (!guestToken) return null;

    const result = await dispatch(
      cartApi.endpoints.clearGuestCart.initiate({ guestToken }),
    );

    if (result.error) {
      const message = getErrorMessage(result.error, "Failed to clear cart.");
      dispatch(toast.error(message));
      return rejectWithValue(message);
    }

    clearGuestToken();
    return result.data?.data ?? null;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : getErrorMessage(error, "Failed to clear cart.");
    dispatch(toast.error(message));
    return rejectWithValue(message);
  }
});
