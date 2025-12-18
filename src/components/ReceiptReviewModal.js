'use client';

import { useState, useEffect } from 'react';
import styles from './AddItemModal.module.css'; // Reuse modal styles
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
        <div style={{ overflowY: 'auto', flex: 1, padding: '0.5rem 0' }}>
            {listItems.length === 0 && (
                <p style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>
                    {listType === 'register' ? '登録するアイテムはありません' : '除外されたアイテムはありません'}
                </p>
            )}
            {listItems.map((item, index) => (
                <div key={index} style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>商品名</label>
                            <input
                                type="text"
                                value={item.name}
                                onChange={(e) => handleItemChange(listType, index, 'name', e.target.value)}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                            />
                        </div>
                        <div style={{ width: '100px' }}>
                            <label style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>カテゴリ</label>
                            <input
                                type="text"
                                value={item.category}
                                list="categories"
                                onChange={(e) => handleItemChange(listType, index, 'category', e.target.value)}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                        <div style={{ width: '60px' }}>
                            <label style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>個数</label>
                            <input
                                type="number"
                                value={item.quantity}
                                min="1"
                                onChange={(e) => handleItemChange(listType, index, 'quantity', e.target.value)}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                            />
                        </div>
                        <div style={{ width: '80px' }}>
                            <label style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>単位</label>
                            <select
                                value={item.unit || '個'}
                                onChange={(e) => handleItemChange(listType, index, 'unit', e.target.value)}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                            >
                                <option value="個">個</option>
                                <option value="パック">パック</option>
                                <option value="ケース">ケース</option>
                            </select>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>金額(円)</label>
                            <input
                                type="number"
                                value={item.price}
                                placeholder="金額"
                                onChange={(e) => handleItemChange(listType, index, 'price', e.target.value)}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button
                            onClick={() => handleDelete(listType, index)}
                            style={{ padding: '0.5rem 1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px' }}
                        >
                            削除
                        </button>
                        <button
                            onClick={() => handleMove(listType, index)}
                            style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px' }}
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
                    padding: '0.75rem',
                    border: '1px dashed var(--border)',
                    background: 'transparent',
                    color: 'var(--secondary)',
                    borderRadius: '8px',
                    cursor: 'pointer'
                }}
            >
                + アイテムを追加
            </button>
        </div>
    );

    return (
        <div className={styles.overlay} style={{ zIndex: 1000 }}>
            <div className={styles.modal} style={{ maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                <h2 className={styles.title}>スキャン結果の確認</h2>

                <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1rem' }}>
                    <button
                        onClick={() => setActiveTab('register')}
                        style={{
                            flex: 1,
                            padding: '1rem',
                            background: activeTab === 'register' ? 'var(--background-hover)' : 'transparent',
                            border: 'none',
                            borderBottom: activeTab === 'register' ? '2px solid var(--primary)' : 'none',
                            fontWeight: activeTab === 'register' ? 'bold' : 'normal',
                            color: 'var(--foreground)'
                        }}
                    >
                        登録する ({items.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('exclude')}
                        style={{
                            flex: 1,
                            padding: '1rem',
                            background: activeTab === 'exclude' ? 'var(--background-hover)' : 'transparent',
                            border: 'none',
                            borderBottom: activeTab === 'exclude' ? '2px solid #ef4444' : 'none',
                            fontWeight: activeTab === 'exclude' ? 'bold' : 'normal',
                            color: 'var(--foreground)'
                        }}
                    >
                        除外リスト ({excludedItems.length})
                    </button>
                </div>

                {activeTab === 'register' ? (
                    <>
                        <p style={{ fontSize: '0.9rem', color: 'var(--secondary)', marginBottom: '0.5rem' }}>
                            在庫として管理するアイテムです。次回購入予測の対象になります。
                        </p>
                        {renderList('register', items)}
                    </>
                ) : (
                    <>
                        <p style={{ fontSize: '0.9rem', color: '#ef4444', marginBottom: '0.5rem' }}>
                            生鮮食品など、在庫管理しないアイテムです（今回は登録されません）。
                        </p>
                        {renderList('exclude', excludedItems)}
                    </>
                )}

                <div className={styles.actions} style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
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
