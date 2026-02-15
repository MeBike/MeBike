"use client"
import { QueryClientProvider } from "@tanstack/react-query"
import {getQueryClient} from "./get-query-client"
import { Toaster } from "@/components/ui/sonner"

export default function Providers({children} : {children: React.ReactNode}) {
    const queryClient = getQueryClient();
    return (
        <QueryClientProvider client={queryClient}>
            {children}
            <Toaster richColors expand />
        </QueryClientProvider>
    )
}