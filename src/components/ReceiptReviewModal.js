'use client';

import { useState } from 'react';
import styles from './AddItemModal.module.css'; // Reuse modal styles
import { bulkAddItems } from '@/app/actions';

export default function ReceiptReviewModal({ isOpen, onClose, scannedItems }) {
    if (!isOpen) return null;

    const [items, setItems] = useState(scannedItems);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const handleDelete = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const handleAddRow = () => {
        setItems([...items, { name: '', category: '', quantity: 1, price: 0 }]);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await bulkAddItems(items);
            alert(`${items.length}件の商品を登録しました！`);
            onClose();
            window.location.reload();
        } catch (error) {
            console.error(error);
            alert('登録に失敗しました');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.overlay} style={{ zIndex: 1000 }}>
            <div className={styles.modal} style={{ maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                <h2 className={styles.title}>スキャン結果の確認</h2>
                <div style={{ overflowY: 'auto', flex: 1, padding: '1rem 0' }}>
                    <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--secondary)' }}>
                        AIが読み取った内容です。間違いがあれば修正し、不要なものは削除してください。
                    </p>

                    {items.map((item, index) => (
                        <div key={index} style={{
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            padding: '1rem',
                            marginBottom: '1rem',
                            display: 'flex',
                            gap: '0.5rem',
                            flexWrap: 'wrap',
                            alignItems: 'center'
                        }}>
                            <div style={{ flex: '1 1 100%' }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>商品名</label>
                                <input
                                    type="text"
                                    value={item.name}
                                    onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                                />
                            </div>
                            <div style={{ flex: '1 1 40%' }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>カテゴリ</label>
                                <input
                                    type="text"
                                    value={item.category}
                                    onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                                    list="categories"
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                                />
                            </div>
                            <div style={{ flex: '0 0 20%' }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>個数</label>
                                <input
                                    type="number"
                                    value={item.quantity}
                                    min="1"
                                    onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                                />
                            </div>
                            <button
                                onClick={() => handleDelete(index)}
                                style={{
                                    background: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    width: '30px',
                                    height: '30px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginLeft: 'auto',
                                    marginTop: '1rem' // align with inputs
                                }}
                            >
                                ✕
                            </button>
                        </div>
                    ))}

                    <button
                        onClick={handleAddRow}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px dashed var(--border)',
                            background: 'transparent',
                            color: 'var(--secondary)',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        + 行を追加
                    </button>
                </div>

                <div className={styles.actions} style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                    <button onClick={onClose} className={`${styles.btn} ${styles.btnCancel}`}>キャンセル</button>
                    <button
                        onClick={handleSubmit}
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        disabled={isSubmitting || items.length === 0}
                    >
                        {isSubmitting ? '登録中...' : '一括登録'}
                    </button>
                </div>
            </div>
        </div>
    );
}
