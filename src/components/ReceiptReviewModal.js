'use client';

import { useState, useEffect } from 'react';
import styles from './ReceiptReviewModal.module.css';
import { bulkAddItems, recordPurchase } from '@/app/actions';

export default function ReceiptReviewModal({ isOpen, onClose, scannedItems }) {
    if (!isOpen) return null;

    // scannedItems is now expected to be { store_name, purchase_date, items: [] } 
    // or just [] (backward compatibility for old scanner API if not updated immediately)
    // But since we updated the API, we interpret it as the new format.

    // Normalize data
    const initialData = Array.isArray(scannedItems)
        ? { store_name: '', purchase_date: null, items: scannedItems }
        : scannedItems;

    const [items, setItems] = useState([]);
    const [excludedItems, setExcludedItems] = useState([]);
    const [activeTab, setActiveTab] = useState('register'); // 'register' or 'exclude'
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [storeName, setStoreName] = useState(initialData.store_name || '');
    const [purchaseDate, setPurchaseDate] = useState(initialData.purchase_date || new Date().toISOString().split('T')[0]);

    useEffect(() => {
        const rawItems = initialData.items || [];
        const register = [];
        const exclude = [];
        rawItems.forEach(item => {
            const newItem = {
                ...item,
                unit: item.unit || '個',
                price: item.price || 0,
                // Keep raw_name for household account, use name for inventory
                raw_name: item.raw_name || item.name
            };
            if (item.is_fresh) {
                exclude.push(newItem);
            } else {
                register.push(newItem);
            }
        });
        setItems(register);
        setExcludedItems(exclude);
        setStoreName(initialData.store_name || '');
        setPurchaseDate(initialData.purchase_date || new Date().toISOString().split('T')[0]);
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
        const newItem = { name: '', raw_name: '', category: '', quantity: 1, unit: '個', price: 0 };
        if (activeTab === 'register') {
            setItems([...items, newItem]);
        } else {
            setExcludedItems([...excludedItems, newItem]);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            // 1. Inventory Registration (Only 'register' list)
            const inventoryItems = items.map(item => ({
                name: item.name,
                category: item.category,
                quantity: Number(item.quantity),
                threshold: 1,
                unit: item.unit,
                last_purchase_price: Number(item.price)
            }));

            if (inventoryItems.length > 0) {
                await bulkAddItems(inventoryItems);
            }

            // 2. Household Account Recording (ALL items)
            const allItems = [...items, ...excludedItems];
            if (allItems.length > 0) {
                const purchaseData = {
                    store_name: storeName,
                    purchase_date: purchaseDate,
                    items: allItems.map(item => ({
                        name: item.name, // Fallback
                        raw_name: item.raw_name || item.name, // Use raw name if available
                        price: Number(item.price),
                        quantity: Number(item.quantity),
                        category: item.category
                    }))
                };
                await recordPurchase(purchaseData);
            }

            alert(`登録完了！\n在庫: ${inventoryItems.length}件\n家計簿: ${allItems.length}件`);
            onClose();
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
                            <label className={styles.label}>商品名 (在庫用)</label>
                            <input
                                type="text"
                                value={item.name}
                                className={styles.input}
                                onChange={(e) => handleItemChange(listType, index, 'name', e.target.value)}
                            />
                            <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '2px' }}>元名: {item.raw_name || item.name}</div>
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

                <div className={styles.metaForm} style={{ padding: '0 1.5rem 1rem', display: 'flex', gap: '1rem', background: '#f9fafb', borderBottom: '1px solid #eee' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#666', marginBottom: '4px' }}>店名</label>
                        <input
                            type="text"
                            value={storeName}
                            onChange={(e) => setStoreName(e.target.value)}
                            className={styles.input}
                            style={{ width: '100%' }}
                        />
                    </div>
                    <div style={{ width: '150px' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#666', marginBottom: '4px' }}>購入日</label>
                        <input
                            type="date"
                            value={purchaseDate}
                            onChange={(e) => setPurchaseDate(e.target.value)}
                            className={styles.input}
                            style={{ width: '100%' }}
                        />
                    </div>
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
                            在庫・家計簿の両方に登録されます。
                        </div>
                        {renderList('register', items)}
                    </>
                ) : (
                    <>
                        <div style={{ padding: '1rem 1.5rem 0', color: 'var(--danger)', fontSize: '0.9rem' }}>
                            家計簿のみに登録されます（在庫には追加されません）。
                        </div>
                        {renderList('exclude', excludedItems)}
                    </>
                )}

                <div className={styles.footer}>
                    <button onClick={onClose} className={`${styles.btn} ${styles.btnCancel}`}>キャンセル</button>
                    <button
                        onClick={handleSubmit}
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        disabled={isSubmitting || (items.length === 0 && excludedItems.length === 0)}
                    >
                        {isSubmitting ? '登録中...' : `一括登録`}
                    </button>
                </div>
            </div>
        </div>
    );
}

