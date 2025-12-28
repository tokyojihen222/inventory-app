import './globals.css';

import './globals.css';

export const metadata = {
    title: '在庫管理アプリ with Ruby',
    description: 'Simple, cute, and warm inventory management',
};

export default function RootLayout({ children }) {
    return (
        <html lang="ja">
            <body>{children}</body>
        </html>
    );
}
