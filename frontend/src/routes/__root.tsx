///<reference types="@rsbuild/core/types" />
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { AppLayout } from "../components";
import { Toaster } from "react-hot-toast";

const queryClient = new QueryClient();

const RootLayout = () => (
	<QueryClientProvider client={queryClient}>
		<AppLayout>
			<Outlet />
		</AppLayout>
		<Toaster
			position="bottom-right"
			reverseOrder={false}
			toastOptions={{
				// Applying your app's specific design tokens
				className: "font-['Figtree',sans-serif] text-sm font-medium",
				style: {
					borderRadius: "13px",
					background: "#fff",
					color: "#000",
					border: "1px solid #202020",
					boxShadow: "0px 4px 20px 0px rgba(0,0,0,0.25)",
					padding: "12px 20px",
                    maxWidth: "350px",
				},
                // Custom success/error icons colors to match your theme
                success: {
                    iconTheme: {
                        primary: '#738f17',
                        secondary: '#fff',
                    },
                },
                error: {
                    iconTheme: {
                        primary: '#a22121',
                        secondary: '#fff',
                    },
                },
			}}
		/>
		<TanStackRouterDevtools />
	</QueryClientProvider>
);

export const Route = createRootRoute({
	component: RootLayout,
});
