'use client';

import { useActionState } from 'react';
import { login } from '../auth-actions';
import styles from './login.module.css';

const initialState = {
    error: null,
};

export default function LoginPage() {
    const [state, formAction] = useActionState(login, initialState);

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>ログイン</h1>
                <p className={styles.description}>パスワードを入力してください</p>

                <form action={formAction} className={styles.form}>
                    <input
                        type="password"
                        name="password"
                        placeholder="パスワード"
                        required
                        className={styles.input}
                    />
                    {state?.error && <p className={styles.error}>{state.error}</p>}
                    <button type="submit" className={styles.button}>ログイン</button>
                </form>
            </div>
        </div>
    );
}
