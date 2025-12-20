'use client';

import { useState, useEffect } from 'react';
import styles from './ReceiptReviewModal.module.css'; // Reuse modal styles
import { bulkAddItems } from '@/app/actions';

export default function ReceiptReviewModal({ isOpen, onClose, scannedItems }) {
    if (!isOpen) return null;

    const [items, setItems] = useState([]);
    const [excludedItems, setExcludedItems] = useState([]);
    const [activeTab, setActiveTab] = useState('register'); // 'register' or 'exclude'
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Initial separation based on is_fresh flag if available
        const register = [];
        const exclude = [];
        (scannedItems || []).forEach(item => {
            if (item.is_fresh) {
                exclude.push({ ...item, unit: '個', price: item.price || 0 });
            } else {
                register.push({ ...item, unit: '個', price: item.price || 0 });
            }
        });
        setItems(register);
        setExcludedItems(exclude);
    }, [scannedItems]);

    const handleItemChange = (listType, index, field, value) => {
        const targetList = listType === 'register' ? items : excludedItems;
        const setTargetList = listType === 'register' ? setItems : setExcludedItems;

        const newItems = [...targetList];
        newItems[index] = { ...newItems[index], [field]: value };
        setTargetList(newItems);
    };

    const handleDelete = (listType, index) => {
        const targetList = listType === 'register' ? items : excludedItems;
        const setTargetList = listType === 'register' ? setItems : setExcludedItems;

        const newItems = targetList.filter((_, i) => i !== index);
        setTargetList(newItems);
    };

    const handleMove = (listType, index) => {
        const sourceList = listType === 'register' ? items : excludedItems;
        const setSourceList = listType === 'register' ? setItems : setExcludedItems;
        const destList = listType === 'register' ? excludedItems : items;
        const setDestList = listType === 'register' ? setExcludedItems : setItems;

        const itemToMove = sourceList[index];
        setSourceList(sourceList.filter((_, i) => i !== index));
        setDestList([...destList, itemToMove]);
    };

    const handleAddRow = () => {
        if (activeTab === 'register') {
            setItems([...items, { name: '', category: '', quantity: 1, unit: '個', price: 0 }]);
        } else {
            setExcludedItems([...excludedItems, { name: '', category: '', quantity: 1, unit: '個', price: 0 }]);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            // Only add items from the 'register' list
            // Map keys to match schema
            const itemsToAdd = items.map(item => ({
                name: item.name,
                category: item.category,
                quantity: Number(item.quantity),
                threshold: 1,
                unit: item.unit,
                last_purchase_price: Number(item.price)
            }));

            if (itemsToAdd.length > 0) {
                await bulkAddItems(itemsToAdd);
                alert(`${itemsToAdd.length}件の商品を登録しました！`);
            } else {
                alert('登録する商品がありません');
            }
            onClose();
            // window.location.reload(); // RevalidatePath should handle update, no reload needed ideally
        } catch (error) {
            console.error(error);
            alert('登録に失敗しました: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderList = (listType, listItems) => (
        <div className={styles.content}>
            {listItems.length === 0 && (
                <div className={styles.emptyState}>
                    <p>{listType === 'register' ? '登録するアイテムはありません' : '除外されたアイテムはありません'}</p>
                </div>
            )}
            {listItems.map((item, index) => (
                <div key={index} className={styles.itemCard}>
                    <div className={styles.row}>
                        <div className={styles.col} style={{ flex: 1 }}>
                            <label className={styles.label}>商品名</label>
                            <input
                                type="text"
                                value={item.name}
                                className={styles.input}
                                onChange={(e) => handleItemChange(listType, index, 'name', e.target.value)}
                            />
                        </div>
                        <div className={styles.col} style={{ width: '120px' }}>
                            <label className={styles.label}>カテゴリ</label>
                            <input
                                type="text"
                                value={item.category}
                                list="categories"
                                className={styles.input}
                                onChange={(e) => handleItemChange(listType, index, 'category', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.col} style={{ width: '80px' }}>
                            <label className={styles.label}>個数</label>
                            <input
                                type="number"
                                value={item.quantity}
                                min="1"
                                className={styles.input}
                                onChange={(e) => handleItemChange(listType, index, 'quantity', e.target.value)}
                            />
                        </div>
                        <div className={styles.col} style={{ width: '100px' }}>
                            <label className={styles.label}>単位</label>
                            <select
                                value={item.unit || '個'}
                                className={styles.input}
                                onChange={(e) => handleItemChange(listType, index, 'unit', e.target.value)}
                            >
                                <option value="個">個</option>
                                <option value="パック">パック</option>
                                <option value="ケース">ケース</option>
                            </select>
                        </div>
                        <div className={styles.col} style={{ flex: 1 }}>
                            <label className={styles.label}>金額(円)</label>
                            <input
                                type="number"
                                value={item.price}
                                placeholder="金額"
                                className={styles.input}
                                onChange={(e) => handleItemChange(listType, index, 'price', e.target.value)}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
                        <button
                            onClick={() => handleDelete(listType, index)}
                            className={styles.btnDelete}
                        >
                            削除
                        </button>
                        <button
                            onClick={() => handleMove(listType, index)}
                            className={styles.btnMove}
                        >
                            {listType === 'register' ? '除外へ移動 👇' : '登録へ移動 👆'}
                        </button>
                    </div>
                </div>
            ))}
            <button
                onClick={handleAddRow}
                style={{
                    width: '100%',
                    padding: '1rem',
                    border: '1px dashed var(--border)',
                    background: 'rgba(255,255,255,0.02)',
                    color: 'var(--secondary)',
                    borderRadius: 'var(--radius)',
                    cursor: 'pointer',
                    marginTop: '1rem'
                }}
            >
                + アイテムを手動追加
            </button>
        </div>
    );

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        <span>🧾</span> スキャン結果の確認
                    </h2>
                </div>

                <div className={styles.tabs}>
                    <button
                        onClick={() => setActiveTab('register')}
                        className={`${styles.tab} ${activeTab === 'register' ? styles.tabActive : ''}`}
                    >
                        登録リスト ({items.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('exclude')}
                        className={`${styles.tab} ${activeTab === 'exclude' ? styles.tabActiveExclude : ''}`}
                    >
                        除外リスト ({excludedItems.length})
                    </button>
                </div>

                {activeTab === 'register' ? (
                    <>
                        <div style={{ padding: '1rem 1.5rem 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            在庫として登録するアイテムです。自動でカテゴリ分けされました。
                        </div>
                        {renderList('register', items)}
                    </>
                ) : (
                    <>
                        <div style={{ padding: '1rem 1.5rem 0', color: 'var(--danger)', fontSize: '0.9rem' }}>
                            生鮮食品など、今回は登録しないアイテムです。
                        </div>
                        {renderList('exclude', excludedItems)}
                    </>
                )}

                <div className={styles.footer}>
                    <button onClick={onClose} className={`${styles.btn} ${styles.btnCancel}`}>キャンセル</button>
                    <button
                        onClick={handleSubmit}
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        disabled={isSubmitting || items.length === 0}
                    >
                        {isSubmitting ? '登録中...' : `一括登録 (${items.length}件)`}
                    </button>
                </div>
            </div>
        </div>
    );
}
