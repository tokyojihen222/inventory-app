import './globals.css';



export const metadata = {
    title: 'うしねこの蔵',
    description: 'Simple, cute, and warm inventory management',
};

export default function RootLayout({ children }) {
    return (
        <html lang="ja">
            <body>{children}</body>
        </html>
    );
}
