'use client';

import { useState, useRef } from 'react';
import styles from './InventoryTable.module.css';

export default function ReceiptScanner({ onScanComplete }) {
    const [isScanning, setIsScanning] = useState(false);
    const fileInputRef = useRef(null);

    const resizeImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const MAX_WIDTH = 1024;
                    const MAX_HEIGHT = 1024;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        resolve(blob);
                    }, 'image/jpeg', 0.8);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsScanning(true);

        try {
            // Resize image before upload
            const resizedBlob = await resizeImage(file);

            const formData = new FormData();
            formData.append('file', resizedBlob, 'receipt.jpg');

            const response = await fetch('/api/scan-receipt', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();
            if (result.success) {
                alert(`スキャン完了: ${result.matches.length} 件の商品を更新しました。\n合計金額: ${result.total}円`);
                if (onScanComplete) onScanComplete();
            } else {
                alert('スキャンに失敗しました: ' + (result.error || '不明なエラー'));
            }
        } catch (error) {
            console.error(error);
            alert('エラーが発生しました: ' + error.message);
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
