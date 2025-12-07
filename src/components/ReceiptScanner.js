'use client';

import { useState, useRef } from 'react';
import styles from './InventoryTable.module.css'; // Reuse styles

export default function ReceiptScanner({ onScanComplete }) {
    const [isScanning, setIsScanning] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsScanning(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/scan-receipt', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();
            if (result.success) {
                alert(`スキャン完了: ${result.matches.length} 件の商品を更新しました。\n合計金額: ${result.total}円`);
                if (onScanComplete) onScanComplete();
            } else {
                alert('スキャンに失敗しました: ' + result.error);
            }
        } catch (error) {
            console.error(error);
            alert('エラーが発生しました');
        } finally {
            setIsScanning(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <>
            <button
                className={`${styles.btn}`}
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
            >
                {isScanning ? 'スキャン中...' : '📷 レシートをスキャン'}
            </button>
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleFileChange}
            />
        </>
    );
}
