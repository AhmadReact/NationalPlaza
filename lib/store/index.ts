import { combineReducers, configureStore } from "@reduxjs/toolkit";
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
} from "redux-persist";
import createWebStorage from "redux-persist/lib/storage/createWebStorage";
import { authReducer } from "@/app/admin/login/store/authSlice";
import { authApi } from "@/app/admin/login/store/authAPI";
import { brandApi } from "@/app/admin/(panel)/brands/store/brandAPI";
import { categoryApi } from "@/app/admin/(panel)/categories/store/categoryAPI";
import { orderApi } from "@/app/admin/(panel)/orders/store/orderAPI";
import { roleApi } from "@/app/admin/(panel)/roles/store/roleAPI";
import { userApi } from "@/app/admin/(panel)/users/store/userAPI";
import { emailApi } from "@/app/admin/(panel)/email/store/emailAPI";
import { whatsappApi } from "@/app/admin/(panel)/whatsapp/store/whatsappAPI";
import { productApi } from "@/app/admin/(panel)/products/store/productAPI";
import { bannerApi } from "@/app/admin/(panel)/banners/store/bannerAPI";
import { homeSectionApi } from "@/app/admin/(panel)/home/store/homeSectionAPI";
import { dashboardApi } from "@/app/admin/(panel)/store/dashboardAPI";
import { deliveryApi } from "@/app/admin/(panel)/delivery-methods/store/deliveryAPI";
import { accountApi } from "@/app/store/accountAPI";
import { customerApi } from "@/app/store/customerAPI";
import { cartApi } from "@/app/store/cartAPI";
import { cartReducer } from "@/app/store/cartSlice";
import { checkoutApi } from "@/app/store/checkoutAPI";
import { customerAuthReducer } from "@/app/store/customerAuthSlice";
import { snackbarReducer } from "@/lib/store/snackbarSlice";

function createNoopStorage() {
  return {
    getItem(_key: string) {
      return Promise.resolve(null);
    },
    setItem(_key: string, value: unknown) {
      return Promise.resolve(value);
    },
    removeItem(_key: string) {
      return Promise.resolve();
    },
  };
}

const storage =
  typeof window !== "undefined"
    ? createWebStorage("local")
    : createNoopStorage();

const rootReducer = combineReducers({
  auth: authReducer,
  customerAuth: customerAuthReducer,
  snackbar: snackbarReducer,
  cart: cartReducer,
  [authApi.reducerPath]: authApi.reducer,
  [roleApi.reducerPath]: roleApi.reducer,
  [userApi.reducerPath]: userApi.reducer,
  [brandApi.reducerPath]: brandApi.reducer,
  [categoryApi.reducerPath]: categoryApi.reducer,
  [orderApi.reducerPath]: orderApi.reducer,
  [whatsappApi.reducerPath]: whatsappApi.reducer,
  [emailApi.reducerPath]: emailApi.reducer,
  [productApi.reducerPath]: productApi.reducer,
  [bannerApi.reducerPath]: bannerApi.reducer,
  [homeSectionApi.reducerPath]: homeSectionApi.reducer,
  [dashboardApi.reducerPath]: dashboardApi.reducer,
  [deliveryApi.reducerPath]: deliveryApi.reducer,
  [customerApi.reducerPath]: customerApi.reducer,
  [accountApi.reducerPath]: accountApi.reducer,
  [cartApi.reducerPath]: cartApi.reducer,
  [checkoutApi.reducerPath]: checkoutApi.reducer,
});

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth", "customerAuth"],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const makeStore = () => {
  const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }).concat(
        authApi.middleware,
        roleApi.middleware,
        userApi.middleware,
        brandApi.middleware,
        categoryApi.middleware,
        orderApi.middleware,
        whatsappApi.middleware,
        emailApi.middleware,
        productApi.middleware,
        bannerApi.middleware,
        homeSectionApi.middleware,
        dashboardApi.middleware,
        deliveryApi.middleware,
        customerApi.middleware,
        accountApi.middleware,
        cartApi.middleware,
        checkoutApi.middleware,
      ),
  });

  const persistor = persistStore(store);
  return { store, persistor };
};

export type AppStore = ReturnType<typeof makeStore>["store"];
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
