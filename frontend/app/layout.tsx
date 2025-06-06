import "./globals.css";
import { Inter } from "next/font/google";
import Providers from "./provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "LinkWeaver Graph App",
  description:
    "A graph visualization frontend powered by Dgraph + Cytoscape.js",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main>
          <Providers>
            {children}
          </Providers>
        </main>
      </body>
    </html >
  );
}
