'use client';

import { useState } from 'react';
import styles from './AddItemModal.module.css';
import { addItem, updateItem } from '@/app/actions';

export default function AddItemModal({ isOpen, onClose, editItem = null }) {
    if (!isOpen) return null;

    const handleSubmit = async (formData) => {
        if (editItem) {
            await updateItem(editItem.id, formData);
        } else {
            await addItem(formData);
        }
        onClose();
    };

    // Import updateItem here or ensure it's imported at top level
    // Since we are replacing content, we need to make sure imports are correct.
    // However, the tool shows I'm only replacing function body.
    // I need to be careful about imports.
    // Actually, I should use multi_replace to fix imports too.
    // Or assume the user context handles imports?
    // Wait, the previous file view showed `import { addItem } from '@/app/actions';`
    // I need to add `updateItem` to imports.

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <h2 className={styles.title}>{editItem ? '商品を編集' : '商品を追加'}</h2>
                <form action={handleSubmit} className={styles.form}>
                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="name">商品名</label>
                        <input
                            type="text" id="name" name="name" required placeholder="例: マヨネーズ"
                            defaultValue={editItem?.name || ''}
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="category">カテゴリ</label>
                        <input
                            type="text" id="category" name="category" list="categories" placeholder="例: 調味料"
                            defaultValue={editItem?.category || ''}
                        />
                        <datalist id="categories">
                            <option value="調味料" />
                            <option value="消耗品" />
                            <option value="食品" />
                        </datalist>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="quantity">現在庫数</label>
                        <input
                            type="number" id="quantity" name="quantity" min="0"
                            defaultValue={editItem?.quantity || '1'}
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="threshold">通知閾値</label>
                        <input
                            type="number" id="threshold" name="threshold" min="0"
                            defaultValue={editItem?.threshold || '1'}
                        />
                    </div>

                    <div className={styles.actions}>
                        <button type="button" onClick={onClose} className={`${styles.btn} ${styles.btnCancel}`}>キャンセル</button>
                        <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>{editItem ? '保存' : '追加'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
