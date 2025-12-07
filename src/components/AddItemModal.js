'use client';

import { useState } from 'react';
import styles from './AddItemModal.module.css';
import { addItem } from '@/app/actions';

export default function AddItemModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    const handleSubmit = async (formData) => {
        await addItem(formData);
        onClose();
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <h2 className={styles.title}>商品を追加</h2>
                <form action={handleSubmit} className={styles.form}>
                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="name">商品名</label>
                        <input type="text" id="name" name="name" required placeholder="例: マヨネーズ" />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="category">カテゴリ</label>
                        <input type="text" id="category" name="category" list="categories" placeholder="例: 調味料" />
                        <datalist id="categories">
                            <option value="調味料" />
                            <option value="消耗品" />
                            <option value="食品" />
                        </datalist>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="quantity">現在庫数</label>
                        <input type="number" id="quantity" name="quantity" defaultValue="1" min="0" />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="unit">単位</label>
                        <input type="text" id="unit" name="unit" placeholder="例: 個, 本" />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="threshold">通知閾値</label>
                        <input type="number" id="threshold" name="threshold" defaultValue="1" min="0" />
                    </div>

                    <div className={styles.actions}>
                        <button type="button" onClick={onClose} className={`${styles.btn} ${styles.btnCancel}`}>キャンセル</button>
                        <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>追加</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
