import type { Metadata } from "next";
import "./globals.css";
import "./extras.css";
import { ServiceWorker } from "@/components/service-worker";
export const metadata:Metadata={title:"Watchtower",description:"Personal AI operating system",manifest:"/manifest.webmanifest"};
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}<ServiceWorker/></body></html>; }
