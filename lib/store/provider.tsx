"use client";

import { useRef } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { AdminMuiProvider } from "@/components/admin/mui-provider";
import { AppSnackbar } from "@/components/admin/app-snackbar";
import { CartBootstrap, StoreToast } from "@/components/store-toast";
import { makeStore, type AppStore } from "@/lib/store";

/** Redux + persist — used once at the root layout. */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<{
    store: AppStore;
    persistor: ReturnType<typeof makeStore>["persistor"];
  } | null>(null);

  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  return (
    <Provider store={storeRef.current.store}>
      <PersistGate loading={null} persistor={storeRef.current.persistor}>
        <CartBootstrap />
        <StoreToast />
        {children}
      </PersistGate>
    </Provider>
  );
}

/** Admin chrome on top of the root StoreProvider. */
export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <AdminMuiProvider>
      {children}
      <AppSnackbar />
    </AdminMuiProvider>
  );
}
