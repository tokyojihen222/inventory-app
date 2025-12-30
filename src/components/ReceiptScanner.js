'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './ReceiptScanner.module.css';
import ReceiptReviewModal from './ReceiptReviewModal';
import { rubyImages } from '@/assets/rubyImages';



export default function ReceiptScanner({ onScanComplete }) {
    const [isScanning, setIsScanning] = useState(false);
    const [showReview, setShowReview] = useState(false);
    const [showPrepModal, setShowPrepModal] = useState(false); // Controls the prep/processing modal
    const [scannedItems, setScannedItems] = useState([]);
    const [errorMsg, setErrorMsg] = useState('');
    const fileInputRef = useRef(null);

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

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

        // Start scanning state (modal remains open but changes content)
        setIsScanning(true);
        setErrorMsg('');

        try {
            const resizedBlob = await resizeImage(file);
            const formData = new FormData();
            formData.append('file', resizedBlob, 'receipt.jpg');

            const response = await fetch('/api/scan-receipt', {
                method: 'POST',
                body: formData,
            });

            const text = await response.text();
            let result;

            try {
                result = JSON.parse(text);
            } catch (e) {
                const errorMessage = text.substring(0, 100);
                throw new Error(`Server Error: ${errorMessage}`);
            }

            if (result.success) {
                setScannedItems(result.items);
                // Transitions
                setShowPrepModal(false); // Close prep modal
                setShowReview(true); // Open review modal
            } else {
                throw new Error(result.error || 'スキャンに失敗しました');
            }
        } catch (error) {
            console.error(error);
            setErrorMsg('エラー: ' + error.message);
            // Keep prep modal open to show error
        } finally {
            setIsScanning(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleFabClick = () => {
        setShowPrepModal(true);
        setErrorMsg('');
    };

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    // Portal helper to safely render to body
    const Portal = ({ children }) => {
        if (!mounted) return null;
        return createPortal(children, document.body);
    };

    return (
        <>
            {/* 1. Scan Button (Header placement) */}
            <button
                className={styles.scanBtn}
                onClick={handleFabClick}
                title="レシートをスキャン"
            >
                <span className={styles.icon}>📷</span>
                レシート読取
            </button>

            {/* 2. Preparation / Processing Modal - Rendered via Portal */}
            {showPrepModal && (
                <Portal>
                    <div className={styles.overlay} onClick={() => !isScanning && setShowPrepModal(false)}>
                        <div className={`${styles.modal} ${isScanning ? styles.processing : ''}`} onClick={e => e.stopPropagation()}>
                            {!isScanning && (
                                <button className={styles.closeBtn} onClick={() => setShowPrepModal(false)}>×</button>
                            )}

                            <div className={styles.scanIcon}>
                                {isScanning ? (
                                    <img src={rubyImages['06']} alt="Scanning..." style={{ width: '120px', height: 'auto', animation: 'bounce 1s infinite alternate', mixBlendMode: 'multiply' }} />
                                ) : (
                                    <span style={{ fontSize: '4rem' }}>📷</span>
                                )}
                            </div>

                            {isScanning ? (
                                <>
                                    <div className={styles.processingText}>レシート解析中...</div>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                        取り込み中...
                                    </p>
                                    <div className={styles.progressBar}>
                                        <div className={styles.progressFill}></div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>レシートを追加</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        写真をとるか、ライブラリから選択してください
                                    </p>

                                    {errorMsg && (
                                        <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', borderRadius: '8px', fontSize: '0.9rem' }}>
                                            {errorMsg}
                                        </div>
                                    )}

                                    <div className={styles.btnGroup}>
                                        <button className={styles.actionBtn} onClick={triggerFileSelect}>
                                            <span>📂</span> 画像を選択 / カメラ起動
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </Portal>
            )}

            {/* Hidden Input */}
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleFileChange}
            />

            {/* 3. Review Modal - Rendered via Portal */}
            {showReview && (
                <Portal>
                    <ReceiptReviewModal
                        isOpen={showReview}
                        onClose={() => setShowReview(false)}
                        scannedItems={scannedItems}
                    />
                </Portal>
            )}
        </>
    );
}
