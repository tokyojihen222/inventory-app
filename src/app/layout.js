import './globals.css';
import { Inter, Outfit } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata = {
    title: 'Cosmic Inventory',
    description: 'Manage your household inventory with neko-tech style',
};

export default function RootLayout({ children }) {
    return (
        <html lang="ja">
            <body className={`${inter.variable} ${outfit.variable}`}>{children}</body>
        </html>
    );
}
