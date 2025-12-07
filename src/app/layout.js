import './globals.css';

export const metadata = {
    title: 'Household Inventory',
    description: 'Manage your household inventory',
};

export default function RootLayout({ children }) {
    return (
        <html lang="ja">
            <body>{children}</body>
        </html>
    );
}
