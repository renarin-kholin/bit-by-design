///<reference types="@rsbuild/core/types" />
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
const queryClient = new QueryClient();

const RootLayout = () => (
	<QueryClientProvider client={queryClient}>
		<Outlet />
		<TanStackRouterDevtools />
	</QueryClientProvider>
);

export const Route = createRootRoute({
	component: RootLayout,
});
