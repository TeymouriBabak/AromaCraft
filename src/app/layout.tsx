import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import ClientLayout from './ClientLayout';
import { AuthProvider } from '@/components/auth-context';
import { CartProvider } from '@/components/cart-context';
import { WishlistProvider } from '@/components/wishlist-context';
import { ThemeProvider } from 'next-themes';

const cardo = localFont({
  src: [
    { path: '../fonts/Cardo-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../fonts/Cardo-Italic.ttf', weight: '400', style: 'italic' },
    { path: '../fonts/Cardo-Bold.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-cardo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AromaCraft | Premium Coffee E-commerce',
  description:
    'A state-of-the-art premium coffee experience with curated roasts, subscriptions, and a guided discovery quiz.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${cardo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f9f6f0] text-[#1a0f0a] dark:bg-[#140907] dark:text-[#f6e5d1]">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <ClientLayout>{children}</ClientLayout>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
