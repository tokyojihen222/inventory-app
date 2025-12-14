'use client';

import { useState, useRef } from 'react';
import styles from './InventoryTable.module.css';
import ReceiptReviewModal from './ReceiptReviewModal';

export default function ReceiptScanner({ onScanComplete }) {
    const [isScanning, setIsScanning] = useState(false);
    const [showReview, setShowReview] = useState(false);
    const [scannedItems, setScannedItems] = useState([]);
    const [errorMsg, setErrorMsg] = useState('');
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
        setErrorMsg(''); // Reset error

        try {
            // Resize image before upload
            const resizedBlob = await resizeImage(file);

            const formData = new FormData();
            formData.append('file', resizedBlob, 'receipt.jpg');

            const response = await fetch('/api/scan-receipt', {
                method: 'POST',
                body: formData,
            });

            let result;
            const text = await response.text();

            try {
                result = JSON.parse(text);
            } catch (e) {
                console.error('Invalid JSON response:', text);
                const errorMessage = text.includes('DOCTYPE') ? 'サーバーエラーが発生しました (500)' : text.substring(0, 100);
                throw new Error(`サーバー応答エラー: ${errorMessage}`);
            }

            if (result.success) {
                setScannedItems(result.items);
                setShowReview(true);
            } else {
                setErrorMsg('スキャン失敗: ' + (result.error || '不明なエラー'));
            }
        } catch (error) {
            console.error(error);
            setErrorMsg('エラー発生: ' + (error.message || error));
        } finally {
            setIsScanning(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
            <button
                className={`${styles.btn}`}
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                style={{ position: 'relative', overflow: 'hidden' }}
            >
                {isScanning ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className={styles.spinner}></span> 解析中...
                    </span>
                ) : '📷 レシートをスキャン'}
            </button>

            {errorMsg && (
                <div style={{ marginTop: '0.5rem' }}>
                    <p style={{ color: 'red', fontSize: '0.8rem', marginBottom: '0.2rem' }}>エラーが発生しました (コピーして共有してください):</p>
                    <textarea
                        readOnly
                        value={errorMsg}
                        style={{
                            width: '100%',
                            height: '80px',
                            fontSize: '0.8rem',
                            padding: '0.5rem',
                            borderRadius: '4px',
                            border: '1px solid #ccc',
                            backgroundColor: '#fff',
                            color: '#333'
                        }}
                    />
                </div>
            )}

            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*" // Allow selection of any image file
                capture="environment" // Hint to open rear camera on mobile
                onChange={handleFileChange}
            />

            <ReceiptReviewModal
                isOpen={showReview}
                onClose={() => setShowReview(false)}
                scannedItems={scannedItems}
            />
        </div>
    );
}
