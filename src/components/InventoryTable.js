'use client';

import { useState } from 'react';
import styles from './InventoryTable.module.css';
import { updateInventory } from '@/app/actions';

export default function InventoryTable({ initialItems, onEdit, onDelete }) {
    const [items, setItems] = useState(initialItems);
    const [search, setSearch] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'category', direction: 'asc' });

    if (initialItems !== items) {
        setItems(initialItems);
    }

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.category?.toLowerCase().includes(search.toLowerCase())
    );

    const sortedItems = [...filteredItems].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    const handleIncrement = async (id) => {
        await updateInventory(id, 1, 'purchase');
    };

    const handleDecrement = async (id) => {
        await updateInventory(id, -1, 'consume');
    };

    return (
        <div className={styles.container}>
            <div className={styles.controls}>
                <input
                    type="text"
                    placeholder="検索..."
                    className={styles.search}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th className={styles.th}>商品名</th>
                        <th className={styles.th}>カテゴリ</th>
                        <th className={styles.th} style={{ width: '80px' }}>在庫数</th>
                        <th className={styles.th} style={{ width: '60px' }}>単位</th>
                        <th className={styles.th}>前回価格</th>
                        <th className={styles.th}>消費予測</th>
                        <th className={styles.th}>操作</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedItems.map((item) => (
                        <tr key={item.id}>
                            <td className={styles.td} data-label="商品名">{item.name}</td>
                            <td className={styles.td} data-label="カテゴリ">{item.category}</td>

                            <td className={styles.td} data-label="在庫数">
                                <div className={styles.quantityControl}>
                                    <form action={async () => {
                                        const newQuantity = Math.max(0, item.quantity - 1);
                                        await updateInventory(item.id, -1, 'consumption');
                                    }}>
                                        <button type="submit" className={`${styles.btnQuantity} ${styles.btnMinus}`} disabled={item.quantity <= 0}>-</button>
                                    </form>
                                    <span className={`${styles.quantityValue} ${item.quantity <= (item.threshold || 1) ? styles.lowStock : ''}`}>
                                        {item.quantity}
                                    </span>
                                    <form action={async () => {
                                        await updateInventory(item.id, 1, 'purchase');
                                    }}>
                                        <button type="submit" className={`${styles.btnQuantity} ${styles.btnPlus}`}>+</button>
                                    </form>
                                </div>
                            </td>
                            <td className={styles.td} data-label="単位">{item.unit || '個'}</td>
                            <td className={styles.td} data-label="前回価格">{item.last_purchase_price ? `¥${item.last_purchase_price}` : '-'}</td>
                            <td className={styles.td} data-label="消費予測">
                                {item.predicted_next_purchase ? new Date(item.predicted_next_purchase).toLocaleDateString() : 'データ不足'}
                            </td>
                            <td className={styles.td} data-label="操作">
                                <div className={styles.actionButtons}>
                                    <button className={`${styles.btn} ${styles.btnIcon}`} onClick={() => onEdit(item)}>✏️</button>
                                    <button className={`${styles.btn} ${styles.btnIcon} ${styles.btnDelete}`} onClick={() => onDelete(item.id)}>🗑️</button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table >
        </div >
    );
}
