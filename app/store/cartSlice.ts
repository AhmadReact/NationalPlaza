import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Cart } from "@/app/store/cartAPI";
import {
  addToCart,
  clearCart,
  loadCart,
  removeCartItem,
  updateCartItem,
} from "@/app/store/cartThunk";

export type CartState = {
  cart: Cart | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
};

const initialState: CartState = {
  cart: null,
  status: "idle",
  error: null,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setCart(state, action: PayloadAction<Cart | null>) {
      state.cart = action.payload;
      state.status = "succeeded";
      state.error = null;
    },
    clearCartState(state) {
      state.cart = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const pending = (state: CartState) => {
      state.status = "loading";
      state.error = null;
    };
    const rejected =
      (fallback: string) =>
      (state: CartState, action: { payload: string | undefined }) => {
        state.status = "failed";
        state.error = action.payload ?? fallback;
      };

    builder
      .addCase(addToCart.pending, pending)
      .addCase(addToCart.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.cart = action.payload;
        state.error = null;
      })
      .addCase(addToCart.rejected, rejected("Failed to add to cart."))
      .addCase(loadCart.pending, pending)
      .addCase(loadCart.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.cart = action.payload;
        state.error = null;
      })
      .addCase(loadCart.rejected, rejected("Failed to load cart."))
      .addCase(updateCartItem.pending, pending)
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.cart = action.payload;
        state.error = null;
      })
      .addCase(updateCartItem.rejected, rejected("Failed to update cart."))
      .addCase(removeCartItem.pending, pending)
      .addCase(removeCartItem.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.cart = action.payload;
        state.error = null;
      })
      .addCase(removeCartItem.rejected, rejected("Failed to remove item."))
      .addCase(clearCart.pending, pending)
      .addCase(clearCart.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.cart = action.payload;
        state.error = null;
      })
      .addCase(clearCart.rejected, rejected("Failed to clear cart."));
  },
});

export const { setCart, clearCartState } = cartSlice.actions;
export const cartReducer = cartSlice.reducer;

export const selectCart = (state: { cart: CartState }) => state.cart.cart;
export const selectCartItemCount = (state: { cart: CartState }) =>
  state.cart.cart?.itemCount ?? 0;
export const selectCartStatus = (state: { cart: CartState }) =>
  state.cart.status;
