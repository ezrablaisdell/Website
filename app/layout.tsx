import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Ezra Blaisdell — A place to start',
  description: 'The personal website of Ezra Blaisdell. A first project and a place for what comes next.',
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

